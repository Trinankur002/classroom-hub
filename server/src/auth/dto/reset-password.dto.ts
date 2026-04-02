import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: '6-digit OTP' })
  @IsString()
  @Matches(/^\d{6}$/)
  otp: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
