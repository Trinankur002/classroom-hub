import { FileEntity } from "src/fileServices/file.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";

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

    @OneToMany(() => FileEntity, (file) => file.assignment, { cascade: true, nullable: true })
    files: FileEntity[];

    @CreateDateColumn()
    createdAt: Date;
}