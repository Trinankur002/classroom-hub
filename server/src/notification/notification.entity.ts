import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index, JoinColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    recipientId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'recipientId' })
    recipient: User;

    @Column()
    type: string;

    @Column('jsonb', { nullable: true })
    payload: any;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
