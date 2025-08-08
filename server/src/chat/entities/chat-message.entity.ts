import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Classroom } from '../../classrooms/entities/classroom.entity';
import { User } from '../../users/entities/user.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  classroomId: string;

  @Column({ type: 'uuid' })
  senderId: string;

  @Column('text')
  message: string;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  mentions: { id: string; name: string }[];

  @ManyToOne(() => Classroom)
  @JoinColumn({ name: 'classroomId' })
  classroom: Classroom;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @CreateDateColumn()
  createdAt: Date;
}
