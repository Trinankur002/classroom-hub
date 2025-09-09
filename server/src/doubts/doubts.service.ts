import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Doubts } from "./doubts.entity";
import { FileService } from "src/fileServices/file.service";
import { ClassroomsService } from "src/classrooms/classrooms.service";
import { UsersService } from "src/users/users.service";

@Injectable()
export class DoubtsService {
    constructor(
      @InjectRepository(Doubts)
        private readonly doubtsRepository: Repository<Doubts>,
        private fileService: FileService,
        classroomService: ClassroomsService,
        userService: UsersService,
  ) {}

}