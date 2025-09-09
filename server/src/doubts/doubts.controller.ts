import {
    Controller,
    Post,
    Body,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
    Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { DoubtsService } from './doubts.service';
import { CreateDoubtDto } from './dto/create-doubt.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { Doubts } from './doubts.entity';

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
}
