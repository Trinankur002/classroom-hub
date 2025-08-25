import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Param,
  ForbiddenException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../users/entities/role.enum';
import { ClassroomResponseDto } from './dto/classroom-response.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto'; // Import CreateAnnouncementDto
import { ClassroomAnnouncement } from './entities/classroom-announcement.entity'; // Import ClassroomAnnouncement for ApiResponse type
import { IClassroom } from './classrooms.interface';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('classrooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClassroomsController {

  constructor(private classroomsService: ClassroomsService) {}

  @Post()
  @ApiBody({ type: CreateClassroomDto })
  create(@Body() createClassroomDto: CreateClassroomDto, @Request() req) {
    if (req.user.role !== Role.Teacher) {
      throw new ForbiddenException('Only teachers can create classrooms.');

    }
    return this.classroomsService.create(createClassroomDto, req.user);
  }

  @Post('join/:joinCode')
  async join(@Param('joinCode') joinCode: string, @Request() req) {
    // const classroom = await this.classroomsService.findByJoinCode(joinCode);
    // if (!classroom) {
    //   throw new NotFoundException('Classroom not found.');
    // }
    return this.classroomsService.join(joinCode, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classrooms for the current user' })
  @ApiResponse({ status: 200, description: 'List of classrooms returned successfully', type: [ClassroomResponseDto] })
  findAll(@Request() req): Promise<IClassroom[]> {
    return this.classroomsService.findAllForUser(req.user);
  }

  @Get('class/:id')
  @ApiOperation({ summary: 'Get classroom details by ID' })
  @ApiParam({ name: 'id', description: 'Classroom ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Classroom details returned successfully', type: ClassroomResponseDto })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  async getClassroomDetails(
    @Param('id') classroomId: string,
    @Request() req,
  ): Promise<IClassroom> {
    return this.classroomsService.getClassRoomdetails(classroomId, req.user);
  }

  @Post('/announcements')
  @ApiOperation({ summary: 'Create a new announcement in a classroom' })
  @ApiBody({ type: CreateAnnouncementDto })
  async createAnnouncement(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @Request() req,
  ): Promise<ClassroomAnnouncement> {
    if (req.user.role !== Role.Teacher) {
      throw new ForbiddenException('Only teachers can create announcements.');
    }
    return this.classroomsService.createAnnouncement(createAnnouncementDto, req.user);
  }

  @Post("/announce-files")
  @UseInterceptors(FilesInterceptor("files", 10, {
    limits: { fileSize: 100 * 1024 * 1024 },
  }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        classroomId: { type: "string", format: "uuid" },
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
        },
      },
    },
  })
  async createAnnouncementWithFiles(
    @Body() body: CreateAnnouncementDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.classroomsService.createAnnouncementWithFiles(body, files, req.user);
  }

}
