import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('live_session_messages')
export class LiveSessionMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  liveSessionId: string;

  @Column()
  senderId: string;

  @Column()
  senderName: string;

  @Column('text')
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
