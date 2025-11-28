import { Injectable, NotFoundException, ConflictException, ForbiddenException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Classroom } from './entities/classroom.entity';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { User } from '../users/entities/user.entity';
import { StudentClassroom } from './entities/student-classroom.entity';
import { Role } from '../users/entities/role.enum';
import { IClassroom, IClassroomComment, IClassroomUser } from './classrooms.interface';
import { ClassroomAnnouncement } from './entities/classroom-announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto'; // Import CreateAnnouncementDto
import { FileEntity } from '../fileServices/file.entity'; // Import FileEntity
import { FileService } from '../fileServices/file.service'; // Import FileService
import { getBucket } from 'src/fileServices/gcs.config';
import { v4 as uuid } from 'uuid';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UsersService } from 'src/users/users.service';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { EventService } from 'src/event/event.service';
import { EventType } from 'src/event/event.interface';

@Injectable()
export class ClassroomsService {
  constructor(
    @InjectRepository(Classroom)
    private classroomsRepository: Repository<Classroom>,
    @InjectRepository(StudentClassroom)
    private studentClassroomsRepository: Repository<StudentClassroom>,
    @InjectRepository(ClassroomAnnouncement)
    private classroomAnnouncementsRepository: Repository<ClassroomAnnouncement>,
    private fileService: FileService,
    private userService: UsersService,
    @Inject(forwardRef(() => EventService))
    private readonly eventService: EventService,
  ) { }

  async create(
    createClassroomDto: CreateClassroomDto,
    teacher: User,
  ): Promise<Classroom> {
    const { nanoid } = await import('nanoid');
    const joinCode = nanoid(10);
    const classroom = this.classroomsRepository.create({

      ...createClassroomDto,
      teacherId: teacher.id,
      joinCode,
    });
    return this.classroomsRepository.save(classroom);
  }

  async findByJoinCode(joinCode: string): Promise<Classroom | null> {
    return this.classroomsRepository.findOne({ where: { joinCode } });
  }

  async join(joinCode: string, student: User): Promise<StudentClassroom> {

    const classroom = await this.classroomsRepository.findOne({ where: { joinCode } });
    if (!classroom) {
      throw new NotFoundException('Classroom not found.');
    }

    if (student.role !== Role.Student) {
      throw new ConflictException('Only students can join a classroom.');
    }

    const existing = await this.studentClassroomsRepository.findOne({
      where: { classroomId: classroom.id, studentId: student.id },
    });

    if (existing) {
      throw new ConflictException('Student is already in this classroom.');
    }

    const studentClassroom = this.studentClassroomsRepository.create({
      classroomId: classroom.id,
      studentId: student.id,
    });

    const classroomEntity = await this.studentClassroomsRepository.save(studentClassroom);
    classroom.studentCount++;
    await this.classroomsRepository.save(classroom);
    return classroomEntity;

  }

  async findAllForUser(user: User): Promise<IClassroom[]> {
    if (user.role === Role.Teacher) {
      return this.classroomsRepository
        .createQueryBuilder('classroom')
        .leftJoinAndSelect('classroom.teacher', 'teacher')
        .select([
          'classroom.id',
          'classroom.name',
          'classroom.joinCode',
          'classroom.createdAt',
          'classroom.updatedAt',
          'classroom.description',
          'classroom.studentCount',
          'teacher.id',
          'teacher.name',
        ])
        .where('classroom.teacherId = :teacherId', { teacherId: user.id })
        .getMany();
    }

    if (user.role === Role.Student) {
      const studentClassrooms = await this.studentClassroomsRepository.find({
        where: { studentId: user.id },
        relations: ['classroom', 'classroom.teacher'],
      });

      // Map the results to the IClassroom interface
      return studentClassrooms.map((sc) => {
        const classroom = sc.classroom;
        return {
          id: classroom.id,
          name: classroom.name,
          description: classroom.description,
          joinCode: classroom.joinCode,
          teacherId: classroom.teacherId,
          teacher: {
            id: classroom.teacher.id,
            name: classroom.teacher.name,
          },
          createdAt: classroom.createdAt,
          updatedAt: classroom.updatedAt,
        };
      });
    }

    return [];
  }

