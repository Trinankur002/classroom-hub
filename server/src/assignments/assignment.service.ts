import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Assignment, AssignmentGradeHistoryEntry, AssignmentSubmissionStatus } from "./assignment.entity";
import { In, LessThan, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { FileService } from "src/fileServices/file.service";
import { FileEntity } from "src/fileServices/file.entity";
import { ClassroomAnnouncement } from "src/classrooms/entities/classroom-announcement.entity";
import { Role } from "src/users/entities/role.enum";
import { User } from "src/users/entities/user.entity";
import { v4 as uuid } from 'uuid';
import { getBucket } from "src/fileServices/gcs.config";
import { instanceToPlain } from "class-transformer";
import { EventService } from "src/event/event.service";
import { EventType } from "src/event/event.interface";


@Injectable()
export class AssignmentService {
    constructor(
        @InjectRepository(Assignment)
        private assignmentRepository: Repository<Assignment>,
        @InjectRepository(ClassroomAnnouncement)
        private announcementRepository: Repository<ClassroomAnnouncement>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private fileService: FileService,
        private eventService: EventService,
    ) { }

    private appendGradeHistory(
        assignment: Assignment,
        teacherId: string,
    ) {
        const history: AssignmentGradeHistoryEntry[] = Array.isArray(assignment.gradeHistory)
            ? assignment.gradeHistory
            : [];

        history.push({
            gradedAt: new Date().toISOString(),
            gradedById: teacherId,
            grade: assignment.grade ?? null,
            feedback: assignment.feedback ?? null,
            status: assignment.status,
            isLate: !!assignment.isLate,
            isResubmission: !!assignment.isResubmission,
        });

        assignment.gradeHistory = history;
    }

    async submitAssignment(announcementid: string, user: User, files: Express.Multer.File[]) {
        return await this.assignmentRepository.manager.transaction(async (manager) => {
            // ... (existing code for finding student and announcement) ...

            const student = await this.userRepository.findOne({ where: { id: user.id, role: Role.Student } });
            if (!student) {
                throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
            }

            const announcement = await this.announcementRepository.findOne({ where: { id: announcementid } });
            if (!announcement) {
                throw new HttpException('Announcement not found', HttpStatus.NOT_FOUND);
            }

            const existingSubmissionCount = await manager.count(Assignment, {
                where: {
                    announcementId: announcement.id,
                    studentId: student.id,
                },
            });

            const now = new Date();
            const isLateSubmission = !!announcement.dueDate && now > new Date(announcement.dueDate);

            const fileEntities: FileEntity[] = [];
            if (files?.length) {
                await Promise.all(
                    files.map(async (file) => {
                        const fileKey = `${uuid()}-${file.originalname}`;
                        const gcsBucket = getBucket();
                        const blob = gcsBucket.file(fileKey);

                        await blob.save(file.buffer, {
                            contentType: file.mimetype,
                            resumable: false,
                        });

                        const [url] = await blob.getSignedUrl({
                            action: "read",
                            expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
                        });

                        const fileEntity = manager.create(FileEntity, {
                            name: file.originalname,
                            role: user.role,
                            userId: user.id,
                            key: fileKey,
                            url,
                            size: file.size,
                            mimetype: file.mimetype,
                        });
                        fileEntities.push(fileEntity);
                    })
                );
            }

            const assignment = manager.create(Assignment, {
                announcementId: announcement.id,
                studentId: student.id,
                files: fileEntities,
                fileUrl: fileEntities[0]?.url,
                status: isLateSubmission ? AssignmentSubmissionStatus.LATE : AssignmentSubmissionStatus.SUBMITTED,
                isLate: isLateSubmission,
                isResubmission: existingSubmissionCount > 0,
            });

            this.eventService.createEvent({
                type: EventType.ASSIGNMENT_SUBMITTED,
                actorId: user.id,
                announcementId: announcement.id,
                classroomId: announcement.classroomId,
            })

            return await manager.save(assignment);
        });
    }

    //  For Student Only

    async getAssignmentSubmissionForStudentForAnnouncement(announcementid: string, user: User) { 
        const data = await this.assignmentRepository.find({
            where: {
                announcementId: announcementid,
                studentId: user.id,
            },
            relations: ['files', 'gradedBy'],
            order: {
                createdAt: 'DESC',
            },
        });
        return instanceToPlain(data);
    }

    async getPendingForClassroomForStudent(classroomId: string, user: User): Promise<ClassroomAnnouncement[]> {
        const announcements = await this.announcementRepository.find({
            where: {
                classroom: { id: classroomId },
                isAssignment: true,
            },
            relations: ['files'],
        });

        if (announcements.length === 0) {
            return [];
        }

        const announcementIds = announcements.map(a => a.id);

        const submitted = await this.assignmentRepository.find({
            where: { studentId: user.id, announcementId: In(announcementIds) },
            select: ['announcementId'],
        });

        const submittedIds = new Set(submitted.map(s => s.announcementId));
        return announcements.filter(a => !submittedIds.has(a.id));
    }

    async getSubmittedForClassroomForStudent(classroomId: string, user: User): Promise<Assignment[]> {
        return await this.assignmentRepository.find({
            where: {
                studentId: user.id ,
                announcement: { classroom: { id: classroomId } },
            },
            relations: ['announcement', 'student', 'files', 'gradedBy'],
            order: {
                createdAt: 'DESC',
            },
        });
    }

    // async getAllPendingAssignmentsForStudent(user: User): Promise<ClassroomAnnouncement[]> {
    //     const now = new Date();
    //     // Subquery to get IDs of announcements already submitted by the student
    //     const submittedAnnouncementIdsQuery = this.assignmentRepository
    //         .createQueryBuilder('assignment')
    //         .select('assignment.announcementId')
    //         .where('assignment.studentId = :studentId');

    //     // Main query to get announcements from classrooms the student is in,
    //     // excluding the ones they have already submitted.
    //     return this.announcementRepository
    //         .createQueryBuilder('announcement')
    //         .leftJoinAndSelect('announcement.files', 'files')
    //         .innerJoin('announcement.classroom', 'classroom')
    //         .innerJoin('classroom.students', 'student_classroom', 'student_classroom.studentId = :studentId')
    //         .where('announcement.isAssignment = true')
    //         .andWhere(`announcement.id NOT IN (${submittedAnnouncementIdsQuery.getQuery()})`)
    //         .andWhere('(announcement.dueDate IS NULL OR announcement.dueDate >= :now)')
    //         .setParameters({ studentId: user.id, now })
    //         .getMany();
    // }

    async getAllPendingAssignmentsForStudent(user: User): Promise<ClassroomAnnouncement[]> {
        const now = new Date();

        return this.announcementRepository
            .createQueryBuilder('announcement')
            .leftJoinAndSelect('announcement.files', 'files')
            .innerJoin('announcement.classroom', 'classroom')
            .innerJoin('classroom.students', 'student_classroom', 'student_classroom.studentId = :studentId', { studentId: user.id })
            .where('announcement.isAssignment = true')
            // .andWhere(qb => {
            //     const subQuery = qb.subQuery()
            //         .select('assignment.announcementId')
            //         .from('assignment', 'assignment')
            //         .where('assignment.studentId = :studentId');
            //     return 'announcement.id NOT IN ' + subQuery.getQuery();
            // })
            .andWhere('(announcement.dueDate IS NULL OR announcement.dueDate >= :now)')
            .setParameters({ studentId: user.id, now })
            .getMany();
    }

    async getMissedForClassroomForStudent(classroomId: string, user: User): Promise<ClassroomAnnouncement[]> {
        const now = new Date();

        const announcements = await this.announcementRepository.find({
            where: {
                classroom: { id: classroomId },
                isAssignment: true,
                dueDate: LessThan(now),
            },
            relations: ['files'],
        });

        if (announcements.length === 0) {
            return [];
        }

        const announcementIds = announcements.map(a => a.id);

        const submitted = await this.assignmentRepository.find({
            where: { studentId: user.id, announcementId: In(announcementIds) },
            select: ['announcementId'],
        });

        const submittedIds = new Set(submitted.map(s => s.announcementId));
        return announcements.filter(a => !submittedIds.has(a.id));
    }

    async getAllMissedForStudent(user: User): Promise<ClassroomAnnouncement[]> {
        const now = new Date();
        const submittedAnnouncementIdsQuery = this.assignmentRepository
            .createQueryBuilder('assignment')
            .select('assignment.announcementId')
            .where('assignment.studentId = :studentId', { studentId: user.id });

        return this.announcementRepository
            .createQueryBuilder('announcement')
            .leftJoinAndSelect('announcement.files', 'files')
            .innerJoin('announcement.classroom', 'classroom')
            .innerJoin('classroom.students', 'student_classroom', 'student_classroom.studentId = :studentId', {
                studentId: user.id,
            })
            .where('announcement.isAssignment = true')
            .andWhere('announcement.dueDate < :now', { now })
            .andWhere(`announcement.id NOT IN (${submittedAnnouncementIdsQuery.getQuery()})`)
            .setParameters(submittedAnnouncementIdsQuery.getParameters())
            .getMany();
    }

    //For Teacher only..

    async getAllSubmitedAssignmentsForAnnouncement(announcementid: string, user: User):Promise<Assignment[]> {
        const announcement = await this.announcementRepository.findOne({ where: { id: announcementid, teacherId: user.id } });
        if (!announcement) {
            throw new HttpException('Announcement not found or you are not authorized to view its submissions.', HttpStatus.NOT_FOUND);
        }

        return await this.assignmentRepository.find({
            where: {
                announcementId: announcementid,
            },
            relations: ['files', 'student', 'gradedBy'],
            order: {
                createdAt: 'DESC',
            },
            select: {
                id: true,
                announcementId: true,
                studentId: true,
                fileUrl: true,
                grade: true,
                feedback: true,
                status: true,
                isLate: true,
                isResubmission: true,
                gradeHistory: true,
                gradedAt: true,
                gradedById: true,
                gradedBy: {
                    id: true,
                    name: true,
                    email: true,
                },
                student: {
                    id: true,
                    name: true,
                    email: true,
                },
                files : true,
                createdAt: true,
                updatedAt: true,
            }
        });
       
    }

    async gradeSubmission(
        submissionId: string,
        user: User,
        payload: {
            grade?: number;
            feedback?: string;
            status?: AssignmentSubmissionStatus;
            isResubmission?: boolean;
        },
    ): Promise<Assignment> {
        if (user.role !== Role.Teacher) {
            throw new HttpException('Only teachers can grade submissions.', HttpStatus.FORBIDDEN);
        }

        const assignment = await this.assignmentRepository.findOne({
            where: { id: submissionId },
            relations: ['announcement', 'student', 'files', 'gradedBy'],
        });

        if (!assignment) {
            throw new HttpException('Submission not found.', HttpStatus.NOT_FOUND);
        }

        const announcement = await this.announcementRepository.findOne({
            where: { id: assignment.announcementId, teacherId: user.id },
        });

        if (!announcement) {
            throw new HttpException('You are not authorized to grade this submission.', HttpStatus.FORBIDDEN);
        }

        const hasGradeChange = payload.grade !== undefined;
        const hasFeedbackChange = payload.feedback !== undefined;
        const hasExplicitStatus =
            payload.status !== undefined && payload.status !== AssignmentSubmissionStatus.LATE;
        const computedIsLate = !!announcement.dueDate && new Date(assignment.createdAt) > new Date(announcement.dueDate);

        if (payload.grade !== undefined && Number.isNaN(payload.grade)) {
            throw new HttpException('Grade must be a valid number.', HttpStatus.BAD_REQUEST);
        }

        if (
            payload.grade !== undefined &&
            announcement.totalMarks !== undefined &&
            announcement.totalMarks !== null &&
            payload.grade > announcement.totalMarks
        ) {
            throw new HttpException(
                `Grade cannot be greater than total marks (${announcement.totalMarks}).`,
                HttpStatus.BAD_REQUEST,
            );
        }

        if (payload.grade !== undefined) {
            assignment.grade = payload.grade;
        }

        if (payload.feedback !== undefined) {
            assignment.feedback = payload.feedback;
        }

        // Late is always derived from due date and submission time.
        assignment.isLate = computedIsLate;

        if (payload.isResubmission !== undefined) {
            assignment.isResubmission = payload.isResubmission;
        }

        if (payload.status && payload.status !== AssignmentSubmissionStatus.LATE) {
            assignment.status = payload.status;
        } else if (hasGradeChange || hasFeedbackChange) {
            assignment.status = AssignmentSubmissionStatus.GRADED;
        } else if (assignment.isLate) {
            assignment.status = AssignmentSubmissionStatus.LATE;
        } else {
            assignment.status = AssignmentSubmissionStatus.SUBMITTED;
        }

        if (hasGradeChange || hasFeedbackChange || hasExplicitStatus) {
            assignment.gradedAt = new Date();
            assignment.gradedById = user.id;
        }

        this.appendGradeHistory(assignment, user.id);

        const saved = await this.assignmentRepository.save(assignment);

        const updated = await this.assignmentRepository.findOne({
            where: { id: saved.id },
            relations: ['files', 'student', 'gradedBy'],
        });

        if (!updated) {
            throw new HttpException('Failed to load graded submission.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        this.eventService.createEvent({
            type: EventType.ASSIGNMENT_GRADED,
            actorId: user.id,
            classroomId: announcement.classroomId,
            targetUserId: assignment.studentId,
            assignmentId: updated.id,
            announcementId: assignment.announcementId,
        });

        return updated;
    }

    async getPendingStudentsForAnnouncement(announcementid: string, user: User): Promise<User[]> {
        // 1. Verify the user is the teacher for the announcement's classroom.
        const data = await this.announcementRepository.findOne({
            where: { id: announcementid, teacherId: user.id },
            relations: ['classroom', 'classroom.students', 'classroom.students.student'],
        });
        const announcement = instanceToPlain(data);

        if (!announcement) {
            throw new HttpException('Announcement not found or you are not authorized.', HttpStatus.NOT_FOUND);
        }

        // 2. Get all student IDs who have submitted
        const submissions = await this.assignmentRepository.find({
            where: { announcementId: announcementid },
            select: ['studentId'],
        });
        const submittedStudentIds = new Set(submissions.map(s => s.studentId));

        // 3. Filter the classroom's students
        return announcement.classroom.students
            .filter(sc => sc.student && !submittedStudentIds.has(sc.student.id))
            .map(sc => sc.student);
    }

    // This function is not being used right now...
    async getPendingStudentsForClassroom(classroomId: string, user: User): Promise<User[]> {
        const data = await this.announcementRepository.find({
            where: {
                classroom: { id: classroomId },
                teacherId: user.id,
            },
            relations: ['classroom', 'classroom.students', 'classroom.students.student'],
        });
        const announcements = instanceToPlain(data);

        if (announcements.length === 0) {
            return [];
        }

        const announcementIds = announcements.map(a => a.id);

        const submissions = await this.assignmentRepository.find({
            where: { announcementId: In(announcementIds) },
            select: ['announcementId', 'studentId'],
        });

        const submissionsByAnnouncement = submissions.reduce((acc, sub) => {
            if (!acc[sub.announcementId]) {
                acc[sub.announcementId] = new Set<string>();
            }
            acc[sub.announcementId].add(sub.studentId);
            return acc;
        }, {} as Record<string, Set<string>>);

        const pendingStudentsMap = new Map<string, User>();

        announcements.forEach(ann => {
            const submittedStudentIds = submissionsByAnnouncement[ann.id] || new Set<string>();
            ann.classroom.students
                .filter(sc => sc.student && !submittedStudentIds.has(sc.student.id))
                .forEach(sc => {
                    if (!pendingStudentsMap.has(sc.student.id)) {
                        pendingStudentsMap.set(sc.student.id, sc.student);
                    }
                });
        });
        
        return Array.from(pendingStudentsMap.values());
    }
}
