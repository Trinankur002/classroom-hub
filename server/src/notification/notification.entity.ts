import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index('idx_notifications_user_id')
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 80 })
  type: string;

  @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
  entityId: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true, name: 'entity_type' })
  entityType: string | null;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any> | null;

  @Column({ type: 'varchar', length: 20, default: 'NORMAL' })
  priority: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  @Index('idx_notifications_is_read')
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Index('idx_notifications_created_at')
  createdAt: Date;
}
