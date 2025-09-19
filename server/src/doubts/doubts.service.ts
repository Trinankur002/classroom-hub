import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { Doubts } from "./doubts.entity";
import { FileService } from "src/fileServices/file.service";
import { ClassroomsService } from "src/classrooms/classrooms.service";
import { UsersService } from "src/users/users.service";
import { User } from "src/users/entities/user.entity";
import { CreateDoubtDto } from "./dto/create-doubt.dto";
import { v4 as uuid } from 'uuid';
import { getBucket } from "src/fileServices/gcs.config";
import { FileEntity } from "src/fileServices/file.entity";
import { IDoubtClearMessages } from "./doubts.interface";
import { Role } from "src/users/entities/role.enum";
import { AddMessageDto } from "./dto/add-message.dto";
import { IClassroomUser } from "src/classrooms/classrooms.interface";
import { IClassroomFile } from "src/fileServices/file.interface";
import { EventService } from "src/event/event.service";
import { EventType } from "src/event/event.interface";

@Injectable()
export class DoubtsService {
  private readonly logger = new Logger(DoubtsService.name);
  constructor(
    @InjectRepository(Doubts)
    private readonly doubtsRepository: Repository<Doubts>,
    private readonly fileService: FileService,
    private readonly classroomService: ClassroomsService,
    private readonly userService: UsersService,
    private readonly eventService: EventService,
  ) { }

  async createDoubtWithFiles(
    data: CreateDoubtDto,
    files: Express.Multer.File[],
    user: User,
  ): Promise<Doubts> {
    return this.doubtsRepository.manager.transaction(
      async (manager) => {
        // 1. Validate classroom and that user is a student in it
        const classroom = await this.classroomService.getClassRoomdetails(data.classroomId, user);

        if (user.role !== Role.Student) {
          throw new ForbiddenException('You can only create doubts for yourself as a student.');
        }

        const doubt = manager.create(Doubts, {
          classroomId: data.classroomId,
          studentId: user.id,
          doubtDescribtion: data.doubtDescribtion,
        });
        const savedDoubt = await manager.save(doubt);

        // 3. Upload files + save metadata (parallelized)
        if (files?.length) {
          const fileEntities = await Promise.all(
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

              return manager.create(FileEntity, {
                name: file.originalname,
                role: user.role,
                userId: user.id,
                key: fileKey,
                url,
                size: file.size,
                mimetype: file.mimetype,
                doubt: savedDoubt,
              });
            }),
          );
          await manager.save(fileEntities);
        }

        // 4. Reload doubt with relations
        const finalDoubt = await manager.findOne(Doubts, {
          where: { id: savedDoubt.id },
          relations: ["files", "student", "classroom", "classroom.teacher"],
          select: {
            id: true,
            files: {
              id: true,
              name: true,
              key: true,
              url: true,
              size: true,
              mimetype: true,
              createdAt: true,
            },
            classroomId: true,
            classroom: {
              id: true,
              name: true,
              teacher: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
              },
            },
            studentId: true,
            student: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
            doubtDescribtion: true,
            messages: true,
            createdAt: true,
            updatedAt: true,
          }
        });

        if (!finalDoubt) {
          throw new NotFoundException(
            `Doubt with ID "${savedDoubt.id}" could not be found after creation.`,
          );
        }

        this.eventService.createEvent({
          type: EventType.NEW_DOUBT,
          actorId: user.id,
          classroomId: data.classroomId,
          targetUserId: classroom.teacherId,
          metadata: { finalDoubt }
        })

