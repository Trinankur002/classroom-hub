import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsUUID, IsNotEmpty, IsArray, ArrayNotEmpty, IsDateString } from 'class-validator';

export class CreateAnnouncementDto {
    @ApiProperty({ description: 'Name of the announcement', example: 'Welcome to the new semester!' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Description of the announcement',
        example: 'Please review the syllabus and course materials.',
        required: false
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'ID of the classroom to which the announcement belongs',
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    })
    @IsUUID()
    classroomId: string;

    @ApiProperty({
        description: 'IDs of the files associated with the announcement',
        example: ['a1b2c3d4-e5f6-7890-1234-567890abcdef', 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'c3d4e5f6-a7b8-9012-3456-78901abcdef2'],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('all', { each: true })
    @IsOptional()
    filesIds?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    isAssignment: boolean

    @ApiProperty({
        description: 'The due date of the assignment in ISO 8601 format.',
        example: '2025-08-25T10:11:20.000Z',
        type: String,
        format: 'date-time',
        required: false
    })
    // @IsDateString()
    @IsOptional()
    @Type(() => Date)
    dueDate: Date
}