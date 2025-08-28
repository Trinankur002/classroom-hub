import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Request,
    Get,
    Param,
    Delete,
    Body
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { FileService } from "./file.service";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOkResponse,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import { FilesIds } from "./files.dto";

@ApiTags("files")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("files")
export class FileController {
    constructor(private readonly fileService: FileService) { }

    // ✅ Upload file
    @Post("upload")
    @UseInterceptors(
        FileInterceptor("file", {
            fileFilter: (req, file, cb) => {
                // Allow all files (html, zip, json, txt, java, etc.)
                cb(null, true);
            },
            limits: { fileSize: 100 * 1024 * 1024 }, // increase if needed
        }),
    )
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @ApiOkResponse({ description: "File uploaded successfully" })
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        return this.fileService.uploadFile(file, req.user);
    }


    // ✅ Get file metadata by key
    @Get(":id")
    @ApiOperation({ summary: "Get a file's metadata + signed URL" })
    @ApiResponse({ status: 200, description: "File found and signed URL returned" })
    @ApiResponse({ status: 404, description: "File not found" })
    async getFile(@Param("id") id: string, @Request() req) {
        return this.fileService.getFile(id, req.user);
    }

    // ✅ Delete files by ID
    @Delete()
    @ApiOperation({ summary: "Deletes a list of files" })
    @ApiBody({ type: FilesIds })
    @ApiResponse({ status: 200, description: "Files deleted successfully" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    @ApiResponse({ status: 404, description: "File not found" })
    async deleteFiles(@Body('fileIds') fileIds: string[], @Request() req) {
        await this.fileService.deleteFiles(fileIds, req.user);
        return { message: 'Files deleted successfully' };
    }    
}
