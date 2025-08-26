import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty()
  @IsUUID()
  classroomId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  // @IsDateString()
  @Type(() => Date)
  @IsOptional()
  deadline?: Date;
}
