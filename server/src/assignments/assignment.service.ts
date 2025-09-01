import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Assignment } from "./assignment.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { FileService } from "src/fileServices/file.service";
import { FileEntity } from "src/fileServices/file.entity";
import { ClassroomAnnouncement } from "src/classrooms/entities/classroom-announcement.entity";
import { Role } from "src/users/entities/role.enum";
import { User } from "src/users/entities/user.entity";
import { v4 as uuid } from 'uuid';
import { getBucket } from "src/fileServices/gcs.config";


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


    // async createAssignment(announcement: ClassroomAnnouncement, studentId: string): Promise<Assignment> {
    //     const newAssignment = this.assignmentRepository.create({
    //         announcementId: announcement.id,
    //         studentId,
    //         isDone: false,
    //     });
    //     return this.assignmentRepository.save(newAssignment);
    // }

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

    // async markAsDone(assignmentId: string, studentId: string) {
    //     const assignment = await this.assignmentRepository.findOne({ where: { id: assignmentId, studentId }, relations: ['announcement'] });

    //     if (!assignment) {
    //         throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    //     }

    //     const now = new Date();
    //     const dueDate = new Date(assignment.announcement.dueDate);
    //     dueDate.setMinutes(dueDate.getMinutes() + 5);

    //     if (now > dueDate) {
    //         throw new HttpException('Assignment is past due date.', HttpStatus.BAD_REQUEST);
    //     }

    //     // assignment.isDone = true;
    //     return this.assignmentRepository.save(assignment);
    // }

    // async getPendingAssignments(studentId: string) {

    //     return this.assignmentRepository.find({
    //         where: {
    //             studentId,
    //             // isDone: false,
    //         },
    //         relations: ['announcement', 'announcement.classroom'],
    //     });
    // }

    // async getAssignmentSubmissions(announcementId: string) {
    //     return this.assignmentRepository.find({
    //         where: { announcementId },
    //         relations: ['student', 'files'],
    //     });
    // }

    // async getSubmissionStatus(announcementId: string, teacherId: string) {
    //     // First, verify the teacher is part of the classroom for this announcement.
    //     const announcement = await this.announcementRepository.findOne({
    //         where: { id: announcementId, teacherId },
    //         relations: ['classroom', 'classroom.students']
    //     });

    //     if (!announcement) {
    //         throw new HttpException('Announcement not found or you are not the teacher.', HttpStatus.NOT_FOUND);
    //     }

    //     const totalStudents = announcement.classroom.students.length;

    //     const [, submittedCount] = await this.assignmentRepository.findAndCount({
    //         // where: { announcementId, isDone: true }
    //     });

    //     return {
    //         submitted: submittedCount,
    //         pending: totalStudents - submittedCount,
    //         total: totalStudents,
    //     };
    // }
}
