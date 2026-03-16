import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'boolean', default: true })
  email: boolean;

  @Column({ type: 'boolean', default: true })
  push: boolean;

  @Column({ type: 'boolean', default: true })
  messages: boolean;

  @Column({ type: 'boolean', default: true })
  assignments: boolean;

  @Column({ type: 'boolean', default: true })
  grades: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
