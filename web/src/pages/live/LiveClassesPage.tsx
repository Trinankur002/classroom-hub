import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LiveSessionApi } from "@/services/live-session.api";
import { ActiveLiveSession } from "@/types/live-session";
import { LiveClassList } from "@/components/live/LiveClassList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function LiveClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase?.() || "";
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ActiveLiveSession[]>([]);
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await LiveSessionApi.getActiveSessionsForUser();
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: "Failed to load live classes",
        description: error?.response?.data?.message || error?.message || "Something went wrong",
        variant: "destructive",
      });
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleJoin = async (session: ActiveLiveSession) => {
    if (userRole !== "student") {
      navigate(`/classrooms/${session.classroomId}/live`);
      return;
    }

    if (joiningSessionId) return;

    setJoiningSessionId(session.sessionId);
    try {
      const response = await LiveSessionApi.requestJoin(session.sessionId);
      navigate(`/classrooms/${session.classroomId}/live`, {
        state: {
          preJoin: {
            sessionId: session.sessionId,
            status: String(response?.status || "waiting"),
          },
        },
      });
    } catch (error: any) {
      toast({
        title: "Failed to join live class",
        description: error?.response?.data?.message || error?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setJoiningSessionId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Classes</h1>
          <p className="mt-1 text-muted-foreground">
            {userRole === "student"
              ? "Join active live sessions across your classrooms."
              : "View your currently active live sessions."}
          </p>
        </div>
        <Button variant="outline" onClick={loadSessions} disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <LiveClassList sessions={sessions} onJoin={handleJoin} joiningSessionId={joiningSessionId} />
      )}
    </div>
  );
}
