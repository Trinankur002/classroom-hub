import { IsBoolean, IsOptional } from 'class-validator';

export class StartLiveSessionDto {
    @IsOptional()
    @IsBoolean()
    allowStudentMicrophone?: boolean;

    @IsOptional()
    @IsBoolean()
    allowStudentCamera?: boolean;

    @IsOptional()
    @IsBoolean()
    allowStudentScreenShare?: boolean;
}
