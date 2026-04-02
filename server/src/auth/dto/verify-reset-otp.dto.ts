import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';

export class VerifyResetOtpDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: '6-digit OTP' })
  @IsString()
  @Matches(/^\d{6}$/)
  otp: string;
}
