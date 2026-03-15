import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BookOpen,
  BookText,
  GraduationCap,
  MessageCircleQuestion,
  PlayCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import ClassroomButton from "@/components/customComponent/ClassroomButton";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/AuthContext";
import { toast } from "@/hooks/use-toast";
import DashboardService from "@/services/dashboardService";
import {
  DashboardFeed,
  DashboardFeedListItem,
  DashboardSummary,
  DashboardTopDoubtClassroom,
} from "@/types/dashboard";

function formatDate(value?: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user.role.toString().toLowerCase();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [feed, setFeed] = useState<DashboardFeed | null>(null);
  const [topDoubtClassroom, setTopDoubtClassroom] = useState<DashboardTopDoubtClassroom | null>(null);
  const [loading, setLoading] = useState(false);
  const targetClassroomId =
    topDoubtClassroom?.classroom?.id ||
    summary?.shortcuts?.busiestClassroom?.id ||
    summary?.shortcuts?.firstClassroom?.id;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const topDoubtClassroomRequest: Promise<{
        data?: DashboardTopDoubtClassroom | null;
        error?: string;
      }> =
        userRole === "teacher"
          ? DashboardService.getTopDoubtClassroom()
          : Promise.resolve({ data: null, error: undefined });

      const [summaryResponse, feedResponse, topDoubtClassroomResponse] = await Promise.all([
        DashboardService.getSummary(),
        DashboardService.getFeed(),
        topDoubtClassroomRequest,
      ]);

      if (summaryResponse.error) {
        throw new Error(summaryResponse.error);
      }
      if (feedResponse.error) {
        throw new Error(feedResponse.error);
      }
      if (topDoubtClassroomResponse.error) {
        throw new Error(topDoubtClassroomResponse.error);
      }

      setSummary(summaryResponse.data || null);
      setFeed(feedResponse.data || null);
      setTopDoubtClassroom(topDoubtClassroomResponse.data || null);
    } catch (error) {
      toast({
        title: "Failed to load dashboard",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const cards =
    userRole === "teacher"
      ? [
          {
            title: "Classrooms",
            value: summary?.stats.totalClassrooms || 0,
            icon: <GraduationCap className="h-5 w-5" />,
            description: "Classes currently managed by you",
          },
          {
            title: "Students",
            value: summary?.stats.totalStudents || 0,
            icon: <Users className="h-5 w-5" />,
            description: "Total enrolled students across your classes",
          },
          {
            title: "New Doubts",
            value: summary?.stats.newDoubts || 0,
            icon: <MessageCircleQuestion className="h-5 w-5" />,
            description: "Student questions needing attention",
          },
          {
            title: "Live Sessions",
            value: summary?.stats.activeLiveSession || 0,
            icon: <PlayCircle className="h-5 w-5" />,
            description: "Active live sessions right now",
          },
        ]
      : [
          {
            title: "Enrolled Classes",
            value: summary?.stats.enrolledClasses || 0,
            icon: <GraduationCap className="h-5 w-5" />,
            description: "Classes you are currently enrolled in",
          },
          {
            title: "Pending Work",
            value: summary?.stats.pendingAssignments || 0,
            icon: <BookOpen className="h-5 w-5" />,
            description: "Assignments still waiting for submission",
          },
          {
            title: "Missed Work",
            value: summary?.stats.missedAssignments || 0,
            icon: <AlertCircle className="h-5 w-5" />,
            description: "Assignments past due date",
          },
          {
            title: "Live Classes",
            value: summary?.stats.activeLiveClasses || 0,
            icon: <PlayCircle className="h-5 w-5" />,
            description: "Active live sessions available to join",
          },
        ];

  const handleRecentActivityClick = (item: DashboardFeedListItem) => {
    if (!item.classroomId) {
      return;
    }

    if (item.type === "NEW_DOUBT") {
      navigate(`/classrooms/${item.classroomId}`, {
        state: { activeTab: "doubts" },
      });
      return;
    }

    if ((item.type === "MENTION" || item.type === "ASSIGNMENT_SUBMITTED") && item.announcementId) {
      navigate(`/classrooms/${item.classroomId}`, {
        state: {
          activeTab: "announcements",
          selectedAnnouncementId: item.announcementId,
        },
      });
      return;
    }

    navigate(`/classrooms/${item.classroomId}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{`Hello ${user.name.split(" ")[0]} 👋`}</h1>
          <p className="mt-1 text-muted-foreground">
            {userRole === "teacher"
              ? "Your classroom workspace for priorities, activity, and live teaching."
              : "Your study workspace for deadlines, materials, and live classes."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ClassroomButton userRole={userRole} />
          {userRole === "student" && (
            <>
              <Button variant="outline" onClick={() => navigate("/allmaterials/assignments")}>
                All assignments
              </Button>
              <Button variant="outline" onClick={() => navigate("/allmaterials/notes")}>
                Materials
              </Button>
            </>
          )}
          {userRole === "teacher" && (
            <>
              {targetClassroomId  &&( <Button
                variant="outline"
                onClick={() => {
                  if (!targetClassroomId) {
                    toast({
                      title: "No classroom doubts found",
                      variant: "default",
                    });
                    return;
                  }

                  navigate(`/classrooms/${targetClassroomId}`, {
                    state: {
                      activeTab: topDoubtClassroom?.classroom?.id ? "doubts" : "students",
                    },
                  });
                }}
              >
                Busiest class
              </Button>)}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading && !summary
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))
          : cards.map((card) => <DashboardCard key={card.title} {...card} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr,1fr]">
        <div className="space-y-6">
          {userRole === "teacher" ? (
            <>
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Needs attention
                  </CardTitle>
                  <CardDescription>Assignments, doubts, and classes that deserve action first.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading && !feed ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 rounded-2xl" />
                    ))
                  ) : feed?.lists.needsAttention?.length ? (
                    feed.lists.needsAttention.map((item) => (
                      <button
                        key={item.id}
                        className="w-full rounded-2xl border border-border/70 bg-muted/20 p-4 text-left transition hover:border-primary/40"
                        onClick={() =>
                          item.classroomId &&
                          navigate(`/classrooms/${item.classroomId}`, {
                            state: {
                              activeTab:
                                item.type === "doubt"
                                  ? "doubts"
                                  : item.type === "assignment"
                                    ? "updates"
                                    : "announcements",
                            },
                          })
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{item.title || item.summary}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.classroomName || "Classroom"}
                              {item.pendingCount ? ` · ${item.pendingCount} pending` : ""}
                              {item.studentName ? ` · ${item.studentName}` : ""}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nothing urgent right now.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent classroom activity
                  </CardTitle>
                  <CardDescription>Latest signals across your classrooms.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {feed?.lists.recentActivity?.length ? (
                    feed.lists.recentActivity.map((item) => (
                      <button
                        key={item.id}
                        className="w-full rounded-2xl border border-border/70 p-4 text-left transition hover:border-primary/40"
                        onClick={() => handleRecentActivityClick(item)}
                      >
                        <p className="font-medium text-foreground">{item.summary}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.classroomName} · {formatDate(item.createdAt)}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity to show yet.</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Due soon
                  </CardTitle>
                  <CardDescription>Your nearest deadlines across classrooms.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {feed?.lists.dueSoon?.length ? (
                    feed.lists.dueSoon.map((item) => (
                      <button
                        key={item.id}
                        className="w-full rounded-2xl border border-border/70 p-4 text-left transition hover:border-primary/40"
                        onClick={() => navigate("/allmaterials/assignments")}
                      >
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Due {formatDate(item.dueDate)}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No pending deadlines right now.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Missed work
                  </CardTitle>
                  <CardDescription>Assignments that need recovery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {feed?.lists.missedWork?.length ? (
                    feed.lists.missedWork.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-border/70 p-4">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Missed on {formatDate(item.dueDate)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No missed assignments.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                Live class status
              </CardTitle>
              <CardDescription>
                {userRole === "teacher" ? "Your current live teaching state." : "Live sessions you can join."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {feed?.lists.activeLiveClasses?.length ? (
                feed.lists.activeLiveClasses.map((item) => (
                  <button
                    key={item.sessionId || item.id}
                    className="w-full rounded-2xl border border-border/70 p-4 text-left transition hover:border-primary/40"
                    onClick={() =>
                      item.classroomId && navigate(`/classrooms/${item.classroomId}/live`)
                    }
                  >
                    <p className="font-medium text-foreground">
                      {item.classroomName || "Active live classroom"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {userRole === "teacher" ? "Resume session controls" : "Join now"}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {userRole === "teacher"
                    ? "No live class is active right now."
                    : "No live classes available right now."}
                </p>
              )}
            </CardContent>
          </Card>

          {userRole === "student" && (
            <>
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookText className="h-5 w-5 text-primary" />
                    Recent materials
                  </CardTitle>
                  <CardDescription>Latest study notes and files added for your classes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {feed?.lists.recentMaterials?.length ? (
                    feed.lists.recentMaterials.map((item) => (
                      <button
                        key={item.id}
                        className="block w-full rounded-2xl border border-border/70 p-4 text-left transition hover:border-primary/40"
                        onClick={() => navigate("/allmaterials/notes")}
                      >
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Added {formatDate(item.createdAt)}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent materials yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent mentions
                  </CardTitle>
                  <CardDescription>Discussion activity that directly references you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {feed?.lists.recentMentions?.length ? (
                    feed.lists.recentMentions.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-border/70 p-4">
                        <p className="font-medium text-foreground">{item.summary}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent mentions.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
