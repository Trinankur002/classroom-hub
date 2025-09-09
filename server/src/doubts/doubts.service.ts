import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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

@Injectable()
export class DoubtsService {
  private readonly logger = new Logger(DoubtsService.name);
  constructor(
    @InjectRepository(Doubts)
    private readonly doubtsRepository: Repository<Doubts>,
    private readonly fileService: FileService,
    private readonly classroomService: ClassroomsService,
    private readonly userService: UsersService,
  ) { }

  async createDoubtWithFiles(
    data: CreateDoubtDto,
    files: Express.Multer.File[],
    user: User,
  ): Promise<Doubts> {
    return this.doubtsRepository.manager.transaction(
      async (manager) => {
        // 1. Validate classroom and that user is a student in it
        await this.classroomService.getClassRoomdetails(data.classroomId, user);

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

        return finalDoubt;
      });
  }

}
