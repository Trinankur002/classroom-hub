import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  Copy,
  FileText,
  MessageCircleQuestion,
  PlayCircle,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ClassroomService from "@/services/classroomService";
import { toast } from "@/hooks/use-toast";
import { ClassroomOverview } from "@/types/classroomOverview";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import { IClassroom } from "@/types/classroom";

interface Props {
  classroom: IClassroom;
  onViewAnnouncement?: (a: IClassroomAnnouncement) => void;
  onNavigateTab?: (tab: string) => void;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "No activity yet";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${accent}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function ClassDetails({ classroom, onViewAnnouncement, onNavigateTab }: Props) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [overview, setOverview] = useState<ClassroomOverview | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userRole = user?.role?.toString().toLowerCase();

  useEffect(() => {
    let mounted = true;
    const loadOverview = async () => {
      setIsLoading(true);
      const { data, error } = await ClassroomService.getClassroomOverview(classroom.id);
      if (!mounted) return;
      if (error) {
        toast({
          title: "Failed to load class overview",
          description: error,
          variant: "destructive",
        });
      } else {
        setOverview(data || null);
      }
      setIsLoading(false);
    };

    loadOverview();
    return () => {
      mounted = false;
    };
  }, [classroom.id]);

  const stats = useMemo(
    () =>
      overview
        ? [
            {
              label: "Announcements",
              value: overview.counts.announcements,
              icon: <ClipboardList className="h-5 w-5 text-sky-900" />,
              accent: "bg-sky-200/90",
            },
            {
              label: "Assignments",
              value: overview.counts.assignments,
              icon: <BookOpen className="h-5 w-5 text-emerald-900" />,
              accent: "bg-emerald-200/90",
            },
            {
              label: "Doubts",
              value: overview.counts.doubts,
              icon: <MessageCircleQuestion className="h-5 w-5 text-amber-900" />,
              accent: "bg-amber-200/90",
            },
            {
              label: "Materials",
              value: overview.counts.materials,
              icon: <FileText className="h-5 w-5 text-violet-900" />,
              accent: "bg-violet-200/90",
            },
          ]
        : [],
    [overview],
  );

  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(classroom.joinCode);
      toast({
        title: "Join code copied",
        description: `${classroom.joinCode} copied to clipboard`,
      });
    } catch {
      toast({
        title: "Could not copy join code",
        description: "Copy it manually from the class header.",
        variant: "destructive",
      });
    }
  };

  const openChat = () => onNavigateTab?.("chat");
  const openDoubts = () => onNavigateTab?.("doubts");
  const openStudents = () => onNavigateTab?.("students");
  const openLive = () =>
    navigate(userRole === "student" ? "/live" : `/classrooms/${classroom.id}/live`, {
      state: userRole === "student" ? { classroomId: classroom.id } : undefined,
    });
  const openAssignments = () => navigate("/allmaterials/assignments");
  const openMaterials = () => navigate("/allmaterials/notes");

  if (isLoading && !overview) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  const data = overview;
  const studentPanel = data?.studentPanel;
  const teacherPanel = data?.teacherPanel;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-3xl border-border/60">
        <CardContent className="p-0">
          <div className="grid gap-6 p-6 md:grid-cols-[1.4fr,0.8fr] md:p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full">
                  {classroom.teacher?.name || "Teacher"}
                </Badge>
                {data?.activeLiveSession?.isActive && (
                  <Badge className="rounded-full">
                    Live session active
                  </Badge>
                )}
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">{classroom.name}</h2>
                <p className="mt-2 max-w-2xl text-sm">
                  {classroom.description || "No class description added yet."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="rounded-2xl px-3 py-2">
                  Join code: <span className="font-semibold">{classroom.joinCode}</span>
                </div>
                <div className="rounded-2xl px-3 py-2">
                  {overview?.counts.students || 0} students
                </div>
                <div className="rounded-2xl px-3 py-2">
                  Created {formatDate(classroom.createdAt)}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border  p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em]">Quick actions</p>
              <div className="mt-4 grid gap-3">
                {userRole === "teacher" ? (
                  <>
                    <Button className="justify-start rounded-2xl" variant="secondary" onClick={openStudents}>
                      <Users className="mr-2 h-4 w-4" />
                      Open student roster
                    </Button>
                    <Button className="justify-start rounded-2xl" variant="secondary" onClick={openDoubts}>
                      <MessageCircleQuestion className="mr-2 h-4 w-4" />
                      Review recent doubts
                    </Button>
                    <Button className="justify-start rounded-2xl" variant="secondary" onClick={openChat}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Open class chat
                    </Button>
                    <Button className="justify-start rounded-2xl" variant="secondary" onClick={openLive}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      {data?.activeLiveSession ? "Resume live class" : "Start live class"}
                    </Button>
                    <Button className="justify-start rounded-2xl" variant="outline" onClick={copyJoinCode}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy join code
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="justify-start rounded-2xl" variant="secondary" onClick={openAssignments}>
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Open pending assignments
                    </Button>
                    <Button className="justify-start rounded-2xl" variant="secondary" onClick={openAssignments}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Open missed assignments
                    </Button>
                    <Button className="justify-start rounded-2xl" variant="secondary" onClick={openDoubts}>
                      <MessageCircleQuestion className="mr-2 h-4 w-4" />
                      Ask or review doubts
                    </Button>
                    <Button className="justify-start rounded-2xl" variant="secondary" onClick={openChat}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Open class chat
                    </Button>
                    {data?.activeLiveSession && (
                      <Button className="justify-start rounded-2xl" variant="outline" onClick={openLive}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Join live class
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatTile key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr,1fr]">
        <div className="space-y-6">
          <Card className="rounded-3xl border-border/70">
            <CardHeader>
              <CardTitle className="text-xl">Recent activity</CardTitle>
              <CardDescription>Latest announcements, doubts, and assignment signals in this class.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.recentAnnouncements?.length ? (
                data.recentAnnouncements.map((announcement) => (
                  <button
                    key={announcement.id}
                    className="w-full rounded-2xl border border-border/70 bg-muted/20 p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
                    onClick={() =>
                      onViewAnnouncement?.({
                        id: announcement.id,
                        name: announcement.title,
                        description: announcement.description,
                        classroomId: announcement.classroomId,
                        dueDate: announcement.dueDate,
                        isAssignment: announcement.isAssignment,
                        isNote: announcement.isNote,
                        updatedAt: announcement.updatedAt,
                      })
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{announcement.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {announcement.description || "No extra description."}
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        {announcement.isAssignment
                          ? "Assignment"
                          : announcement.isNote
                            ? "Material"
                            : "Update"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{announcement.fileCount || 0} files</span>
                      <span>{formatDateTime(announcement.updatedAt || announcement.createdAt)}</span>
                    </div>
                  </button>
                ))
              ) : (
                <EmptyPanel
                  title="No updates yet"
                  description="This class has not published any recent announcements or materials."
                />
              )}

              {data?.recentDoubts?.length ? (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-foreground">Recent doubts</p>
                  {data.recentDoubts.map((doubt) => (
                    <button
                      key={doubt.id}
                      className="w-full rounded-2xl border border-border/70 bg-card/80 p-4 text-left transition hover:border-primary/40"
                      onClick={openDoubts}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {doubt.doubtDescribtion || "Student asked a question"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {doubt.student?.name || "Student"} · {doubt.messageCount || 0} replies
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(doubt.updatedAt || doubt.createdAt)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  title="No recent doubts"
                  description="Questions from students will appear here for quick review."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border-border/70">
            <CardHeader>
              <CardTitle className="text-xl">
                {userRole === "teacher" ? "Teaching focus" : "Work focus"}
              </CardTitle>
              <CardDescription>
                {userRole === "teacher"
                  ? "The highest-value actions you can take in this classroom right now."
                  : "Your next useful things to do in this classroom."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userRole === "teacher" ? (
                teacherPanel?.pendingAssignments?.length ? (
                  teacherPanel.pendingAssignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-2xl border border-border/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{assignment.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {assignment.pendingStudentsCount || 0} students still pending
                          </p>
                        </div>
                        <Badge className="rounded-full" variant="outline">
                          Due {formatDate(assignment.dueDate)}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyPanel
                    title="No pending submission issues"
                    description="Assignments with students still pending will show up here."
                  />
                )
              ) : studentPanel?.pendingAssignments?.length || studentPanel?.missedAssignments?.length ? (
                <>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Pending assignments</p>
                    {studentPanel.pendingAssignments.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-2xl border border-border/70 p-4">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Due {formatDate(item.dueDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Missed work</p>
                    {studentPanel.missedAssignments.length ? (
                      studentPanel.missedAssignments.slice(0, 2).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-border/70 p-4">
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Missed on {formatDate(item.dueDate)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No missed work in this class.</p>
                    )}
                  </div>
                </>
              ) : (
                <EmptyPanel
                  title="No urgent work in this class"
                  description="Pending assignments and missed deadlines will surface here."
                />
              )}
            </CardContent>
          </Card>

          {/*<Card className="rounded-3xl border-border/70">
            <CardHeader>
              <CardTitle className="text-xl">Class snapshot</CardTitle>
              <CardDescription>Quick facts and supporting context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Teacher</p>
                <p className="mt-1 font-medium text-foreground">{classroom.teacher?.name || "Unknown"}</p>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Chat participants</p>
                <p className="mt-1 font-medium text-foreground">
                  {data?.chat?.participantCount ?? 0} members in classroom chat
                </p>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Recent materials</p>
                {studentPanel?.recentMaterials?.length ? (
                  <div className="mt-2 space-y-2">
                    {studentPanel.recentMaterials.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        className="block text-left text-sm text-foreground hover:text-primary"
                        onClick={openMaterials}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No recent materials yet.</p>
                )}
              </div>
            </CardContent>
          </Card>*/}


        </div>
      </div>
    </div>
  );
}

export default ClassDetails;
