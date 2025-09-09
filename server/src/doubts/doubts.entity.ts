import { FileEntity } from "src/fileServices/file.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Classroom } from "src/classrooms/entities/classroom.entity";
import { IDoubtClearMessages } from "./doubts.interface";

@Entity('doubts')
export class Doubts {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', nullable: true })
    doubtDescribtion?: string;

    @Column({ type: 'uuid', nullable: true })
    classroomId?: string;

    @ManyToOne(() => Classroom, (classroom) => classroom.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'classroomId' })
    classroom: Classroom;

    @Column({ type: 'uuid' })
    studentId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studentId' })
    student: User;

    @OneToMany(() => FileEntity, (file) => file.doubt, { cascade: true, nullable: true })
    files?: FileEntity[];

    @Column({ type: 'jsonb', nullable: true })
    messages?: IDoubtClearMessages[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
