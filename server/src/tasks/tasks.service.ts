import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.enum';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';


@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    if (user.role !== Role.Teacher) {
      throw new ForbiddenException('Only teachers can create tasks.');
    }
    const task = this.tasksRepository.create(createTaskDto);
    return this.tasksRepository.save(task);
  }

  async findAllForProject(projectId: string): Promise<Task[]> {
    return this.tasksRepository.find({ where: { projectId } });
  }

  async updateStatus(

    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    user: User,
  ): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found.');
    }
    if (task.assignedToId !== user.id && user.role !== Role.Teacher) {
      throw new ForbiddenException('You are not authorized to update this task.');
    }
    task.status = updateTaskStatusDto.status;
    return this.tasksRepository.save(task);
  }
}
