export interface DashboardClassroomRef {
  id: string;
  name: string;
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
