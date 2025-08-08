import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Classroom } from './classroom.entity';

@Entity('student_classrooms')
@Unique(['classroomId', 'studentId'])
export class StudentClassroom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  classroomId: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Classroom)
  @JoinColumn({ name: 'classroomId' })
  classroom: Classroom;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;
}
