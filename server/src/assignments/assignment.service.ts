import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Assignment } from "./assignment.entity";
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
    ) { }

    async submitAssignment(announcementid: string, user: User, files: Express.Multer.File[]) {
        const existing = await this.getAssignmentSubmissionForStudentForAnnouncement(announcementid, user);
        if (existing.length > 0) {
            throw new HttpException('Assignment already submitted', HttpStatus.BAD_REQUEST);
        }

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

            if (announcement.dueDate) {
                const now = new Date();
                const gracePeriodDueDate = new Date(announcement.dueDate.getTime() + 2 * 60 * 1000);

                if (now > gracePeriodDueDate) {
                    throw new HttpException('Due date has passed', HttpStatus.BAD_REQUEST);
                }
            }

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
            });

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
            relations: ['files'],
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
            relations: ['announcement', 'user', 'files'],
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
            relations: ['files', 'student'],
            select: {
                id: true,
                announcementId: true,
                studentId: true,
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
