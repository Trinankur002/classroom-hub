import { Module } from "@nestjs/common";
import { FileEntity } from "./file.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileService } from "./file.service";
import { FileController } from "./file.controller";

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  providers: [FileService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}