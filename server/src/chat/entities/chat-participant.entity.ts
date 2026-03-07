import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity('chat_participants')
export class ChatParticipant {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    roomId: string;

    @Column()
    userId: string;

    @CreateDateColumn()
    joinedAt: Date;
}