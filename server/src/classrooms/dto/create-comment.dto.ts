import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from "class-validator";
import { Role } from "src/users/entities/role.enum";

/**
 * Represents the user who sent a comment.
 * This is likely used in response DTOs. The sender of a new comment
 * is identified from the authentication token on the server.
 */
export class CommentUserDto {
    @ApiProperty({ description: "User's ID", example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: "User's name", example: 'John Doe' })
    @IsString()
    name: string;

    @ApiProperty({ description: "User's role", enum: Role, example: Role.Student })
    @IsEnum(Role)
    userRole: Role;

    @ApiProperty({ description: "URL to user's avatar", example: 'https://example.com/avatar.png', required: false })
    @IsUrl()
    @IsOptional()
    avatarUrl: string;
}

/**
 * DTO for creating a new comment on an announcement.
 */
export class CreateCommentDto {
    @ApiProperty({ description: 'The content of the comment.', example: 'This is a great announcement!' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        description: 'The time of the comment in ISO 8601 format.',
        example: '2025-08-25T10:11:20.000Z',
        type: String,
        format: 'date-time'
    })
    @IsDateString()
    @IsNotEmpty()
    @Type(() => Date)
    time: Date;
}