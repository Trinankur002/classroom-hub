import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class SendMessageDto {

    @ApiProperty({
        example: 'uuid-room-id',
        description: 'Room ID where message will be sent',
    })
    @IsUUID()
    roomId: string;

    @ApiProperty({
        example: 'Hello everyone!',
        description: 'Message content',
    })
    @IsString()
    content: string;
}