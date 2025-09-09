import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateDoubtDto {
  @IsString()
  classroomId: string;

  @IsString()
  doubtDescribtion: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  filesIds?: string[];
}
