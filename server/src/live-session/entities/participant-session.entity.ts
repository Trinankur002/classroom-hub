import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { ParticipantRole, ParticipantStatus } from '../live-session.types';

@Entity('participant_sessions')
export class ParticipantSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    liveSessionId: string;

    @Column()
    userId: string;

    @Column({
        type: 'enum',
        enum: ParticipantRole,
    })
    role: ParticipantRole;

    @Column({
        type: 'enum',
        enum: ParticipantStatus,
        default: ParticipantStatus.WAITING,
    })
    status: ParticipantStatus;

    @Column({ default: false })
    handRaised: boolean;

    @Column({ default: false })
    isConnected: boolean;

    @CreateDateColumn()
    joinedAt: Date;

    @Column({ nullable: true })
    leftAt: Date;
}