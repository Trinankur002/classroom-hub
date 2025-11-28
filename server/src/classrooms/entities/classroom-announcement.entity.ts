import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    UpdateDateColumn,
    OneToMany,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IClassroomComment } from '../classrooms.interface';
import { Classroom } from './classroom.entity';
import { FileEntity } from '../../fileServices/file.entity';
import { Assignment } from 'src/assignments/assignment.entity';

@Entity('classroom_announcements')
export class ClassroomAnnouncement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'uuid' })
    classroomId: string;

    @ManyToOne(() => Classroom, (classroom) => classroom.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'classroomId' })
    classroom: Classroom;

    @Column({ type: 'uuid' })
    teacherId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'teacherId' })
    teacher: User;

    @OneToMany(() => FileEntity, (file) => file.announcement)
    files: FileEntity[];

    // @OneToMany(() => Assignment, (assignment) => assignment.announcement)
    // assignments: Assignment[];

    @Column({ type: 'jsonb', nullable: true })
    comments: IClassroomComment[];

    @Column({default : false})
    isAssignment: boolean

    @Column({ nullable: true, default: null })
    isNote: boolean;

    @Column({ nullable: true })
    dueDate: Date

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // --- Entity Listener ---
    /**
     * Executes before inserting and before updating the entity.
     * Ensures that if isNote is true, then isAssignment is false.
     */
    @BeforeInsert()
    @BeforeUpdate()
    setAssignmentStatus() {
        // Only run this logic if a value was explicitly provided for isNote
        // We use 'this.isNote === true' to handle null, undefined, and false cases gracefully.
        if (this.isNote === true) {
            this.isAssignment = false;
        }
    }
}
