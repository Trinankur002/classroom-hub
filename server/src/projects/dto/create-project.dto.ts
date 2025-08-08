import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @IsUUID()
  classroomId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  deadline?: Date;
}
