import { IsString, IsOptional } from 'class-validator';

export class CreateClassroomDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  subject?: string;
}
