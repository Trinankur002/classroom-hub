import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt } from 'class-validator';

export class GetNotesQueryDto {
    @IsOptional()
    @IsString()
    classroomId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    count?: number;
}