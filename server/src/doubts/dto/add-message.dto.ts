import { IsString, IsOptional, IsArray } from 'class-validator';

export class AddMessageDto {
  @IsString()
  message: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  filesIds?: string[];
}
