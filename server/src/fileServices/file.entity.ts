import { Assignment } from "src/assignments/assignment.entity";
import { Classroom } from "src/classrooms/entities/classroom.entity";
import { ClassroomAnnouncement } from "src/classrooms/entities/classroom-announcement.entity";
import { Role } from "src/users/entities/role.enum";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Doubts } from "src/doubts/doubts.entity";

@Entity('files')
export class FileEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: Role,
        nullable: false
    })
    role: Role;

    @Column({ type: 'uuid', nullable: true })
    classroomId: string;
    @ManyToOne(() => Classroom)
    @JoinColumn({ name: 'classroomId' })
    classroom: Classroom;

    @Column({ type: 'uuid', nullable: true })
    announcementId: string;
    @ManyToOne(() => ClassroomAnnouncement, (announcement) => announcement.files, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'announcementId' })
    announcement: ClassroomAnnouncement;
        
    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid', nullable: true })
    assignmentId: string;
    @ManyToOne(() => Assignment, (assignment) => assignment.files, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assignmentId' })
    assignment: Assignment;

    @ManyToOne(() => Doubts, (doubt) => doubt.files, { onDelete: 'CASCADE' })
    doubt: Doubts;

    @Column({ nullable: true })
    url: string;

    @Column({ nullable: false })
    key: string;

    @Column({ nullable: false })
    size: number;

    @Column({ nullable: false })
    mimetype: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
