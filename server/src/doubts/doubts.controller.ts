import {
    Controller,
    Post,
    Body,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
    Request,
    UploadedFile,
    Get,
    Param,
    Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DoubtsService } from './doubts.service';
import { CreateDoubtDto } from './dto/create-doubt.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { Doubts } from './doubts.entity';
import { AddMessageDto } from './dto/add-message.dto';
import { IDoubtClearMessages } from './doubts.interface';

@Controller('doubts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DoubtsController {
    constructor(private readonly doubtsService: DoubtsService) { }

    @Post()
    @UseInterceptors(FilesInterceptor('files', 10, {
        limits: { fileSize: 100 * 1024 * 1024 }, // 10 files, 100MB per file
    }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                classroomId: { type: 'string', format: 'uuid' },
                doubtDescribtion: { type: "string" },
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
            required: ['classroomId'],
        },
    })
    async createDoubtWithFiles(
        @Body() createDoubtDto: CreateDoubtDto,
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req: { user: User },
    ): Promise<Doubts> {
        return this.doubtsService.createDoubtWithFiles(
            createDoubtDto,
            files,
            req.user,
        );
    }

    @Post('message')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 100 * 1024 * 1024 }, // 1 file, 100MB
    }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                doubtId: { type: 'string', format: 'uuid' },
                message: { type: 'string' },
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['doubtId'],
        },
    })
    async createDoubtMessage(
        @Body() addMessageDto: AddMessageDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: { user: User },
    ): Promise<Doubts> {
        return this.doubtsService.createdoubtMessage(
            addMessageDto,
            file,
            req.user,
        );
    }

    @Get('classroom/:classroomId')
    @ApiParam({ name: 'classroomId', type: 'string', format: 'uuid', description: 'Classroom ID' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @ApiResponse({ status: 200, description: 'List of doubts for the classroom.', type: [Doubts] })
    async getDoubtsByClassroomId(
        @Param('classroomId') classroomId: string,
        @Request() req: { user: User },
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ): Promise<Doubts[]> {
        return this.doubtsService.getDoubtsByClassroomId(
            classroomId,
            req.user,
            page ? +page : undefined,
            limit ? +limit : undefined,
        );
    }

    @Get('messages/:doubtId')
    @ApiResponse({ status: 200, description: 'List of messages for the doubt.' })
    async getDoubtMessages(
        @Param('doubtId') doubtId: string,
        @Request() req: { user: User },
    ): Promise<IDoubtClearMessages[]> {
        return this.doubtsService.getDoubtMessages(doubtId, req.user);
    }
}
