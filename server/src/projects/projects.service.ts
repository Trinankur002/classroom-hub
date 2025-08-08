import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<Project> {
    if (user.role !== Role.Teacher) {
      throw new ForbiddenException('Only teachers can create projects.');
    }
    const project = this.projectsRepository.create({
      ...createProjectDto,
      createdById: user.id,
    });
    return this.projectsRepository.save(project);
  }

  async findAllForClassroom(classroomId: string): Promise<Project[]> {
    return this.projectsRepository.find({
      where: { classroomId },
    });
  }
}
