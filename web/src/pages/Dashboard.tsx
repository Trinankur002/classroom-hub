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
  DashboardProgress,
  DashboardSummary,
  DashboardTopDoubtClassroom,
} from "@/types/dashboard";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
  const [progress, setProgress] = useState<DashboardProgress | null>(null);
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
      const progressRequest = DashboardService.getProgress();

      const [summaryResponse, feedResponse, topDoubtClassroomResponse, progressResponse] = await Promise.all([
        DashboardService.getSummary(),
        DashboardService.getFeed(),
        topDoubtClassroomRequest,
        progressRequest,
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
      if (progressResponse.error) {
        throw new Error(progressResponse.error);
      }

      setSummary(summaryResponse.data || null);
      setFeed(feedResponse.data || null);
      setTopDoubtClassroom(topDoubtClassroomResponse.data || null);
      setProgress(progressResponse.data || null);
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

  const assignmentCompletionData = progress?.charts.assignmentCompletion || [];
  const gradeTrendData = progress?.charts.gradeTrends || [];
  const hasAssignmentCompletionData = assignmentCompletionData.length > 0;
  const hasGradeTrendData = gradeTrendData.length > 0;
  const teacherProgressRows =
    progress?.role === "teacher"
      ? [
          { label: "Assignment completion", value: progress.metrics.assignmentCompletionPercent },
          { label: "Student activity", value: progress.metrics.studentActivityPercent },
          { label: "Doubt participation", value: progress.metrics.doubtParticipationPercent },
          { label: "Attendance", value: progress.metrics.attendancePercent },
        ].filter((item) => item.value > 0)
      : [];
  const studentProgressTiles =
    progress?.role === "student"
      ? [
          { label: "Completed assignments", value: progress.metrics.completedAssignments },
          { label: "Pending assignments", value: progress.metrics.pendingAssignments },
          { label: "Average grade", value: progress.metrics.grades },
          { label: "Performance", value: progress.metrics.performance, suffix: "%" },
          { label: "Doubts asked", value: progress.metrics.doubtsAsked },
          { label: "Live attendance", value: progress.metrics.liveClassAttendance },
        ].filter((item) => item.value > 0)
      : [];
  const hasTeacherProgressData = progress?.role === "teacher" && teacherProgressRows.length > 0;
  const hasStudentProgressData = progress?.role === "student" && studentProgressTiles.length > 0;
  const showProgressCard = loading || hasTeacherProgressData || hasStudentProgressData;
  const assignmentChartHeightClass =
    assignmentCompletionData.length <= 2 ? "h-44" : assignmentCompletionData.length <= 5 ? "h-56" : "h-64";
  const gradeTrendHeightClass =
    gradeTrendData.length <= 3 ? "h-48" : gradeTrendData.length <= 6 ? "h-60" : "h-72";

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

      <div className="grid gap-6 xl:grid-cols-2">
        {showProgressCard && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Student progress
            </CardTitle>
            <CardDescription>
              {userRole === "teacher"
                ? "Assignment completion, activity, doubts, and attendance across your classes."
                : "Track your submissions, grades, performance, and participation."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && !progress ? (
              Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-12 rounded-xl" />)
            ) : userRole === "teacher" && progress?.role === "teacher" && teacherProgressRows.length ? (
              <>
                {teacherProgressRows.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <Progress value={item.value} />
                  </div>
                ))}
              </>
            ) : progress?.role === "student" && studentProgressTiles.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {studentProgressTiles.map((item) => (
                  <div key={item.label} className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-xl font-semibold">
                      {item.value}
                      {item.suffix || ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No progress data available yet.</p>
            )}
          </CardContent>
        </Card>
        )}

        {(loading || hasAssignmentCompletionData) && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookText className="h-5 w-5 text-primary" />
              Assignment completion
            </CardTitle>
            <CardDescription>Completion distribution based on your role.</CardDescription>
          </CardHeader>
          <CardContent className={assignmentChartHeightClass}>
            {loading && !progress ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : hasAssignmentCompletionData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assignmentCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={assignmentCompletionData.length > 4 ? -20 : 0}
                    textAnchor={assignmentCompletionData.length > 4 ? "end" : "middle"}
                    height={assignmentCompletionData.length > 4 ? 50 : 30}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>
        )}
      </div>

      {(loading || hasGradeTrendData) && (
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Grade trends
          </CardTitle>
          <CardDescription>How grades are trending over time.</CardDescription>
        </CardHeader>
        <CardContent className={gradeTrendHeightClass}>
          {loading && !progress ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : hasGradeTrendData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeTrendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>
      )}

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
                      item.classroomId &&
                      navigate(userRole === "student" ? "/live" : `/classrooms/${item.classroomId}/live`, {
                        state: userRole === "student" ? { classroomId: item.classroomId } : undefined,
                      })
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
