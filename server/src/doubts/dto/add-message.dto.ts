import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AddMessageDto {
  @ApiProperty({
    description: 'The ID of the doubt to add the message to.',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  doubtId: string;

  @ApiProperty({
    description: 'The text content of the message. Can be empty if a file is attached.',
    required: false,
  })
  @IsOptional()
  @IsString()
  message: string;
}

