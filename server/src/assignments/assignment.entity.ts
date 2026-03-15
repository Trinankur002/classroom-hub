import { ClassroomAnnouncement } from "src/classrooms/entities/classroom-announcement.entity";
import { FileEntity } from "src/fileServices/file.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum AssignmentSubmissionStatus {
    SUBMITTED = 'submitted',
    GRADED = 'graded',
    LATE = 'late',
}

export interface AssignmentGradeHistoryEntry {
    gradedAt: string;
    gradedById?: string;
    grade?: number | null;
    feedback?: string | null;
    status: AssignmentSubmissionStatus;
    isLate: boolean;
    isResubmission: boolean;
}

@Entity('assignments')
export class Assignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    announcementId: string;

    @ManyToOne(() => ClassroomAnnouncement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'announcementId' })
    announcement: ClassroomAnnouncement;

    @Column({ type: 'uuid' })
    studentId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studentId' })
    student: User;

    @OneToMany(() => FileEntity, (file) => file.assignment, { cascade: true, nullable: true })
    files: FileEntity[];

    @Column({ type: 'text', nullable: true })
    fileUrl?: string;

    @Column({ type: 'float', nullable: true })
    grade?: number;

    @Column({ type: 'text', nullable: true })
    feedback?: string;

    @Column({
        type: 'enum',
        enum: AssignmentSubmissionStatus,
        default: AssignmentSubmissionStatus.SUBMITTED,
    })
    status: AssignmentSubmissionStatus;

    @Column({ type: 'boolean', default: false })
    isLate: boolean;

    @Column({ type: 'boolean', default: false })
    isResubmission: boolean;

    @Column({ type: 'jsonb', nullable: true })
    gradeHistory?: AssignmentGradeHistoryEntry[];

    @Column({ type: 'timestamp', nullable: true })
    gradedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    gradedById?: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'gradedById' })
    gradedBy?: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}
