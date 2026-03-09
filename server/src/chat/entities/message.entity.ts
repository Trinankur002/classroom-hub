import { FileEntity } from "src/fileServices/file.entity";
import { User } from "src/users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";

@Entity('messages')
export class Message {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    roomId: string;

    @Column()
    senderId: string;

    @Column('text')
    content: string;

    @Column({ type: 'uuid', nullable: true })
    mentionedUserId: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'mentionedUserId', referencedColumnName: 'id' })
    mentionedUser: User | null;

    @OneToMany(() => FileEntity, (file) => file.message, { cascade: true, nullable: true })
    files: FileEntity[];

    @CreateDateColumn()
    createdAt: Date;
}
