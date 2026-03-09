import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { ChatRoomType } from './chat.types';
import { ClassroomsService } from 'src/classrooms/classrooms.service';
import { FileEntity } from 'src/fileServices/file.entity';
import { Role } from 'src/users/entities/role.enum';
import { v4 as uuid } from 'uuid';
import { getBucket } from 'src/fileServices/gcs.config';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ChatService {

  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(ChatRoom)
    private roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatParticipant)
    private participantRepo: Repository<ChatParticipant>,
    @Inject(forwardRef(() => ClassroomsService))
    private readonly classroomsService: ClassroomsService,
  ) { }

  async createRoom(dto: CreateRoomDto) {

    if (dto.type === ChatRoomType.DIRECT && dto.participantIds.length === 2) {

      const [user1, user2] = [...dto.participantIds].sort();

      const existingRoom = await this.roomRepo
        .createQueryBuilder('room')
        .innerJoin('chat_participants', 'p', 'p.roomId = room.id')
        .where('room.type = :type', { type: 'DIRECT' })
        .andWhere('p.userId IN (:...users)', { users: [user1, user2] })
        .groupBy('room.id')
        .having('COUNT(p.userId) = 2')
        .getOne();

      if (existingRoom) {
        return existingRoom;
      }
    }

    const room = this.roomRepo.create({
      type: dto.type,
      name: dto.name,
    });

    const savedRoom = await this.roomRepo.save(room);

    const participants = dto.participantIds.map(userId =>
      this.participantRepo.create({
        roomId: savedRoom.id,
        userId,
      })
    );

    await this.participantRepo.save(participants);

    return savedRoom;
  }

  async saveMessage(data: any) {

    const message = this.messageRepo.create({
      roomId: data.roomId,
      senderId: data.senderId,
      content: data.content,
      mentionedUserId: data.mentionedUserId || null,
    });

    const saved = await this.messageRepo.save(message);
    return this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['files', 'mentionedUser'],
    });
  }

  async saveMessageWithFiles(params: {
    roomId: string;
    sender: User;
    content: string;
    mentionedUserId?: string;
    files?: Express.Multer.File[];
  }) {
    return this.messageRepo.manager.transaction(async (manager) => {
      if (params.mentionedUserId) {
        const mentionedParticipant = await manager.findOne(ChatParticipant, {
          where: {
            roomId: params.roomId,
            userId: params.mentionedUserId,
          },
          select: ['id'],
        });
        if (!mentionedParticipant) {
          throw new ForbiddenException('Mentioned user is not a participant in this chat room.');
        }
      }

      const fileEntities: FileEntity[] = [];
      if (params.files?.length) {
        await Promise.all(
          params.files.map(async (file) => {
            const fileKey = `${uuid()}-${file.originalname}`;
            const gcsBucket = getBucket();
            const blob = gcsBucket.file(fileKey);

            await blob.save(file.buffer, {
              contentType: file.mimetype,
              resumable: false,
            });

            const [url] = await blob.getSignedUrl({
              action: 'read',
              expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
            });

            const fileEntity = manager.create(FileEntity, {
              name: file.originalname,
              role: params.sender.role as Role,
              userId: params.sender.id,
              key: fileKey,
              url,
              size: file.size,
              mimetype: file.mimetype,
            });
            fileEntities.push(fileEntity);
          }),
        );
      }

      const message = manager.create(Message, {
        roomId: params.roomId,
        senderId: params.sender.id,
        content: params.content,
        mentionedUserId: params.mentionedUserId || null,
        files: fileEntities,
      });

      const saved = await manager.save(message);
      return manager.findOne(Message, {
        where: { id: saved.id },
        relations: ['files', 'mentionedUser'],
      });
    });
  }

  async getMessages(roomId: string, page: number) {

    const limit = 20;
    return this.messageRepo.find({
      where: { roomId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async getUserRooms(userId: string) {

    const rooms = await this.participantRepo.find({
      where: { userId },
    });
    const roomIds = rooms.map((r) => r.roomId);
    return this.roomRepo.findByIds(roomIds);
  }

  async createClassroomChat(
    classroomId: string,
    teacherId?: string,
  ): Promise<ChatRoom> {

    const room = this.roomRepo.create({
      type: ChatRoomType.CLASSROOM,
      classroomId,
      name: `Classroom ${classroomId} Chat`,
    });

    const savedRoom = await this.roomRepo.save(room);

    return savedRoom;
  }

  async addParticipantToClassroomChat(classroomId: string, userId: string) {

    const room = await this.roomRepo.findOne({
      where: {
        classroomId,
        type: ChatRoomType.CLASSROOM
      }
    });

    if (!room) return;

    const exists = await this.participantRepo.findOne({
      where: {
        roomId: room.id,
        userId
      }
    });

    if (!exists) {

      await this.participantRepo.save({
        roomId: room.id,
        userId
      });

    }
  }

  async removeParticipantFromClassroomChat(
    classroomId: string,
    userId: string
  ) {

    const room = await this.roomRepo.findOne({
      where: {
        classroomId,
        type: ChatRoomType.CLASSROOM
      }
    });

    if (!room) return;

    await this.participantRepo.delete({
      roomId: room.id,
      userId
    });

  }

  async getClassroomChatRooms(classroomId: string,) {
    return await this.roomRepo.findOne({
      where: {
        classroomId,
        type: ChatRoomType.CLASSROOM
      }
    });
  }

  async getChatroomParticipants(chatRoomId: string): Promise<ChatParticipant[]> { 
    return await this.participantRepo.find({
      where: {
        roomId: chatRoomId
      },
      relations: ['user'],
      select: {
        id: true,
        roomId: true,
        userId: true,
        joinedAt: true,
        user: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    });
  }

  async getChatMessages(chatRoomId: string) { 
    return this.getChatMessagesPage(chatRoomId);
  }

  async assertUserBelongsToClassroom(userId: string, classroomId: string): Promise<void> {
    await this.classroomsService.assertUserBelongsToClassroom(userId, classroomId);
  }

  async assertUserBelongsToChatRoomClassroom(userId: string, chatRoomId: string): Promise<void> {
    const room = await this.roomRepo.findOne({
      where: { id: chatRoomId },
      select: ['id', 'classroomId'],
    });

    if (!room) {
      throw new NotFoundException(`Chat room with id ${chatRoomId} not found`);
    }

    if (!room.classroomId) {
      throw new ForbiddenException('This chat room is not linked to a classroom.');
    }

    await this.assertUserBelongsToClassroom(userId, room.classroomId);
  }

  async assertUserIsChatParticipant(userId: string, roomId: string): Promise<void> {
    const participant = await this.participantRepo.findOne({
      where: {
        roomId,
        userId,
      },
      select: ['id'],
    });

    if (!participant) {
      throw new ForbiddenException('You are no longer a participant in this chat room.');
    }
  }

  async assertMentionedUserIsParticipant(roomId: string, mentionedUserId?: string): Promise<void> {
    if (!mentionedUserId) return;
    const participant = await this.participantRepo.findOne({
      where: {
        roomId,
        userId: mentionedUserId,
      },
      select: ['id'],
    });

    if (!participant) {
      throw new ForbiddenException('Mentioned user is not a participant in this chat room.');
    }
  }

  async getChatMessagesPage(
    chatRoomId: string,
    options?: {
      before?: string;
      beforeMessageId?: string;
      limit?: number;
    }
  ) {

    const limit = Math.min(Math.max(options?.limit ?? 30, 1), 100);

    const query = this.messageRepo
      .createQueryBuilder('message')
      .where('message.roomId = :chatRoomId', { chatRoomId })
      .orderBy('message.createdAt', 'DESC')
      .addOrderBy('message.id', 'DESC')
      .take(limit + 1);

    if (options?.beforeMessageId) {
      const beforeMessageCursor = await this.messageRepo.findOne({
        where: { id: options.beforeMessageId, roomId: chatRoomId },
        select: ['id'],
      });

      if (!beforeMessageCursor) {
        throw new BadRequestException('Invalid "beforeMessageId" cursor.');
      }

      query
        .innerJoin(
          Message,
          'cursor_message',
          'cursor_message.id = :beforeMessageId AND cursor_message.roomId = :chatRoomId',
          { beforeMessageId: options.beforeMessageId, chatRoomId },
        )
        .andWhere(
          '(message.createdAt < cursor_message.createdAt OR (message.createdAt = cursor_message.createdAt AND message.id < cursor_message.id))',
        );
    } else if (options?.before) {
      const [beforeValue, beforeId] = options.before.split('::');
      const beforeDate = new Date(beforeValue);

      if (Number.isNaN(beforeDate.getTime())) {
        throw new BadRequestException('Invalid "before" cursor. Expected ISO date string.');
      }

      const beforeIso = beforeDate.toISOString();

      if (beforeId) {
        query.andWhere(
          '(message.createdAt < :before OR (message.createdAt = :before AND message.id != :beforeId))',
          { before: beforeIso, beforeId },
        );
      } else {
        query.andWhere('message.createdAt < :before', { before: beforeIso });
      }

    }

    const rows = await query.getMany();
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const pageIds = pageRows.map((row) => row.id);

    if (pageIds.length === 0) {
      return {
        messages: [],
        hasMore: false,
        nextCursor: null,
      };
    }

    const messageEntities = await this.messageRepo.find({
      where: {
        roomId: chatRoomId,
        id: In(pageIds),
      },
      relations: ['files', 'mentionedUser'],
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    });

    const messages = messageEntities.reverse();

    return {
      messages,
      hasMore,
      nextCursor: hasMore && messages.length
        ? `${messages[0].createdAt.toISOString()}::${messages[0].id}`
        : null,
    };
  }
}
