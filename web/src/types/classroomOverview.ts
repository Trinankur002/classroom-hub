import { IClassroom } from "./classroom";

export interface ClassroomOverviewAnnouncement {
  id: string;
  title: string;
  description?: string;
  classroomId: string;
  dueDate?: string | null;
  isAssignment?: boolean;
  isNote?: boolean;
  updatedAt?: string;
  createdAt?: string;
  fileCount?: number;
}

export interface ClassroomOverviewDoubt {
  id: string;
  classroomId?: string;
  doubtDescribtion?: string;
  createdAt?: string;
  updatedAt?: string;
  messageCount?: number;
  student?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
}

export interface ClassroomOverviewAssignment {
  id: string;
  title: string;
  dueDate?: string | null;
  createdAt?: string;
  pendingStudentsCount?: number;
  submissionCount?: number;
  isAssignment?: boolean;
}

export interface ClassroomOverview {
  classroom: IClassroom;
  counts: {
    students: number;
    announcements: number;
    assignments: number;
    doubts: number;
    materials: number;
  };
  activeLiveSession: {
    sessionId: string;
    classroomId: string;
    roomName: string;
    isActive: boolean;
  } | null;
  chat: {
    roomId: string;
    participantCount: number;
  } | null;
  recentAnnouncements: ClassroomOverviewAnnouncement[];
  recentAssignments: ClassroomOverviewAssignment[];
  recentDoubts: ClassroomOverviewDoubt[];
  teacherPanel: {
    pendingAssignments: ClassroomOverviewAssignment[];
  } | null;
  studentPanel: {
    pendingAssignments: ClassroomOverviewAnnouncement[];
    missedAssignments: ClassroomOverviewAnnouncement[];
    recentMaterials: ClassroomOverviewAnnouncement[];
  } | null;
}
