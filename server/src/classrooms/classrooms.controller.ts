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
  NotFoundException,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../users/entities/role.enum';
import { ClassroomResponseDto } from './dto/classroom-response.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto'; // Import CreateAnnouncementDto
import { ClassroomAnnouncement } from './entities/classroom-announcement.entity'; // Import ClassroomAnnouncement for ApiResponse type
import { IClassroom, IClassroomUser } from './classrooms.interface';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('classrooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClassroomsController {

  constructor(private classroomsService: ClassroomsService) { }

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
    const classroom = await this.classroomsService.findByJoinCode(joinCode);
    if (!classroom) {
      throw new NotFoundException('Classroom not found.');
    }
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
        isAssignment: { type: "boolean" },
        isNote: { type: "boolean" },
        dueDate: { type: "string", format: "date-time" },
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
    console.log('controller function called .');
    
    return this.classroomsService.createAnnouncementWithFiles(body, files, req.user);
  }

  @Get('announcements/:classroomId')
  @ApiParam({ name: 'classroomId', description: 'Classroom ID (UUID)' })
  async getAnnouncements(
    @Param('classroomId') classroomId: string,
    @Request() req,
  ): Promise<ClassroomAnnouncement[]> {
    return this.classroomsService.getAnnouncements(classroomId, req.user);
  }

  @Get('announcement/one/:announcementId')
  @ApiOperation({ summary: 'Get an announcement by ID' })
  @ApiParam({ name: 'announcementId', description: 'Announcement ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Announcement details returned successfully',
    type: ClassroomAnnouncement,
  })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async getAnnouncement(
    @Param('announcementId') announcementId: string,
    @Request() req: any,
  ) {
    return this.classroomsService.getAnnouncement(announcementId, req.user);
  }

  @Post('announcements/comment')
  @ApiOperation({ summary: 'Add a comment to an announcement' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({
    status: 201,
    description: 'Comment added successfully',
    type: ClassroomAnnouncement,
  })
  async addCommentToAnouncement(
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ) {
    return this.classroomsService.addCommentToAnouncement(
      createCommentDto,
      req.user,
    );
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get all users in a classroom' })
  @ApiParam({ name: 'id', description: 'Classroom ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'List of classroom users returned successfully'
  })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllClassroomUsers(
    @Param('id') classroomId: string,
    @Request() req,
  ): Promise<IClassroomUser[]> {
    return this.classroomsService.getAllClassroomUsers(classroomId, req.user);
  }

  @Delete('anouncement/:announcementId')
  @ApiOperation({ summary: "Deletes an announcement by ID" })
  @ApiParam({ name: "announcementId", description: "Announcement ID (UUID)", required: true, type: "string" })
  @ApiResponse({ status: 200, description: "Announcement deleted successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "File not found" })
  async deleteFiles(
    @Param('announcementId') announcementId: string,
    @Request() req: any,
  ) {
    await this.classroomsService.deleteAnnouncement(announcementId, req.user);
    return { message: 'Announcement deleted successfully' };
  }

  @Delete('student/:studentId')
  @ApiOperation({ summary: 'Remove a student from a classroom' })
  @ApiQuery({ name: 'classroomId', description: 'Classroom ID (UUID)' })
  @ApiParam({ name: 'studentId', description: 'Student ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Student removed from classroom successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeStudentFromClassroom(
    @Param('studentId') studentId: string,
    @Query('classroomId') classroomId: string,
    @Request() req: any,
  ) {

    if (req.user.role !== Role.Teacher) {
      throw new ForbiddenException('Only teachers can remove students from a classroom.');
    }
    await this.classroomsService.removeStudentFromClassroom(classroomId, studentId, req.user);
    return { message: 'Student removed from classroom successfully' };
  }

  @Delete('student/leave/:classroomId')
  @ApiParam({ name: 'classroomId', description: 'Classroom ID (UUID)' })
  @ApiOperation({ summary: 'Leave a classroom' })
  async leaveClassroom(
    @Param('classroomId') classroomId: string,
    @Request() req: any,
    ) {
    await this.classroomsService.leaveClassroom(classroomId, req.user);
    return { message: 'Left classroom successfully' };
  }

  @Delete('delete/:classroomId') 
  @ApiParam({ name: 'classroomId', description: 'Classroom ID (UUID)' })
  @ApiOperation({ summary: 'Delete a classroom' })
  async deleteClassRoom(
    @Param('classroomId') classroomId: string,
    @Request() req: any,
  ) {
    await this.classroomsService.deleteClassroom(classroomId, req.user);
    return { message: 'Classroom deleted successfully' };
  }

}