        return finalDoubt;
      });
  }

  async createdoubtMessage(
    data: AddMessageDto,
    file: Express.Multer.File,
    user: User,
  ): Promise<Doubts> {
    return this.doubtsRepository.manager.transaction(async (manager) => {
      const doubt = await manager.findOne(Doubts, {
        where: { id: data.doubtId },
        relations: ['classroom', 'classroom.teacher'],
      });

      if (!doubt) {
        throw new NotFoundException(`Doubt with ID "${data.doubtId}" not found.`);
      }

      // Authorization check
      const isStudentOwner =
        user.role === Role.Student && doubt.studentId === user.id;
      const isClassroomTeacher =
        user.role === Role.Teacher && doubt.classroom.teacher.id === user.id;

      if (!isStudentOwner && !isClassroomTeacher) {
        throw new ForbiddenException(
          'You are not authorized to post a message to this doubt.',
        );
      }

      let fileForMessage: IClassroomFile | undefined = undefined;

      if (file) {
        const fileKey = `${uuid()}-${file.originalname}`;
        const gcsBucket = getBucket();
        const blob = gcsBucket.file(fileKey);

        await blob.save(file.buffer, {
          contentType: file.mimetype,
          resumable: false,
        });

        const [url] = await blob.getSignedUrl({
          action: 'read',
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        });

        const newFileEntity = manager.create(FileEntity, {
          name: file.originalname,
          role: user.role,
          userId: user.id,
          key: fileKey,
          url,
          size: file.size,
          mimetype: file.mimetype,
          doubt: doubt,
        });
        const savedFile = await manager.save(newFileEntity);

        fileForMessage = {
          id: savedFile.id,
          name: savedFile.name,
          url: savedFile.url,
          mimetype: savedFile.mimetype,
          size: savedFile.size,
          key: savedFile.key,
          createdAt: savedFile.createdAt,
        };
      }

      const sender: IClassroomUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'Teacher' | 'Student',
        avatarUrl: user.avatarUrl,
      };

      const newMessage: IDoubtClearMessages = {
        message: data.message,
        time: new Date(),
        sender,
        file: fileForMessage,
      };

      doubt.messages = [...(doubt.messages || []), newMessage];

      await manager.save(doubt);

      // Return the full doubt object, similar to createDoubtWithFiles
      const finalDoubt = await manager.findOne(Doubts, {
        where: { id: doubt.id },
        select: {
          id: true,
          doubtDescribtion: true,
          messages: true,
        },
      });

      if (!finalDoubt) {
        throw new NotFoundException(
          `Doubt with ID "${doubt.id}" could not be found after update.`,
        );
      }

      return finalDoubt;
    });
  }

  async getDoubtsByClassroomId(classroomId: string, user: User, page?: number, limit?: number): Promise<Doubts[]> {
    // Define a base query object
    const queryOptions: FindManyOptions<Doubts> =  {
      where: {
        classroomId
      },
      order: {
        updatedAt: 'DESC',
      },
      relations: {
        student: true,
      },
      select: {
        id: true,
        classroomId: true,
        studentId: true,
        student: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
        },
        doubtDescribtion: true,
        createdAt: true,
        updatedAt: true,
      }
    };

    // Only apply skip and take if both page and limit are provided
    if (page && limit) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    // --- Student Role ---
    if (user.role === Role.Student) {
      return await this.doubtsRepository.find({
        ...queryOptions,
        where: {
          ...queryOptions.where,
          studentId: user.id,
        },
      });
    }

    // --- Teacher Role ---
    if (user.role === Role.Teacher) {
      return await this.doubtsRepository.find({
        ...queryOptions,
        where: {
          ...queryOptions.where,
          classroom: {
            teacher: {
              id: user.id,
            },
          },
        },
      });
    }

    return [];
  }

  async getDoubtMessages(doubtId: string, user: User): Promise<IDoubtClearMessages[]> {
    if (user.role === Role.Student) {
      const doubt = await this.doubtsRepository.findOne({
        where: {
          id: doubtId,
          studentId: user.id,
        },
      });

      if (doubt) {
        if (doubt.messages) {
          return doubt.messages
        }
        return []
      }
      throw new NotFoundException(`Doubt with ID "${doubtId}" not found.`);

    }
    if (user.role === Role.Teacher) {
      const doubt = await this.doubtsRepository.findOne({
        where: {
          id: doubtId,
          classroom: {
            teacher: {
              id: user.id,
            },
          },
        }
      })

      if (doubt) {
        if (doubt.messages) {
          return doubt.messages
        }
        return []
      }
      throw new NotFoundException(`Doubt with ID "${doubtId}" not found.`);
    }
    return []
  }
}
