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

    @Column({ default: false })
    allowStudentMicrophone: boolean;

    @Column({ default: false })
    allowStudentCamera: boolean;

    @Column({ default: false })
    allowStudentScreenShare: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    endedAt: Date | null;
}
