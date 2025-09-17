import { Assignment } from "src/assignments/assignment.entity";
import { ClassroomAnnouncement } from "src/classrooms/entities/classroom-announcement.entity";
import { Classroom } from "src/classrooms/entities/classroom.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EventType } from "./event.interface";

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: EventType,
    })
    type: EventType;

    @Column({ type: 'uuid', nullable: true })
    actorId: string;
    // who performed the action (teacher or student)

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'actorId' })
    actor: User;

    @Column({ type: 'uuid', nullable: true })
    targetUserId: string;
    // optional: for mentions or actions directed at a user

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'targetUserId' })
    targetUser: User;

    @Column({ type: 'uuid', nullable: true })
    classroomId: string;

    @ManyToOne(() => Classroom, { nullable: true })
    @JoinColumn({ name: 'classroomId' })
    classroom: Classroom;

    @Column({ type: 'uuid', nullable: true })
    assignmentId: string;

    @ManyToOne(() => Assignment, { nullable: true })
    @JoinColumn({ name: 'assignmentId' })
    assignment: Assignment;

    @Column({ type: 'uuid', nullable: true })
    announcementId: string;

    @ManyToOne(() => ClassroomAnnouncement, { nullable: true })
    @JoinColumn({ name: 'announcementId' })
    announcement: ClassroomAnnouncement;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;
    // flexible extra info (submissionId, file info, comment snippet, due date, etc.)

    @CreateDateColumn()
    createdAt: Date;
}
