import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ClassroomService from "@/services/classroomService";
import { IClassroom } from "@/types/classroom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import ClassroomLivePage from "./ClassroomLivePage";
import { LiveSessionApi } from "@/services/live-session.api";

interface LaunchConfig {
  classroomId: string;
  allowStudentMicrophone: boolean;
  allowStudentCamera: boolean;
  allowStudentScreenShare: boolean;
}

export default function LiveClassPage() {
  const { user } = useAuth();
  const isTeacher = user?.role?.toLowerCase() === "teacher";

  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [allowStudentMicrophone, setAllowStudentMicrophone] = useState(false);
  const [allowStudentCamera, setAllowStudentCamera] = useState(false);
  const [allowStudentScreenShare, setAllowStudentScreenShare] = useState(false);
  const [launchConfig, setLaunchConfig] = useState<LaunchConfig | null>(null);
  const [activeTeacherSession, setActiveTeacherSession] = useState<{
    sessionId: string;
    classroomId: string;
    allowStudentMicrophone?: boolean;
    allowStudentCamera?: boolean;
    allowStudentScreenShare?: boolean;
  } | null>(null);
  const launchPermissions = useMemo(() => {
    if (!launchConfig) return undefined;
    return {
      allowStudentMicrophone: launchConfig.allowStudentMicrophone,
      allowStudentCamera: launchConfig.allowStudentCamera,
      allowStudentScreenShare: launchConfig.allowStudentScreenShare,
    };
  }, [launchConfig]);

  useEffect(() => {
    const loadActiveTeacherSession = async () => {
      if (!isTeacher) return;
      try {
        const session = await LiveSessionApi.getTeacherActiveSession();
        setActiveTeacherSession(session);
      } catch {
        setActiveTeacherSession(null);
      }
    };

    const loadClassrooms = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await ClassroomService.getAllClassrooms();
        setClassrooms(data || []);
        if (error) {
          toast({
            title: "Failed to load classrooms",
            description: error,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveTeacherSession();
    loadClassrooms();
  }, [isTeacher]);

  if (launchConfig) {
    return (
      <div className="p-2">
        <ClassroomLivePage
          classroomId={launchConfig.classroomId}
          startPermissions={launchPermissions}
          onLeavePage={async () => {
            setLaunchConfig(null);
            if (isTeacher) {
              const session = await LiveSessionApi.getTeacherActiveSession();
              setActiveTeacherSession(session);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{isTeacher ? "Start Live Class" : "Join Live Class"}</CardTitle>
          <CardDescription>
            {isTeacher
              ? "Choose a classroom and configure student permissions before going live."
              : "Choose your classroom to join an active live class session."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTeacher && activeTeacherSession && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="text-sm font-medium">You already have an active live class.</div>
              <div className="text-sm text-muted-foreground">
                Rejoin it or end it directly from here.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setLaunchConfig({
                      classroomId: activeTeacherSession.classroomId,
                      allowStudentMicrophone: !!activeTeacherSession.allowStudentMicrophone,
                      allowStudentCamera: !!activeTeacherSession.allowStudentCamera,
                      allowStudentScreenShare: !!activeTeacherSession.allowStudentScreenShare,
                    });
                  }}
                >
                  Resume Live Class
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await LiveSessionApi.endSession(activeTeacherSession.sessionId);
                      setActiveTeacherSession(null);
                      toast({
                        title: "Session ended",
                        description: "Active live class has been ended.",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Failed to end session",
                        description: error?.response?.data?.message || error?.message || "Please try again",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  End Active Session
                </Button>
              </div>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            Total classrooms: {classrooms.length}
          </div>
          <Button
            disabled={isLoading || classrooms.length === 0 || (isTeacher && !!activeTeacherSession)}
            onClick={() => setDialogOpen(true)}
          >
            {isTeacher ? (activeTeacherSession ? "Live Session Running" : "Start Live Class") : "Join Live Class"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isTeacher ? "Start Live Session" : "Join Live Session"}</DialogTitle>
            <DialogDescription>
              Select a classroom to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Classroom</label>
              <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select classroom" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isTeacher && (
              <div className="space-y-3 rounded-md border border-border p-3">
                <h4 className="text-sm font-semibold">Student Permissions</h4>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">Allow Microphone</span>
                  <Switch checked={allowStudentMicrophone} onCheckedChange={setAllowStudentMicrophone} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">Allow Camera</span>
                  <Switch checked={allowStudentCamera} onCheckedChange={setAllowStudentCamera} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">Allow Screen Share</span>
                  <Switch checked={allowStudentScreenShare} onCheckedChange={setAllowStudentScreenShare} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedClassroomId}
              onClick={() => {
                setLaunchConfig({
                  classroomId: selectedClassroomId,
                  allowStudentMicrophone,
                  allowStudentCamera,
                  allowStudentScreenShare,
                });
                setDialogOpen(false);
              }}
            >
              {isTeacher ? "Go Live" : "Enter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
