import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
    @ApiProperty()
    @IsString()
    @MinLength(6)
    oldPassword: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    newPassword: string;
}