import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class FilesIds {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('all', { each: true })
    @ApiProperty({
        description: 'IDs of the files associated with the announcement',
        example: ['a1b2c3d4-e5f6-7890-1234-567890abcdef', 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'c3d4e5f6-a7b8-9012-3456-78901abcdef2'],
    })
    fileIds: string[];

}