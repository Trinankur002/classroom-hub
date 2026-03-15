import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, LessThan, MoreThan, Repository } from 'typeorm';
import { Classroom } from 'src/classrooms/entities/classroom.entity';
import { StudentClassroom } from 'src/classrooms/entities/student-classroom.entity';
import { ClassroomAnnouncement } from 'src/classrooms/entities/classroom-announcement.entity';
import { Assignment } from 'src/assignments/assignment.entity';
import { Doubts } from 'src/doubts/doubts.entity';
import { Event } from 'src/event/event.entity';
import { EventType } from 'src/event/event.interface';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/users/entities/role.enum';
import { LiveSession } from 'src/live-session/entities/live-session.entity';
import { ParticipantSession } from 'src/live-session/entities/participant-session.entity';
import { ParticipantRole, ParticipantStatus } from 'src/live-session/live-session.types';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepo: Repository<Classroom>,
    @InjectRepository(StudentClassroom)
    private readonly membershipRepo: Repository<StudentClassroom>,
    @InjectRepository(ClassroomAnnouncement)
    private readonly announcementRepo: Repository<ClassroomAnnouncement>,
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(Doubts)
    private readonly doubtsRepo: Repository<Doubts>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepo: Repository<LiveSession>,
    @InjectRepository(ParticipantSession)
    private readonly participantSessionRepo: Repository<ParticipantSession>,
  ) {}

  async getSummary(user: User) {
    const classrooms = await this.getUserClassrooms(user);
    const classroomIds = classrooms.map((classroom) => classroom.id);

    if (user.role === Role.Teacher) {
      const totalStudents = classrooms.reduce(
        (sum, classroom) => sum + (classroom.studentCount || 0),
        0,
      );
      const newDoubts = classroomIds.length
        ? await this.doubtsRepo.count({
            where: {
              classroomId: In(classroomIds),
            },
          })
        : 0;
      const activeLiveSession = await this.liveSessionRepo.findOne({
        where: { teacherId: user.id, isActive: true },
        order: { createdAt: 'DESC' },
      });

      const busiestClassroom = classrooms
        .slice()
        .sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))[0] || null;

      const doubtClassroom = classroomIds.length
        ? await this.eventRepo.findOne({
            where: {
              classroomId: In(classroomIds),
              type: EventType.NEW_DOUBT,
            },
            order: { createdAt: 'DESC' },
          })
        : null;

      return {
        role: 'teacher',
        stats: {
          totalClassrooms: classrooms.length,
          totalStudents,
          newDoubts,
          activeLiveSession: activeLiveSession ? 1 : 0,
        },
        shortcuts: {
          busiestClassroom: busiestClassroom
            ? { id: busiestClassroom.id, name: busiestClassroom.name }
            : null,
          recentDoubtClassroom: doubtClassroom?.classroomId
            ? this.toClassroomRef(
                classrooms.find((classroom) => classroom.id === doubtClassroom.classroomId) || null,
              )
            : null,
        },
      };
    }

    const pendingAssignments = await this.getStudentPendingAssignments(user.id, classroomIds, 50);
    const missedAssignments = await this.getStudentMissedAssignments(user.id, classroomIds, 50);
    const activeLiveClasses = classroomIds.length
      ? await this.liveSessionRepo.count({
          where: {
            classroomId: In(classroomIds),
            isActive: true,
          },
        })
      : 0;

    return {
      role: 'student',
      stats: {
        enrolledClasses: classrooms.length,
        pendingAssignments: pendingAssignments.length,
        missedAssignments: missedAssignments.length,
        activeLiveClasses,
      },
      shortcuts: {
        firstClassroom: this.toClassroomRef(classrooms[0] || null),
      },
    };
  }

  async getFeed(user: User) {
    const classrooms = await this.getUserClassrooms(user);
    const classroomIds = classrooms.map((classroom) => classroom.id);

    if (user.role === Role.Teacher) {
      const needsAttention = await this.getTeacherNeedsAttention(classrooms);
      const recentActivity = await this.getTeacherRecentActivity(classrooms, user.id);
      const activeSession = await this.liveSessionRepo.findOne({
        where: { teacherId: user.id, isActive: true },
        order: { createdAt: 'DESC' },
      });

      return {
        role: 'teacher',
        lists: {
          needsAttention,
          recentActivity,
          activeLiveClasses: activeSession
            ? [
                {
                  sessionId: activeSession.id,
                  classroomId: activeSession.classroomId,
                  classroomName:
                    classrooms.find((classroom) => classroom.id === activeSession.classroomId)?.name ||
                    'Live classroom',
                  isActive: true,
                },
              ]
            : [],
        },
      };
    }

    const [pendingAssignments, missedAssignments, materials, mentions, liveSessions] =
      await Promise.all([
        this.getStudentPendingAssignments(user.id, classroomIds, 5),
        this.getStudentMissedAssignments(user.id, classroomIds, 5),
        this.getRecentMaterials(classroomIds, 5),
        this.getRecentMentions(user.id, 5),
        this.getActiveLiveSessions(classrooms, 5),
      ]);

    return {
      role: 'student',
      lists: {
        dueSoon: pendingAssignments,
        missedWork: missedAssignments,
        recentMaterials: materials,
        recentMentions: mentions,
        activeLiveClasses: liveSessions,
      },
    };
  }

  async getTopDoubtClassroom(user: User) {
    if (user.role !== Role.Teacher) {
      throw new ForbiddenException('Only teachers can access top doubt classroom analytics.');
    }

    const classrooms = await this.getUserClassrooms(user);
    const classroomIds = classrooms.map((classroom) => classroom.id);
    const sinceDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    if (!classroomIds.length) {
      return {
        classroom: null,
        doubtCount: 0,
        since: sinceDate.toISOString(),
      };
    }

    const topClassroom = await this.doubtsRepo
      .createQueryBuilder('doubt')
      .select('doubt.classroomId', 'classroomId')
      .addSelect('COUNT(doubt.id)', 'doubtCount')
      .addSelect('MAX(doubt.createdAt)', 'lastDoubtAt')
      .where('doubt.classroomId IN (:...classroomIds)', { classroomIds })
      .andWhere('doubt.createdAt >= :sinceDate', { sinceDate })
      .groupBy('doubt.classroomId')
      .orderBy('COUNT(doubt.id)', 'DESC')
      .addOrderBy('MAX(doubt.createdAt)', 'DESC')
      .limit(1)
      .getRawOne<{ classroomId: string; doubtCount: string; lastDoubtAt: string }>();

    if (!topClassroom?.classroomId) {
      return {
        classroom: null,
        doubtCount: 0,
        since: sinceDate.toISOString(),
      };
    }

    const classroom = classrooms.find((item) => item.id === topClassroom.classroomId);

    return {
      classroom: {
        id: topClassroom.classroomId,
        name: classroom?.name || 'Classroom',
      },
      doubtCount: Number(topClassroom.doubtCount) || 0,
      lastDoubtAt: topClassroom.lastDoubtAt || null,
      since: sinceDate.toISOString(),
    };
  }

  async getProgress(user: User) {
    const classrooms = await this.getUserClassrooms(user);
    const classroomIds = classrooms.map((classroom) => classroom.id);

    if (user.role === Role.Teacher) {
      return this.getTeacherProgress(user, classrooms, classroomIds);
    }

    return this.getStudentProgress(user, classroomIds);
  }

  private async getUserClassrooms(user: User) {
    if (user.role === Role.Teacher) {
      return this.classroomRepo.find({
        where: { teacherId: user.id },
        relations: ['teacher'],
        order: { updatedAt: 'DESC' },
      });
    }

    const memberships = await this.membershipRepo.find({
      where: { studentId: user.id },
      relations: ['classroom', 'classroom.teacher'],
      // order: { : 'DESC' },
    });
    return memberships.map((membership) => membership.classroom).filter(Boolean);
  }

  private async getStudentPendingAssignments(studentId: string, classroomIds: string[], limit: number) {
    if (!classroomIds.length) return [];

    const now = new Date();
    const announcements = await this.announcementRepo.find({
      where: {
        classroomId: In(classroomIds),
        isAssignment: true,
        dueDate: MoreThan(now),
      },
      relations: ['teacher'],
      order: { dueDate: 'ASC', createdAt: 'DESC' },
      take: 40,
    });

    const submissions = await this.assignmentRepo.find({
      where: {
        studentId,
        announcementId: In(announcements.map((item) => item.id)),
      },
      select: ['announcementId'],
    });
    const submittedIds = new Set(submissions.map((item) => item.announcementId));

    return announcements
      .filter((item) => !submittedIds.has(item.id))
      .slice(0, limit)
      .map((item) => this.toAnnouncementPreview(item));
  }

  private async getStudentMissedAssignments(studentId: string, classroomIds: string[], limit: number) {
    if (!classroomIds.length) return [];

    const now = new Date();
    const announcements = await this.announcementRepo.find({
      where: {
        classroomId: In(classroomIds),
        isAssignment: true,
        dueDate: LessThan(now),
      },
      relations: ['teacher'],
      order: { dueDate: 'DESC', createdAt: 'DESC' },
      take: 40,
    });

    const submissions = await this.assignmentRepo.find({
      where: {
        studentId,
        announcementId: In(announcements.map((item) => item.id)),
      },
      select: ['announcementId'],
    });
    const submittedIds = new Set(submissions.map((item) => item.announcementId));

    return announcements
      .filter((item) => !submittedIds.has(item.id))
      .slice(0, limit)
      .map((item) => this.toAnnouncementPreview(item));
  }

  private async getRecentMaterials(classroomIds: string[], limit: number) {
    if (!classroomIds.length) return [];

    const announcements = await this.announcementRepo.find({
      where: {
        classroomId: In(classroomIds),
        isNote: true,
      },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return announcements.map((item) => this.toAnnouncementPreview(item));
  }

  private async getRecentMentions(userId: string, limit: number) {
    const events = await this.eventRepo.find({
      where: {
        type: EventType.MENTION,
        targetUserId: userId,
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return events.map((event) => ({
      id: event.id,
      type: event.type,
      classroomId: event.classroomId,
      announcementId: event.announcementId,
      createdAt: event.createdAt,
      summary: 'You were mentioned in a classroom discussion.',
    }));
  }

  private async getActiveLiveSessions(classrooms: Classroom[], limit: number) {
    const classroomIds = classrooms.map((classroom) => classroom.id);
    if (!classroomIds.length) return [];

    const sessions = await this.liveSessionRepo.find({
      where: {
        classroomId: In(classroomIds),
        isActive: true,
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return sessions.map((session) => ({
      sessionId: session.id,
      classroomId: session.classroomId,
      classroomName:
        classrooms.find((classroom) => classroom.id === session.classroomId)?.name || 'Live classroom',
      isActive: session.isActive,
    }));
  }

  private async getTeacherNeedsAttention(classrooms: Classroom[]) {
    const classroomIds = classrooms.map((classroom) => classroom.id);
    if (!classroomIds.length) return [];

    const assignments = await this.announcementRepo.find({
      where: {
        classroomId: In(classroomIds),
        isAssignment: true,
      },
      order: { createdAt: 'DESC' },
      take: 15,
    });

    const assignmentIds = assignments.map((item) => item.id);
    const submissions = assignmentIds.length
      ? await this.assignmentRepo.find({
          where: {
            announcementId: In(assignmentIds),
          },
          select: ['announcementId', 'studentId'],
        })
      : [];

    const submittedByAnnouncement = submissions.reduce((acc, item) => {
      acc[item.announcementId] = (acc[item.announcementId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pendingAssignments = assignments
      .map((assignment) => {
        const classroom = classrooms.find((item) => item.id === assignment.classroomId);
        const totalStudents = classroom?.studentCount || 0;
        const submitted = submittedByAnnouncement[assignment.id] || 0;
        return {
          id: assignment.id,
          type: 'assignment',
          classroomId: assignment.classroomId,
          classroomName: classroom?.name || 'Classroom',
          title: assignment.name,
          pendingCount: Math.max(totalStudents - submitted, 0),
          dueDate: assignment.dueDate,
          createdAt: assignment.createdAt,
        };
      })
      .filter((item) => item.pendingCount > 0)
      .sort((a, b) => b.pendingCount - a.pendingCount)
      .slice(0, 3);

    const recentDoubts = await this.doubtsRepo.find({
      where: {
        classroomId: In(classroomIds),
      },
      relations: ['student'],
      order: { updatedAt: 'DESC' },
      take: 3,
    });

    const noActivityCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentAnnouncements = await this.announcementRepo.find({
      where: {
        classroomId: In(classroomIds),
        createdAt: MoreThan(noActivityCutoff),
      },
      select: ['id', 'classroomId'],
    });
    const activeClassroomIds = new Set(recentAnnouncements.map((item) => item.classroomId));
    const staleClassrooms = classrooms
      .filter((classroom) => !activeClassroomIds.has(classroom.id))
      .slice(0, 3)
      .map((classroom) => ({
        id: classroom.id,
        type: 'stale-classroom',
        classroomId: classroom.id,
        classroomName: classroom.name,
        title: 'No recent updates',
        pendingCount: 0,
        createdAt: classroom.updatedAt,
      }));

    return [
      ...pendingAssignments,
      ...recentDoubts.map((doubt) => ({
        id: doubt.id,
        type: 'doubt',
        classroomId: doubt.classroomId,
        classroomName:
          classrooms.find((item) => item.id === doubt.classroomId)?.name || 'Classroom',
        title: doubt.doubtDescribtion || 'New doubt from student',
        pendingCount: 1,
        createdAt: doubt.updatedAt,
        studentName: doubt.student?.name,
      })),
      ...staleClassrooms,
    ].slice(0, 8);
  }

  private async getTeacherRecentActivity(classrooms: Classroom[], teacherId: string) {
    const classroomIds = classrooms.map((classroom) => classroom.id);
    if (!classroomIds.length) return [];

    const events = await this.eventRepo
      .createQueryBuilder('event')
      .where('event.classroomId IN (:...classroomIds)', { classroomIds })
      .andWhere(
        new Brackets((qb) => {
          qb.where('event.type IN (:...allowedEventTypes)', {
            allowedEventTypes: [EventType.NEW_DOUBT, EventType.ASSIGNMENT_SUBMITTED],
          }).orWhere('event.type = :mentionType AND event.targetUserId = :teacherId', {
            mentionType: EventType.MENTION,
            teacherId,
          });
        }),
      )
      .orderBy('event.createdAt', 'DESC')
      .limit(8)
      .getMany();

    return events.map((event) => ({
      id: event.id,
      type: event.type,
      classroomId: event.classroomId,
      classroomName:
        classrooms.find((item) => item.id === event.classroomId)?.name || 'Classroom',
      announcementId: event.announcementId,
      targetUserId: event.targetUserId,
      createdAt: event.createdAt,
      summary: this.getEventSummary(event),
    }));
  }

  private getEventSummary(event: Event) {
    switch (event.type) {
      case EventType.NEW_DOUBT:
        return 'A new doubt was posted.';
      case EventType.ASSIGNMENT_SUBMITTED:
        return 'A student submitted an assignment.';
      case EventType.MENTION:
        return 'You were mentioned in a class discussion.';
      default:
        return 'Recent classroom activity.';
    }
  }

  private toAnnouncementPreview(item: ClassroomAnnouncement) {
    return {
      id: item.id,
      classroomId: item.classroomId,
      title: item.name,
      description: item.description,
      dueDate: item.dueDate,
      isAssignment: item.isAssignment,
      isNote: item.isNote,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      fileCount: item.files?.length || 0,
    };
  }

  private toClassroomRef(classroom: Classroom | null) {
    if (!classroom) return null;
    return {
      id: classroom.id,
      name: classroom.name,
    };
  }

  private safePercent(numerator: number, denominator: number) {
    if (!denominator) return 0;
    return Math.round((numerator / denominator) * 100);
  }

  private formatMonthKey(dateValue?: Date | string | null) {
    if (!dateValue) return 'Unknown';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return `${date.toLocaleString('en-US', { month: 'short' })} ${date.getUTCFullYear()}`;
  }

  private async getTeacherProgress(user: User, classrooms: Classroom[], classroomIds: string[]) {
    const allAssignments = classroomIds.length
      ? await this.announcementRepo.find({
          where: {
            classroomId: In(classroomIds),
            isAssignment: true,
          },
          select: ['id', 'classroomId', 'createdAt'],
        })
      : [];

    const assignmentIds = allAssignments.map((assignment) => assignment.id);

    const submissions = assignmentIds.length
      ? await this.assignmentRepo.find({
          where: {
            announcementId: In(assignmentIds),
          },
          select: ['id', 'announcementId', 'studentId', 'grade', 'gradedAt', 'createdAt'],
          order: { createdAt: 'ASC' },
        })
      : [];

    const uniqueSubmissionPairs = new Set(
      submissions.map((submission) => `${submission.announcementId}:${submission.studentId}`),
    );

    const totalExpectedSubmissions = allAssignments.reduce(
      (sum, assignment) =>
        sum + ((classrooms.find((item) => item.id === assignment.classroomId)?.studentCount || 0) as number),
      0,
    );

    const allMemberships = classroomIds.length
      ? await this.membershipRepo.find({
          where: { classroomId: In(classroomIds) },
          select: ['studentId'],
        })
      : [];
    const uniqueStudents = new Set(allMemberships.map((item) => item.studentId));

    const doubts = classroomIds.length
      ? await this.doubtsRepo.find({
          where: { classroomId: In(classroomIds) },
          select: ['studentId', 'classroomId', 'createdAt'],
        })
      : [];

    const doubtAskers = new Set(doubts.map((doubt) => doubt.studentId));

    const liveSessions = classroomIds.length
      ? await this.liveSessionRepo.find({
          where: { classroomId: In(classroomIds) },
          select: ['id', 'classroomId', 'createdAt'],
        })
      : [];

    const liveSessionIds = liveSessions.map((session) => session.id);
    const attendanceEntries = liveSessionIds.length
      ? await this.participantSessionRepo.find({
          where: {
            liveSessionId: In(liveSessionIds),
            role: ParticipantRole.STUDENT,
            status: ParticipantStatus.APPROVED,
          },
          select: ['liveSessionId', 'userId', 'joinedAt'],
        })
      : [];

    const uniqueAttendancePairs = new Set(
      attendanceEntries.map((entry) => `${entry.liveSessionId}:${entry.userId}`),
    );

    const expectedAttendance = liveSessions.reduce(
      (sum, session) =>
        sum + ((classrooms.find((item) => item.id === session.classroomId)?.studentCount || 0) as number),
      0,
    );

    const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSubmissionStudents = submissions
      .filter((submission) => new Date(submission.createdAt) >= recentCutoff)
      .map((submission) => submission.studentId);
    const recentDoubtStudents = doubts
      .filter((doubt) => new Date(doubt.createdAt) >= recentCutoff)
      .map((doubt) => doubt.studentId);
    const recentAttendanceStudents = attendanceEntries
      .filter((entry) => new Date(entry.joinedAt) >= recentCutoff)
      .map((entry) => entry.userId);
    const activeStudents = new Set([
      ...recentSubmissionStudents,
      ...recentDoubtStudents,
      ...recentAttendanceStudents,
    ]);

    const assignmentCompletionByClassroom = classrooms.map((classroom) => {
      const classroomAssignments = allAssignments.filter((assignment) => assignment.classroomId === classroom.id);
      const expected = classroomAssignments.length * (classroom.studentCount || 0);
      const submitted = uniqueSubmissionPairs.size
        ? Array.from(uniqueSubmissionPairs).filter((pair) =>
            classroomAssignments.some((assignment) => pair.startsWith(`${assignment.id}:`)),
          ).length
        : 0;
      return {
        label: classroom.name,
        value: this.safePercent(submitted, expected),
      };
    });

    const gradeTrendMap = new Map<string, { total: number; count: number }>();
    submissions
      .filter((submission) => submission.grade !== null && submission.grade !== undefined)
      .forEach((submission) => {
        const key = this.formatMonthKey(submission.gradedAt || submission.createdAt);
        const current = gradeTrendMap.get(key) || { total: 0, count: 0 };
        current.total += Number(submission.grade || 0);
        current.count += 1;
        gradeTrendMap.set(key, current);
      });

    const gradeTrends = Array.from(gradeTrendMap.entries()).map(([label, value]) => ({
      label,
      value: Number((value.total / value.count).toFixed(2)),
    }));

    return {
      role: 'teacher',
      metrics: {
        assignmentCompletionPercent: this.safePercent(uniqueSubmissionPairs.size, totalExpectedSubmissions),
        studentActivityPercent: this.safePercent(activeStudents.size, uniqueStudents.size),
        doubtParticipationPercent: this.safePercent(doubtAskers.size, uniqueStudents.size),
        attendancePercent: this.safePercent(uniqueAttendancePairs.size, expectedAttendance),
        assignmentsSubmitted: uniqueSubmissionPairs.size,
        totalStudents: uniqueStudents.size,
      },
      charts: {
        assignmentCompletion: assignmentCompletionByClassroom
          .sort((a, b) => b.value - a.value)
          .slice(0, 8),
        gradeTrends,
      },
    };
  }

  private async getStudentProgress(user: User, classroomIds: string[]) {
    const pendingAssignments = await this.getStudentPendingAssignments(user.id, classroomIds, 500);
    const missedAssignments = await this.getStudentMissedAssignments(user.id, classroomIds, 500);

    const completedSubmissions = await this.assignmentRepo.find({
      where: { studentId: user.id },
      select: ['announcementId', 'grade', 'createdAt', 'gradedAt'],
      order: { createdAt: 'ASC' },
    });

    const completedAnnouncementIds = new Set(completedSubmissions.map((submission) => submission.announcementId));

    const doubtsAsked = classroomIds.length
      ? await this.doubtsRepo.count({
          where: {
            classroomId: In(classroomIds),
            studentId: user.id,
          },
        })
      : 0;

    const liveSessions = classroomIds.length
      ? await this.liveSessionRepo.find({
          where: { classroomId: In(classroomIds) },
          select: ['id'],
        })
      : [];

    const attendanceCount = liveSessions.length
      ? await this.participantSessionRepo
          .createQueryBuilder('participant')
          .select('COUNT(DISTINCT participant.liveSessionId)', 'count')
          .where('participant.liveSessionId IN (:...liveSessionIds)', {
            liveSessionIds: liveSessions.map((session) => session.id),
          })
          .andWhere('participant.userId = :userId', { userId: user.id })
          .andWhere('participant.role = :role', { role: ParticipantRole.STUDENT })
          .andWhere('participant.status = :status', { status: ParticipantStatus.APPROVED })
          .getRawOne<{ count: string }>()
      : { count: '0' };

    const gradedSubmissions = completedSubmissions.filter(
      (submission) => submission.grade !== null && submission.grade !== undefined,
    );

    const averageGrade =
      gradedSubmissions.length > 0
        ? Number(
            (
              gradedSubmissions.reduce((sum, submission) => sum + Number(submission.grade || 0), 0) /
              gradedSubmissions.length
            ).toFixed(2),
          )
        : 0;

    const completedAssignments = completedAnnouncementIds.size;
    const assignmentsMissed = missedAssignments.length;
    const pendingCount = pendingAssignments.length;
    const performancePercent = this.safePercent(
      completedAssignments,
      completedAssignments + pendingCount + assignmentsMissed,
    );

    const gradeTrends = gradedSubmissions
      .slice(-8)
      .map((submission) => ({
        label: this.formatMonthKey(submission.gradedAt || submission.createdAt),
        value: Number(submission.grade || 0),
      }));

    return {
      role: 'student',
      metrics: {
        assignmentsSubmitted: completedAssignments,
        assignmentsMissed,
        doubtsAsked,
        liveClassAttendance: Number(attendanceCount?.count || 0),
        completedAssignments,
        pendingAssignments: pendingCount,
        grades: averageGrade,
        performance: performancePercent,
      },
      charts: {
        assignmentCompletion: [
          { label: 'Completed', value: completedAssignments },
          { label: 'Pending', value: pendingCount },
          { label: 'Missed', value: assignmentsMissed },
        ],
        gradeTrends,
      },
    };
  }

}
