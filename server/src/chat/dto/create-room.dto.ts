import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ChatRoomType } from '../chat.types';

export class CreateRoomDto {

  @ApiProperty({
    enum: ChatRoomType,
    example: ChatRoomType.DIRECT,
    description: 'Type of chat room',
  })
  @IsEnum(ChatRoomType)
  type: ChatRoomType;

  @ApiPropertyOptional({
    example: 'Project Discussion',
    description: 'Room name (required for GROUP)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: ['uuid-user-1', 'uuid-user-2'],
    description: 'List of participant user IDs',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds: string[];

  @ApiPropertyOptional({
    example: 'uuid-classroom-id',
    description: 'Classroom ID if type is CLASSROOM',
  })
  @IsOptional()
  @IsUUID()
  classroomId?: string;
}