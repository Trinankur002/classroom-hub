import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LiveSessionApi } from "@/services/live-session.api";
import { ActiveLiveSession } from "@/types/live-session";
import { LiveClassList } from "@/components/live/LiveClassList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import ClassroomLivePage from "@/pages/ClassroomLivePage";
import { useLiveSessionContext } from "@/components/live/LiveSessionContext";

export default function LiveClassesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { liveSessionActive, currentClassroomId, currentSessionId } = useLiveSessionContext();
  const userRole = user?.role?.toLowerCase?.() || "";
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ActiveLiveSession[]>([]);
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [activeClassroomId, setActiveClassroomId] = useState<string | null>(null);
  const [preJoinState, setPreJoinState] = useState<{ sessionId?: string; status?: string } | undefined>(undefined);
  const [hasAppliedRouteClassroomHint, setHasAppliedRouteClassroomHint] = useState(false);
  const classroomHint = (location.state as { classroomId?: string; preJoin?: { sessionId?: string; status?: string } } | null)?.classroomId;
  const routePreJoin = (location.state as { classroomId?: string; preJoin?: { sessionId?: string; status?: string } } | null)?.preJoin;

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

  useEffect(() => {
    if (!liveSessionActive || !currentClassroomId) return;
    setActiveClassroomId((current) => current ?? currentClassroomId);
    setPreJoinState((current) => current ?? {
      sessionId: currentSessionId ?? undefined,
      status: "approved",
    });
  }, [currentClassroomId, currentSessionId, liveSessionActive]);

  const handleJoin = async (session: ActiveLiveSession) => {
    if (userRole !== "student") {
      setPreJoinState(undefined);
      setActiveClassroomId(session.classroomId);
      return;
    }

    if (joiningSessionId) return;

    setJoiningSessionId(session.sessionId);
    try {
      const response = await LiveSessionApi.requestJoin(session.sessionId);
      setPreJoinState({
        sessionId: session.sessionId,
        status: String(response?.status || "waiting"),
      });
      setActiveClassroomId(session.classroomId);
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

  useEffect(() => {
    if (hasAppliedRouteClassroomHint) return;
    if (!classroomHint || !sessions.length) return;

    const matched = sessions.find((session) => session.classroomId === classroomHint);
    if (!matched) {
      setHasAppliedRouteClassroomHint(true);
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    setHasAppliedRouteClassroomHint(true);

    if (userRole !== "student") {
      setPreJoinState(routePreJoin);
      setActiveClassroomId(matched.classroomId);
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    void (async () => {
      setJoiningSessionId(matched.sessionId);
      try {
        const response = await LiveSessionApi.requestJoin(matched.sessionId);
        setPreJoinState({
          sessionId: matched.sessionId,
          status: String(response?.status || routePreJoin?.status || "waiting"),
        });
        setActiveClassroomId(matched.classroomId);
      } catch {
        setPreJoinState(routePreJoin);
        setActiveClassroomId(matched.classroomId);
      } finally {
        setJoiningSessionId(null);
        navigate(location.pathname, { replace: true, state: null });
      }
    })();
  }, [
    classroomHint,
    hasAppliedRouteClassroomHint,
    location.pathname,
    navigate,
    routePreJoin,
    sessions,
    userRole,
  ]);

  if (activeClassroomId) {
    return (
      <div className="p-2">
        <ClassroomLivePage
          classroomId={activeClassroomId}
          preJoinState={preJoinState}
          onLeavePage={() => {
            setActiveClassroomId(null);
            setPreJoinState(undefined);
            void loadSessions();
          }}
        />
      </div>
    );
  }

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
