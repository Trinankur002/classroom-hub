import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from './entities/classroom.entity';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { User } from '../users/entities/user.entity';
import { StudentClassroom } from './entities/student-classroom.entity';
import { Role } from '../users/entities/role.enum';
import { IClassroom } from './classrooms.interface';


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

  async join(joinCode: string, student: User): Promise<StudentClassroom> {

    const classroom = await this.classroomsRepository.findOne({ where: { joinCode } });
    if (!classroom) {
      throw new NotFoundException('Classroom not found.');
    }

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

    const classroomEntity = await this.studentClassroomsRepository.save(studentClassroom);
    classroom.studentCount++;
    await this.classroomsRepository.save(classroom);
    return classroomEntity;

  }

  async findAllForUser(user: User): Promise<IClassroom[]> {
    if (user.role === Role.Teacher) {
      return this.classroomsRepository
        .createQueryBuilder('classroom')
        .leftJoinAndSelect('classroom.teacher', 'teacher')
        .select([
          'classroom.id',
          'classroom.name',
          'classroom.joinCode',
          'classroom.createdAt',
          'classroom.updatedAt',
          'classroom.description',
          'classroom.studentCount',
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

      // Map the results to the IClassroom interface
      return studentClassrooms.map((sc) => {
        const classroom = sc.classroom;
        return {
          id: classroom.id,
          name: classroom.name,
          description: classroom.description,
          joinCode: classroom.joinCode,
          teacherId: classroom.teacherId,
          teacher: {
            id: classroom.teacher.id,
            name: classroom.teacher.name,
          },
          createdAt: classroom.createdAt,
          updatedAt: classroom.updatedAt,
        };
      });
    }

    return [];
  }

}