  async getClassRoomdetails(classroomId: string, user: User): Promise<IClassroom> {
    if (user.role === Role.Teacher) {
      const classroom = await this.classroomsRepository
        .createQueryBuilder('classroom')
        .leftJoinAndSelect('classroom.teacher', 'teacher')
        .select([
          'classroom.id',
          'classroom.name',
          'classroom.joinCode',
          'classroom.createdAt',
          'classroom.updatedAt',
          'classroom.description',
          'classroom.studentCount',
          'classroom.teacherId',
          'teacher.id',
          'teacher.name',
        ])
        .where('classroom.id = :classroomId', { classroomId })
        .andWhere('classroom.teacherId = :teacherId', { teacherId: user.id })
        .getOne();

      if (!classroom) {
        throw new NotFoundException(`Classroom with id ${classroomId} not found`);
      }

      return {
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        joinCode: classroom.joinCode,
        teacherId: classroom.teacherId,
        teacher: {
          id: classroom.teacher.id,
          name: classroom.teacher.name,
        },
        studentCount: classroom.studentCount,
        createdAt: classroom.createdAt,
        updatedAt: classroom.updatedAt,
      };
    }

    if (user.role === Role.Student) {
      const studentClassroom = await this.studentClassroomsRepository.findOne({
        where: { classroomId, studentId: user.id },
        relations: ['classroom', 'classroom.teacher'],
      });

      if (!studentClassroom) {
        throw new NotFoundException(
          `Classroom with id ${classroomId} not found for this student`,
        );
      }

      const classroom = studentClassroom.classroom;

      return {
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        joinCode: classroom.joinCode,
        teacherId: classroom.teacherId,
        teacher: {
          id: classroom.teacher.id,
          name: classroom.teacher.name,
        },
        studentCount: classroom.studentCount,
        createdAt: classroom.createdAt,
        updatedAt: classroom.updatedAt,
      };
    }

    throw new NotFoundException(`Classroom with id ${classroomId} not found`);
  }

  async createAnnouncement(
    data: CreateAnnouncementDto,
    user: User,
  ): Promise<ClassroomAnnouncement> {
    return this.classroomAnnouncementsRepository.manager.transaction(
      async (manager) => {
        // 1. Validate classroom existence and teacher ownership
        const classroom = await manager.findOne(Classroom, {
          where: { id: data.classroomId, teacherId: user.id },
        });

        if (!classroom) {
          throw new NotFoundException(
            `Classroom with ID "${data.classroomId}" not found or you are not the teacher.`,
          );
        }

        // Ensure only teachers can create announcements
        if (user.role !== Role.Teacher) {
          throw new ForbiddenException('Only teachers can create announcements.');
        }

        // 2. Create and save the announcement shell to get an ID
        const announcement = manager.create(ClassroomAnnouncement, {
          name: data.name,
          description: data.description,
          classroomId: data.classroomId,
          teacherId: user.id,
        });
        if (data.isAssignment) {
          announcement.isAssignment = true;
          announcement.dueDate = data.dueDate;
        }
        const savedAnnouncement = await manager.save(announcement);

        // 3. Associate files if provided
        if (data.filesIds?.length) {
          await manager.update(
            FileEntity,
            { id: In(data.filesIds) },
            { announcementId: savedAnnouncement.id },
          );
        }

        if (savedAnnouncement.isAssignment) {
          this.eventService.createEvent({
            type: EventType.ASSIGNMENT_CREATED,
            actorId: user.id,
            classroomId: data.classroomId,
            announcementId: savedAnnouncement.id,
          })
        } else if (!savedAnnouncement.isAssignment) {
          this.eventService.createEvent({
            type: EventType.ANNOUNCEMENT_POSTED,
            actorId: user.id,
            classroomId: data.classroomId,
            announcementId: savedAnnouncement.id,
          })
        }

        // 4. Reload the announcement with relations
        const finalAnnouncement = await manager.findOne(ClassroomAnnouncement, {
          where: { id: savedAnnouncement.id },
          relations: ['files', 'teacher'],
        });

        if (!finalAnnouncement) {
          throw new NotFoundException(
            `Announcement with ID "${savedAnnouncement.id}" could not be found after creation.`,
          );
        }

        return finalAnnouncement;
      },
    );
  }

