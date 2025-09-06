import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UploadedFiles,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Request
} from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AnyFilesInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { Role } from 'src/users/entities/role.enum';

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
      return this.assignmentsService.getAllSubmitedAssignments(announcementid, (req as any).user);
    }
    else {
      return this.assignmentsService.getAssignmentSumissionForStudent(announcementid, (req as any).user);
    }
  }
}




// @Patch(':id/mark-done')
// markAsDone(@Param('id') id: string, @Request() req) {
//   return this.assignmentsService.markAsDone(id, (req as any).user['userId']);
// }

// @Get('pending')
// getPendingAssignments(@Request() req) {
//   return this.assignmentsService.getPendingAssignments((req as any).user['userId']);
// }

// @Get('/announcement/:id')
// getAssignmentSubmissions(@Request() req, @Param('id') id: string) {
//   return this.assignmentsService.getAssignmentSubmissions(id);
// }

// @Get('/announcement/:id/status')
// getSubmissionStatus(@Param('id') id: string, @Request() req) {
//   return this.assignmentsService.getSubmissionStatus(id, (req as any).user['userId']);
// }
