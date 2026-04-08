import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LiveRoomProvider } from "@/components/live/LiveRoomProvider";
import { Button } from "@/components/ui/button";
import { liveSessionSocketService } from "@/services/live-session.socket.service";
import { WEBSOCKET_EVENTS } from "@/constants/websocketEvents";
import { LiveSessionApi } from "@/services/live-session.api";
import {
  LiveClassPermissions,
  LiveSession,
  TokenResponse,
} from "@/types/live-session";
import { StudentRoomRuntime } from "./StudentRoomRuntime";
import { WaitingApprovalSkeleton } from "./WaitingApprovalSkeleton";
import {
  ClassroomLivePageProps,
  PreJoinState,
  StudentLiveState,
  useClassroomName,
  useParticipantDirectory,
} from "./classroomLiveShared";

type StudentClassroomLivePageProps = Required<Pick<ClassroomLivePageProps, "classroomId">> &
  Omit<ClassroomLivePageProps, "classroomId" | "startPermissions">;

export function StudentClassroomLivePage({
  classroomId,
  preJoinState,
  onLeavePage,
}: StudentClassroomLivePageProps) {
  const { user } = useAuth();
  const location = useLocation();
  const classroomName = useClassroomName(classroomId);
  const { participantNameMap, participantRoleMap } = useParticipantDirectory(classroomId);
  const [liveState, setLiveState] = useState<StudentLiveState>("checking-session");
  const [session, setSession] = useState<LiveSession | null>(null);
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [permissions, setPermissions] = useState<LiveClassPermissions>({
    allowStudentMicrophone: false,
    allowStudentCamera: false,
    allowStudentScreenShare: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preJoin = preJoinState || (location.state as PreJoinState | null)?.preJoin;
  const preJoinAppliedRef = useRef(false);

  const teacherIdentity = useMemo(() => {
    return Object.entries(participantRoleMap).find(([, role]) => role === "Teacher")?.[0];
  }, [participantRoleMap]);

  const loadActiveSession = useCallback(async () => {
    setError(null);
    setLiveState("checking-session");

    try {
      const active = await LiveSessionApi.getActiveSession(classroomId);
      if (!active?.sessionId) {
        setSession(null);
        setTokenData(null);
        setLiveState("no-session");
        return;
      }

      setSession(active);
      setTokenData(null);
      setPermissions({
        allowStudentMicrophone: active.allowStudentMicrophone ?? false,
        allowStudentCamera: active.allowStudentCamera ?? false,
        allowStudentScreenShare: active.allowStudentScreenShare ?? false,
      });
      setLiveState("session-active");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to check active live class.",
      );
      setSession(null);
      setTokenData(null);
      setLiveState("no-session");
    }
  }, [classroomId]);

  const fetchTokenAndConnect = useCallback(
    async (sessionId: string, fallbackState: StudentLiveState = "waiting-approval") => {
      setError(null);
      setLiveState("connecting");

      try {
        const token = await LiveSessionApi.getToken(sessionId);
        setTokenData(token);
        setPermissions({
          allowStudentMicrophone: token.allowStudentMicrophone ?? false,
          allowStudentCamera: token.allowStudentCamera ?? false,
          allowStudentScreenShare: token.allowStudentScreenShare ?? false,
        });
      } catch (err: any) {
        setTokenData(null);
        setLiveState(fallbackState);
        setError(
          err?.response?.data?.message || err?.message || "Failed to connect to live class.",
        );
      }
    },
    [],
  );

  const handleRequestJoin = useCallback(async () => {
    if (!session?.sessionId || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await LiveSessionApi.requestJoin(session.sessionId);
      const status = String(response?.status || "waiting");

      if (status === "approved") {
        await fetchTokenAndConnect(session.sessionId, "session-active");
      } else {
        setLiveState("waiting-approval");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to request join.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchTokenAndConnect, isLoading, session?.sessionId]);

  useEffect(() => {
    void loadActiveSession();
  }, [loadActiveSession]);

  useEffect(() => {
    if (preJoinAppliedRef.current) return;
    if (!preJoin?.sessionId || !session?.sessionId) return;
    if (preJoin.sessionId !== session.sessionId) return;

    preJoinAppliedRef.current = true;
    if (String(preJoin.status || "").toLowerCase() === "approved") {
      void fetchTokenAndConnect(session.sessionId, "session-active");
      return;
    }
    setLiveState("waiting-approval");
  }, [fetchTokenAndConnect, preJoin?.sessionId, preJoin?.status, session?.sessionId]);

  useEffect(() => {
    if (!session?.sessionId || !user?.id) return;

    const authToken = localStorage.getItem("token");
    if (!authToken) return;

    liveSessionSocketService.connect(authToken);
    liveSessionSocketService.joinSession(session.sessionId);

    const onParticipantApproved = async (payload: Record<string, unknown>) => {
      const approvedUserId = String(payload?.userId || "");
      if (approvedUserId !== user.id) return;
      await fetchTokenAndConnect(session.sessionId, "waiting-approval");
    };

    const onParticipantRemoved = (payload: Record<string, unknown>) => {
      const removedUserId = String(payload?.userId || "");
      if (removedUserId !== user.id) return;
      setTokenData(null);
      setLiveState("session-active");
      setError("You were removed from this live class.");
    };

    const onSessionEnded = () => {
      setSession(null);
      setTokenData(null);
      setLiveState("no-session");
      setError("Live class has ended.");
    };

    liveSessionSocketService.on(WEBSOCKET_EVENTS.PARTICIPANT_APPROVED, onParticipantApproved);
    liveSessionSocketService.on(WEBSOCKET_EVENTS.PARTICIPANT_REMOVED, onParticipantRemoved);
    liveSessionSocketService.on(WEBSOCKET_EVENTS.SESSION_ENDED, onSessionEnded);

    return () => {
      liveSessionSocketService.off(WEBSOCKET_EVENTS.PARTICIPANT_APPROVED, onParticipantApproved);
      liveSessionSocketService.off(WEBSOCKET_EVENTS.PARTICIPANT_REMOVED, onParticipantRemoved);
      liveSessionSocketService.off(WEBSOCKET_EVENTS.SESSION_ENDED, onSessionEnded);
      liveSessionSocketService.disconnect();
    };
  }, [fetchTokenAndConnect, session?.sessionId, user?.id]);

  if (liveState === "checking-session") {
    return <div className="p-4">Checking active live class...</div>;
  }

  if (liveState === "no-session") {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">Live class has not started yet.</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button variant="outline" onClick={() => void loadActiveSession()}>
          Refresh
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">Unable to locate active live session.</p>
        <Button variant="outline" onClick={() => void loadActiveSession()}>
          Retry
        </Button>
      </div>
    );
  }

  if (liveState === "session-active") {
    return (
      <div className="space-y-3 p-4">
        <h1 className="text-xl font-semibold">{classroomName}</h1>
        <p className="text-sm text-muted-foreground">Live class is active.</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={() => void handleRequestJoin()} disabled={isLoading}>
          {isLoading ? "Requesting..." : "Request to Join Live Class"}
        </Button>
      </div>
    );
  }

  if (liveState === "waiting-approval" && !tokenData) {
    return <WaitingApprovalSkeleton classroomName={classroomName} error={error} />;
  }

  if (!tokenData) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-1.5rem)] overflow-hidden rounded-[32px] border border-border/60 bg-card/50">
      <LiveRoomProvider
        token={tokenData.token}
        livekitUrl={tokenData.livekitUrl || import.meta.env.VITE_LIVEKIT_WS_URL}
        preserveConnectionOnUnmount
      >
        <StudentRoomRuntime
          session={session}
          classroomId={classroomId}
          classroomName={classroomName}
          permissions={permissions}
          participantNameMap={participantNameMap}
          participantRoleMap={participantRoleMap}
          teacherIdentity={teacherIdentity}
          onConnected={() => setLiveState("connected")}
          onPermissionsChange={setPermissions}
          onLeavePage={onLeavePage}
        />
      </LiveRoomProvider>
    </div>
  );
}
