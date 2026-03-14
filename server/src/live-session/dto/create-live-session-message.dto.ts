import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateLiveSessionMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