  async createAnnouncementWithFiles(
    data: CreateAnnouncementDto,
    files: Express.Multer.File[],
    user: User,
  ): Promise<ClassroomAnnouncement> {
    console.log('service called');

    return this.classroomAnnouncementsRepository.manager.transaction(async (manager) => {
      // 1. Validate classroom ownership
      const classroom = await manager.findOne(Classroom, {
        where: { id: data.classroomId, teacherId: user.id },
      });

      if (!classroom) {
        throw new NotFoundException(`Classroom not found or unauthorized`);
      }

      if (user.role !== Role.Teacher) {
        throw new ForbiddenException('Only teachers can create announcements.');
      }

      // --- 2. Save announcement (FIXED LOGIC) ---

      // Use local variables to explicitly determine final boolean values.
      let isAssignment = data.isAssignment === true;
      let isNote = data.isNote === true;

      // Backend Safety Check: Enforce exclusivity, prioritizing assignment.
      if (isAssignment && isNote) {
        isNote = false;
      }

      const announcement = manager.create(ClassroomAnnouncement, {
        name: data.name,
        description: data.description,
        classroomId: data.classroomId,
        teacherId: user.id,

        // FIX: Explicitly set boolean fields to ensure FALSE values are saved correctly.
        isAssignment: isAssignment,
        isNote: isNote,

        // Due date only applies if it is an assignment
        dueDate: isAssignment ? data.dueDate : undefined,
      });

      const savedAnnouncement = await manager.save(announcement);

      // 3. Upload files + save metadata (parallelized)
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

            await manager.save(FileEntity, {
              name: file.originalname,
              role: user.role,
              userId: user.id,
              key: fileKey,
              url,
              size: file.size,
              mimetype: file.mimetype,
              announcementId: savedAnnouncement.id,
            });
          }),
        );
      }

      // 4. Reload announcement with relations
      const finalAnnouncement = await manager.findOne(ClassroomAnnouncement, {
        where: { id: savedAnnouncement.id },
        relations: ["files", "teacher"],
        select: {
          id: true,
          name: true,
          description: true,
          classroomId: true,
          teacherId: true,
          isAssignment: true,
          isNote: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          teacher: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
          },
          files: {
            id: true,
            name: true,
            key: true,
            url: true,
            size: true,
            mimetype: true,
            createdAt: true,
          },
        },
      });

      // 5. Event Logging
      if (savedAnnouncement.isAssignment) {
        console.log('assignment posted');
        this.eventService.createEvent({
          type: EventType.ASSIGNMENT_CREATED,
          actorId: user.id,
          classroomId: data.classroomId,
          announcementId: savedAnnouncement.id,
        })
      } else {
        // Covers both Note and General Announcement (when neither isAssignment nor isNote is true)
        this.eventService.createEvent({
          type: EventType.ANNOUNCEMENT_POSTED,
          actorId: user.id,
          classroomId: data.classroomId,
          announcementId: savedAnnouncement.id,
        })
      }

      if (!finalAnnouncement) {
        throw new NotFoundException(
          `Announcement with ID "${savedAnnouncement.id}" could not be found after creation.`,
        );
      }
      return finalAnnouncement;
    });
  }

  async getAnnouncements(
    classroomId: string | string[],
    conditions: Record<string, any> = {},
    page?: number,
    count?: number
  ): Promise<ClassroomAnnouncement[]> {

    const whereClause: any = { ...conditions };

    // Handle single or multiple classroom IDs
    if (Array.isArray(classroomId)) {
      whereClause.classroomId = In(classroomId);
    } else {
      whereClause.classroomId = classroomId;
    }

    const paginationOptions =
      page && count
        ? {
          skip: (page - 1) * count,
          take: count,
        }
        : {};

    try {
      const announcements = await this.classroomAnnouncementsRepository.find({
        where: whereClause,
        relations: ["files", "teacher"],
        order: { createdAt: "DESC" },
        ...paginationOptions,
        select: {
          id: true,
          name: true,
          description: true,
          classroomId: true,
          teacherId: true,
          isAssignment: true,
          dueDate: true,
          isNote: true,
          createdAt: true,
          updatedAt: true,
          teacher: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
          },
          files: {
            id: true,
            name: true,
            key: true,
            url: true,
            size: true,
            mimetype: true,
            createdAt: true,
          },
        },
      });

      return announcements;
    } catch (error) {
      throw new Error("Failed to fetch announcements: " + error);
    }
  }

  async getNotesForStudent(
    {
      user,
      classroomId,
      page,
      count,
    }: {
      user: User;
      classroomId?: string;
      page?: number;
      count?: number;
    }
  ): Promise<ClassroomAnnouncement[]> {
    let classrooms: IClassroom[] = [];
    let announcements: ClassroomAnnouncement[] = [];

    if (!classroomId) {
      classrooms = await this.findAllForUser(user);

      const classroomIds = classrooms.map(classroom => classroom.id);
      announcements = await this.getAnnouncements(classroomIds, { isNote: true }, page, count);
    }
    else if (classroomId) {
      announcements = await this.getAnnouncements(classroomId, { isNote: true }, page, count);
    }
    return announcements;
  }

  async getAnnouncement(announcementId: string, user: User): Promise<ClassroomAnnouncement> {
    const announcement = await this.classroomAnnouncementsRepository.findOne({
      where: { id: announcementId },
      relations: ['files', 'teacher'],
      select: {
        id: true,
        name: true,
        description: true,
        classroomId: true,
        teacherId: true,
        isAssignment: true,
        dueDate: true,
        isNote: true,
        comments: true,
        createdAt: true,
        updatedAt: true,
        teacher: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
        },
        files: {
          id: true,
          name: true,
          key: true,
          url: true,
          size: true,
          mimetype: true,
          createdAt: true,
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with id ${announcementId} not found`);
    }

    return announcement;
  }

  async addCommentToAnouncement(data: CreateCommentDto, user: User): Promise<ClassroomAnnouncement> {
    // 1. Authorization: Fetch announcement and classroom to ensure user access
    const announcement = await this.classroomAnnouncementsRepository.findOne({
      where: { id: data.announcementId },
      relations: ['classroom'],
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with id ${data.announcementId} not found`);
    }

    // Check if the user is the teacher or a student in the classroom
    if (user.role === Role.Student) {
      // For a student, check if they are enrolled in the classroom
      const isStudentInClass = await this.studentClassroomsRepository.findOne({
        where: {
          classroomId: announcement.classroomId,
          studentId: user.id,
        },
      });

      if (!isStudentInClass) {
        throw new ForbiddenException(`You are not authorized to comment on this announcement.`);
      }
    } else if (user.role === Role.Teacher) {
      if (announcement.classroom.teacherId !== user.id) {
        throw new ForbiddenException(`You are not authorized to comment on this announcement.`);
      }
    } else {
      throw new ForbiddenException(`You are not authorized to comment on this announcement.`);
    }

    // 2. Retrieve mentioned user if applicable
    let mentionedUser: User | null = null;
    if (data.mentionedUserId) {
      mentionedUser = await this.userService.findById(data.mentionedUserId);
      if (!mentionedUser) {
        throw new NotFoundException(`User with id ${data.mentionedUserId} not found`);
      }
    }
    const newComment: IClassroomComment = {
      content: data.content,
      sender: user,
      time: new Date(data.time),
    };

    if (mentionedUser) {
      newComment.mentionedUser = mentionedUser;

      this.eventService.createEvent({
        type: EventType.MENTION,
        actorId: user.id,
        targetUserId: mentionedUser.id,
        classroomId: announcement.classroomId,
        announcementId: announcement.id,
        metadata: { newComment }
      })
    }
    if (!announcement.comments) {
      announcement.comments = [];
    }

    announcement.comments.push(newComment);
    const savedAnnouncement = await this.classroomAnnouncementsRepository.save(announcement);
    return savedAnnouncement;
  }

  async getAllClassroomUsers(
    classroomId: string,
    currentUser: User,
  ): Promise<IClassroomUser[]> {
    // Find the classroom and its teacher
    const classroom = await this.classroomsRepository.findOne({
      where: { id: classroomId },
      relations: ['teacher'],
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with id ${classroomId} not found`);
    }

    // Authorization: Only allow the teacher or an enrolled student to see the list of users.
    const isTeacher = classroom.teacherId === currentUser.id;
    const isStudentInClass = await this.studentClassroomsRepository.findOne({
      where: { classroomId, studentId: currentUser.id },
    });

    if (!isTeacher && !isStudentInClass) {
      throw new ForbiddenException(
        'You are not authorized to view the users of this classroom.',
      );
    }

    const teacher = classroom.teacher;

    // Find all students in the classroom
    const studentClassrooms = await this.studentClassroomsRepository.find({
      where: { classroomId },
      relations: ['student'],
    });

    const students = studentClassrooms.map((sc) => sc.student);

    const users: IClassroomUser[] = [];

    // Add the teacher to the list
    if (teacher) {
      users.push({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: 'Teacher',
        avatarUrl: teacher.avatarUrl,
        createdAt: teacher.createdAt,
      });
    }

    // Add all students to the list
    students.forEach((student) => {
      if (student) {
        users.push({
          id: student.id,
          name: student.name,
          email: student.email,
          role: 'Student',
          avatarUrl: student.avatarUrl,
          createdAt: student.createdAt,
        });
      }
    });

    return users;
  }

  async deleteAnnouncement(announcementId: string, user: User): Promise<void> {
    const announcement = await this.classroomAnnouncementsRepository.findOne({
      where: { id: announcementId },
      relations: ['files'],
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found.');
    }

    if (announcement.teacherId !== user.id && user.role !== Role.Teacher) {
      throw new ForbiddenException('You do not have permission to delete this announcement.');
    }

    const fileIds = announcement.files.map(file => file.id);
    if (fileIds.length > 0) {
      await this.fileService.deleteFiles(fileIds, user);
    }

    await this.classroomAnnouncementsRepository.delete(announcement.id);
  }

  async removeStudentFromClassroom(
    classroomId: string,
    studentId: string,
    user: User,
  ): Promise<void> {
    const classroom = await this.classroomsRepository.findOne({ where: { id: classroomId } });
    if (!classroom) {
      throw new NotFoundException('Classroom not found.');
    }
    const existing = await this.studentClassroomsRepository.findOne({
      where: { classroomId: classroom.id, studentId: studentId },
    });

    if (!existing) {
      throw new ConflictException('Student is not in this classroom.');
    }

    await this.studentClassroomsRepository.delete({
      classroomId: classroom.id,
      studentId: studentId,
    });

    // Decrement the count after a successful deletion
    classroom.studentCount--;
    await this.classroomsRepository.save(classroom);
    this.eventService.createEvent({
      type: EventType.STUDENT_REMOVED,
      actorId: user.id,
      classroomId: classroom.id,
      targetUserId: studentId,
    })
    return;
  }

  async leaveClassroom(classroomId: string, user: User): Promise<void> {
    if (user.role !== Role.Student) {
      throw new ForbiddenException('You are not a Student');
    }
    await this.removeStudentFromClassroom(classroomId, user.id, user)
    this.eventService.createEvent({
      type: EventType.STUDENT_LEFT,
      actorId: user.id,
      classroomId: classroomId,
    })
    return;
  }

  // Add the database transaction decorator to your method
  async deleteClassroom(classroomId: string, user: User): Promise<void> {
    if (user.role !== Role.Teacher) {
      throw new ForbiddenException('You are not a Teacher');
    }
    const classroom = await this.classroomsRepository.findOne({
      where: { id: classroomId, teacherId: user.id },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found or you are not the teacher.');
    }
    await this.classroomAnnouncementsRepository.delete({ classroomId: classroom.id });
    await this.studentClassroomsRepository.delete({ classroomId: classroom.id });
    await this.classroomsRepository.delete(classroomId);

  }

  async getStudentIds(classroomId: string): Promise<string[]> {
    const studentClassrooms = await this.studentClassroomsRepository.find({
      where: { classroomId },
      relations: ['student'],
    });

    const studentIds = studentClassrooms
      .filter((sc) => sc.student)
      .map((sc) => sc.student.id);

    return studentIds;
  }
}