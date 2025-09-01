import { ClassroomAnnouncement } from "src/classrooms/entities/classroom-announcement.entity";
import { FileEntity } from "src/fileServices/file.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}
