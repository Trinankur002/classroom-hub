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
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IClassroomComment } from '../classrooms.interface';
import { Classroom } from './classroom.entity';
import { FileEntity } from '../../fileServices/file.entity';

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

    @Column({ type: 'jsonb', nullable: true })
    comments: IClassroomComment[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
