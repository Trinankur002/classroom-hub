import {
  Controller,
  Get,
  Param,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Role } from 'src/users/entities/role.enum';
import { AssignmentService } from './assignment.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentService) { }

  @Post(':announcementid/submit')
  @ApiParam({ name: 'announcementid' })
  @UseInterceptors(FilesInterceptor("files", 10, {
    limits: { fileSize: 100 * 1024 * 1024 },
  }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
        },
      },
    },
  })
  submitAssignment(
    @Param('announcementid') announcementid: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.assignmentsService.submitAssignment(announcementid, (req as any).user, files);
  }

  @Get('allsubmited/:announcementid')
  @ApiParam({ name: 'announcementid' })
  getAllSubmitedAssignments(@Request() req, @Param('announcementid') announcementid: string) {
    if (req.user.role !== Role.Student) {
      return this.assignmentsService.getAllSubmitedAssignmentsForAnnouncement(announcementid, (req as any).user);
    }
    else {
      return this.assignmentsService.getAssignmentSubmissionForStudentForAnnouncement(announcementid, (req as any).user);
    }
  }

  @Get('pending/student/:classroomid')
  @ApiParam({ name: 'classroomid' })
  getPendingForClassroomForStudent(@Request() req, @Param('classroomid') classroomid: string) {
    return this.assignmentsService.getPendingForClassroomForStudent(classroomid, (req as any).user);
  }

  @Get('submitted/student/:classroomid')
  @ApiParam({ name: 'classroomid' })
  getSubmittedForClassroomForStudent(@Request() req, @Param('classroomid') classroomid: string) {
    return this.assignmentsService.getSubmittedForClassroomForStudent(classroomid, (req as any).user);
  }

  @Get('all/pending/student')
  getAllPendingAssignmentsForStudent(@Request() req) {
    return this.assignmentsService.getAllPendingAssignmentsForStudent((req as any).user);
  }

  @Get('missed/student/:classroomid')
  @ApiParam({ name: 'classroomid' })
  getMissedForClassroomForStudent(@Request() req, @Param('classroomid') classroomid: string) {
    return this.assignmentsService.getMissedForClassroomForStudent(classroomid, (req as any).user)
  }

  @Get('all/missed/student')
  getAllMissedForStudent(@Request() req) {
    return this.assignmentsService.getAllMissedForStudent((req as any).user)
  }

  @Get('all/studentlist/pending/:announcementid')
  @ApiParam({ name: 'announcementid' })
  getPendingStudentsForAnnouncement(@Request() req, @Param('announcementid') announcementid: string) {
    return this.assignmentsService.getPendingStudentsForAnnouncement(announcementid, (req as any).user);
  }
}
