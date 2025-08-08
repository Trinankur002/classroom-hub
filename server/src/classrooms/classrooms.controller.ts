import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Param,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../users/entities/role.enum';

@Controller('classrooms')
@UseGuards(JwtAuthGuard)
export class ClassroomsController {
  constructor(private classroomsService: ClassroomsService) {}

  @Post()
  create(@Body() createClassroomDto: CreateClassroomDto, @Request() req) {
    if (req.user.role !== Role.Teacher) {
      throw new ForbiddenException('Only teachers can create classrooms.');
    }
    return this.classroomsService.create(createClassroomDto, req.user);
  }

  @Post('join/:joinCode')
  async join(@Param('joinCode') joinCode: string, @Request() req) {
    const classroom = await this.classroomsService.findByJoinCode(joinCode);
    if (!classroom) {
      throw new NotFoundException('Classroom not found.');
    }
    return this.classroomsService.join(classroom, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.classroomsService.findAllForUser(req.user);
  }
}
