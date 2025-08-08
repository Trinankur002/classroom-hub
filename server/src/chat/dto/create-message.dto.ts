import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  classroomId: string;

  @IsUUID()
  senderId: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsArray()
  @IsOptional()
  mentions?: { id: string; name: string }[];
}
