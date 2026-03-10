import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('live_sessions')
export class LiveSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    classroomId: string;

    @Column()
    teacherId: string;

    @Column()
    roomName: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isLocked: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    endedAt: Date;
}