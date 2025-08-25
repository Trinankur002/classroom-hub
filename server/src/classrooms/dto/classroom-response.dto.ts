import { ApiProperty } from '@nestjs/swagger';

class TeacherResponseDto {
  @ApiProperty({
    description: "The teacher's unique identifier",
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: "The teacher's name",
    example: 'John Doe',
  })
  name: string;
}

export class ClassroomResponseDto {
  @ApiProperty({
    description: 'The unique identifier for the classroom',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the classroom',
    example: 'Introduction to TypeScript',
  })
  name: string;

  @ApiProperty({
    description: 'A brief description of the classroom',
    example: 'Learning the fundamentals of TypeScript and its ecosystem.',
    nullable: true,
  })
  description: string;

  @ApiProperty({
    description: 'The unique code for students to join the classroom',
    example: 'aBcDeFg123',
  })
  joinCode: string;

  @ApiProperty({
    description: "The unique identifier of the classroom's teacher",
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  teacherId: string;

  @ApiProperty({
    description: 'The teacher of the classroom',
    type: () => TeacherResponseDto,
  })
  teacher: TeacherResponseDto;

  @ApiProperty({
    description: 'The number of students enrolled in the classroom',
    example: 15,
    required: false,
  })
  studentCount?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}