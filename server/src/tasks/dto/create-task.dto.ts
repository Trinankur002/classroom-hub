import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsUUID()
  projectId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  assignedToId: string;
}
