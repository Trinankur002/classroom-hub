import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { Express } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { FileEntity } from "./file.entity";
import { User } from "src/users/entities/user.entity";
import { getBucket } from "./gcs.config";

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);

    constructor(
        @InjectRepository(FileEntity)
        private fileRepo: Repository<FileEntity>
    ) { }

    async uploadFile(file: Express.Multer.File, user: User, metadata: Partial<FileEntity> = {}) {

        const fileKey = `${uuid()}-${file.originalname}`;
        const gcsBucket = getBucket();
        const blob = gcsBucket.file(fileKey);

        try {
            await blob.save(file.buffer, {
                contentType: file.mimetype,
                resumable: false,
            });

            // 🔑 Generate signed URL (valid for 1 year)
            const [url] = await blob.getSignedUrl({
                action: "read",
                expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
            });

            // Save metadata in DB
            const saved = await this.fileRepo.save({
                name: file.originalname,
                role: user.role,
                userId: user.id,
                url,
                key: fileKey,
                size: file.size,
                mimetype: file.mimetype,
                ...metadata,
            });

            return saved;
        } catch (err) {
            this.logger.error("❌ Upload failed", err.stack || err.message);
            throw err;
        }
    }

    async getFile(fileId: string, user: User) {
        // Find metadata from DB
        const file = await this.fileRepo.findOne({ where: { id: fileId } });
        if (!file) {
            throw new NotFoundException("File not found");
        }

        // Optional: enforce access rules (example: Teachers can see all, students only their own)
        if (user.role !== "Teacher" && file.userId !== user.id) {
            throw new ForbiddenException("You do not have access to this file");
        }

        // Generate signed URL
        const gcsBucket = getBucket();
        const blob = gcsBucket.file(file.key);
        const [url] = await blob.getSignedUrl({
            action: "read",
            expires: Date.now() + 24 * 60 * 60 * 1000, // valid for 1 day
        });

        this.logger.debug(`🔗 Signed URL generated for fileId=${fileId}`);

        return {
            ...file,
            signedUrl: url,
        };
    }
    
    /**
     * Retrieves file metadata without generating a signed URL.
     * Useful for internal service logic.
     */
    async getFileMetadata(fileId: string): Promise<FileEntity | null> {
        return this.fileRepo.findOne({ where: { id: fileId } });
    }

    /**
     * Saves or updates file metadata.
     * Useful for internal service logic, e.g., linking to an announcement.
     */
    async saveFileMetadata(file: FileEntity): Promise<FileEntity> {
        return this.fileRepo.save(file);
    }

    async saveFileAnnouncementId(fileIds: string[], announcementId: string): Promise<FileEntity[]> {
        const files = await this.fileRepo.findBy({ id: In(fileIds) });

        if (!files.length) {
            throw new NotFoundException('No files found with given IDs');
        }

        files.forEach(file => {
            file.announcementId = announcementId;
        });

        return this.fileRepo.save(files);
    }

    /**
     * Deletes files from the database and Google Cloud Storage.
     * It checks for user permissions before deletion.
     * * @param fileIds - An array of file IDs to delete.
     * @param user - The user requesting the deletion.
     */
    async deleteFiles(fileIds: string[], user: User): Promise<void> {
        if (!fileIds || fileIds.length === 0) {
            throw new BadRequestException("File IDs array cannot be empty.");
        }

        const filesToDelete = await this.fileRepo.findBy({ id: In(fileIds) });

        if (filesToDelete.length !== fileIds.length) {
            const notFoundIds = fileIds.filter(id => !filesToDelete.some(file => file.id === id));
            this.logger.warn(`Attempted to delete non-existent files: ${notFoundIds.join(', ')}`);
        }

        const gcsBucket = getBucket();
        const userRole = user.role;
        const currentUserId = user.id;

        // First, perform a batch permission check. If any file fails, throw an error.
        for (const file of filesToDelete) {
            if (userRole !== 'Teacher' && file.userId !== currentUserId) {
                throw new ForbiddenException(`You do not have permission to delete file with ID: ${file.id}`);
            }
        }

        const deletionPromises = filesToDelete.map(async (file) => {
            try {
                const blob = gcsBucket.file(file.key);
                await blob.delete();
                this.logger.debug(`✅ Successfully deleted file from GCS: ${file.key}`);

                await this.fileRepo.delete(file.id);
                this.logger.debug(`✅ Successfully deleted file metadata from DB: ${file.id}`);
            } catch (err) {
                this.logger.error(`❌ Failed to delete file ${file.id} from GCS or DB.`, err.stack || err.message);
                throw err;
            }
        });

        try {
            await Promise.all(deletionPromises);
            this.logger.log(`✅ Successfully deleted a batch of ${filesToDelete.length} files.`);
        } catch (err) {
            this.logger.error("❌ A batch deletion failed. Some files may not have been deleted.", err.stack || err.message);
            throw new Error("Failed to delete all files due to an internal error.");
        }
        // this.logger.log(`files : ${fileIds}`)
    }
}
