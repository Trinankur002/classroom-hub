import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { ChatRoomType } from "../chat.types";

@Entity('chat_rooms')
export class ChatRoom {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ChatRoomType,
  })
  type: ChatRoomType;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true , unique: true})
  classroomId: string;

  @CreateDateColumn()
  createdAt: Date;
}