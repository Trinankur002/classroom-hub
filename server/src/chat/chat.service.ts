import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { ChatRoomType } from './chat.types';

@Injectable()
export class ChatService {

  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(ChatRoom)
    private roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatParticipant)
    private participantRepo: Repository<ChatParticipant>,
  ) { }

  async createRoom(dto: CreateRoomDto) {

    if (dto.type === 'DIRECT' && dto.participantIds.length === 2) {

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
    });

    return this.messageRepo.save(message);
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
    teacherId: string,
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
}