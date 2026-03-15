export interface DashboardClassroomRef {
  id: string;
  name: string;
}

export interface DashboardTopDoubtClassroom {
  classroom: DashboardClassroomRef | null;
  doubtCount: number;
  since: string;
  lastDoubtAt?: string | null;
}

export interface DashboardSummary {
  role: "teacher" | "student";
  stats: Record<string, number>;
  shortcuts: {
    busiestClassroom?: DashboardClassroomRef | null;
    recentDoubtClassroom?: DashboardClassroomRef | null;
    firstClassroom?: DashboardClassroomRef | null;
  };
}

export interface DashboardFeedListItem {
  id: string;
  type?: string;
  title?: string;
  summary?: string;
  classroomId?: string;
  classroomName?: string;
  announcementId?: string;
  targetUserId?: string;
  createdAt?: string;
  dueDate?: string | null;
  pendingCount?: number;
  studentName?: string;
  isActive?: boolean;
  sessionId?: string;
}

export interface DashboardFeed {
  role: "teacher" | "student";
  lists: {
    needsAttention?: DashboardFeedListItem[];
    recentActivity?: DashboardFeedListItem[];
    activeLiveClasses?: DashboardFeedListItem[];
    dueSoon?: DashboardFeedListItem[];
    missedWork?: DashboardFeedListItem[];
    recentMaterials?: DashboardFeedListItem[];
    recentMentions?: DashboardFeedListItem[];
  };
}
