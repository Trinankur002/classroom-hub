import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from './entities/classroom.entity';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { User } from '../users/entities/user.entity';
import { StudentClassroom } from './entities/student-classroom.entity';
import { Role } from '../users/entities/role.enum';


@Injectable()
export class ClassroomsService {
  constructor(
    @InjectRepository(Classroom)
    private classroomsRepository: Repository<Classroom>,
    @InjectRepository(StudentClassroom)
    private studentClassroomsRepository: Repository<StudentClassroom>,
  ) {}

  async create(
    createClassroomDto: CreateClassroomDto,
    teacher: User,
  ): Promise<Classroom> {
    const { nanoid } = await import('nanoid');
    const joinCode = nanoid(10);
    const classroom = this.classroomsRepository.create({

      ...createClassroomDto,
      teacherId: teacher.id,
      joinCode,
    });
    return this.classroomsRepository.save(classroom);
  }

  async findByJoinCode(joinCode: string): Promise<Classroom | null> {
    return this.classroomsRepository.findOne({ where: { joinCode } });
  }

  async join(classroom: Classroom, student: User): Promise<StudentClassroom> {
    if (student.role !== Role.Student) {
      throw new ConflictException('Only students can join a classroom.');
    }

    const existing = await this.studentClassroomsRepository.findOne({
      where: { classroomId: classroom.id, studentId: student.id },
    });

    if (existing) {
      throw new ConflictException('Student is already in this classroom.');
    }

    const studentClassroom = this.studentClassroomsRepository.create({
      classroomId: classroom.id,
      studentId: student.id,
    });

    return this.studentClassroomsRepository.save(studentClassroom);
  }

  async findAllForUser(user: User): Promise<Classroom[]> {
    if (user.role === Role.Teacher) {
      return this.classroomsRepository.createQueryBuilder('classroom')
        .leftJoinAndSelect('classroom.teacher', 'teacher')
        .select([
          'classroom.id',
          'classroom.name',
          'classroom.description',
          'classroom.joinCode',
          'teacher.id',
          'teacher.name',
        ])
        .where('classroom.teacherId = :teacherId', { teacherId: user.id })
        .getMany();
    }

    if (user.role === Role.Student) {
      const studentClassrooms = await this.studentClassroomsRepository.find({
        where: { studentId: user.id },
        relations: ['classroom', 'classroom.teacher'],
      });

      return studentClassrooms.map((sc) => sc.classroom) as Classroom[];
    }

    return [];
  }

}
