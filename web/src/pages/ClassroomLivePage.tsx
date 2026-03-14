import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoomEvent } from "livekit-client";
import { LiveRoomProvider, useLiveRoom } from "@/components/live/LiveRoomProvider";
import { useLiveSession } from "@/hooks/useLiveSession";
import { Button } from "@/components/ui/button";
import { ScreenShareView } from "@/components/live/ScreenShareView";
import { MeetingLayoutMode, VideoGrid } from "@/components/live/VideoGrid";
import { ParticipantControls } from "@/components/live/ParticipantControls";
import { WaitingRoomPanel } from "@/components/live/WaitingRoomPanel";
import { RaiseHandQueue } from "@/components/live/RaiseHandQueue";
import { TeacherControls } from "@/components/live/TeacherControls";
import { useActiveSpeaker } from "@/hooks/useActiveSpeaker";
import { useAuth } from "@/hooks/useAuth";
import { liveSessionSocketService } from "@/services/live-session.socket.service";
import { WEBSOCKET_EVENTS } from "@/constants/websocketEvents";
import { LiveClassPermissions, LiveParticipant, LiveSession, TokenResponse } from "@/types/live-session";
import ClassroomService from "@/services/classroomService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LiveSessionApi } from "@/services/live-session.api";
import ClassroomAnnouncementService from "@/services/classroomAnnouncementService";

interface ClassroomLivePageProps {
  classroomId?: string;
  startPermissions?: Partial<LiveClassPermissions>;
  onLeavePage?: () => void;
}

type StudentLiveState = "checking-session" | "no-session" | "session-active" | "waiting-approval" | "connecting" | "connected";

function useClassroomName(classroomId?: string) {
  const [classroomName, setClassroomName] = useState("Live Classroom");

  useEffect(() => {
    if (!classroomId) return;
    let mounted = true;
    const loadClassroomName = async () => {
      const { data } = await ClassroomService.getClassroomById(classroomId);
      if (!mounted) return;
      setClassroomName(data?.name || "Live Classroom");
    };

    loadClassroomName();
    return () => {
      mounted = false;
    };
  }, [classroomId]);

  return classroomName;
}

function LiveRoomContent({
  sessionId,
  isTeacher,
  permissions,
  classroomName,
  participantNameMap,
  layoutMode,
  onLayoutModeChange,
  onRaiseHand,
  onLowerHand,
  onEndSession,
  waitingParticipants,
  raisedHands,
  onApproveParticipant,
  onRemoveParticipant,
  onModerateParticipant,
  onLeavePage,
}: {
  sessionId: string;
  isTeacher: boolean;
  permissions: LiveClassPermissions;
  classroomName: string;
  participantNameMap?: Record<string, string>;
  layoutMode: MeetingLayoutMode;
  onLayoutModeChange: (mode: MeetingLayoutMode) => void;
  onRaiseHand: (sessionId: string) => Promise<void>;
  onLowerHand: (sessionId: string, userId?: string) => Promise<void>;
  onEndSession: (sessionId: string) => Promise<void>;
  waitingParticipants: LiveParticipant[];
  raisedHands: LiveParticipant[];
  onApproveParticipant: (sessionId: string, userId: string) => Promise<void>;
  onRemoveParticipant: (sessionId: string, userId: string) => Promise<void>;
  onModerateParticipant: (sessionId: string, userId: string, action: "mute" | "disable-camera" | "allow-microphone") => Promise<void>;
  onLeavePage?: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    participants,
    localParticipant,
    activeSpeaker,
    screenShareTrack,
    connectionState,
    disableCamera,
    disableMicrophone,
    enableMicrophone,
    disconnect,
  } = useLiveRoom();

  const activeOrPinned = useActiveSpeaker(activeSpeaker, participants, screenShareTrack);
  const allParticipants = useMemo(() => {
    if (!localParticipant) return participants;
    return [localParticipant, ...participants];
  }, [localParticipant, participants]);

  useEffect(() => {
    const onModerationCommand = async (payload: Record<string, unknown>) => {
      const targetUserId = String(payload?.userId || "");
      const action = String(payload?.action || "");
      if (targetUserId !== user?.id || isTeacher) return;

      if (action === "mute") {
        await disableMicrophone();
      } else if (action === "disable-camera") {
        await disableCamera();
      } else if (action === "allow-microphone") {
        await enableMicrophone();
      }
    };

    liveSessionSocketService.on(WEBSOCKET_EVENTS.MODERATION_COMMAND, onModerationCommand);
    return () => {
      liveSessionSocketService.off(WEBSOCKET_EVENTS.MODERATION_COMMAND, onModerationCommand);
    };
  }, [disableCamera, disableMicrophone, enableMicrophone, isTeacher, user?.id]);

  const leaveRoom = async () => {
    await disconnect();
    if (onLeavePage) {
      onLeavePage();
      return;
    }
    navigate(-1);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{classroomName}</h1>
          <p className="text-sm text-muted-foreground">Live classroom</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={layoutMode} onValueChange={(value) => onLayoutModeChange(value as MeetingLayoutMode)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tiled">Tiled</SelectItem>
              <SelectItem value="spotlight">Spotlight</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-md border border-border px-3 py-1 text-sm">
            Connection: {connectionState}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid min-h-0 flex-1 gap-3",
          screenShareTrack
            ? "grid-rows-[minmax(0,0.42fr)_minmax(0,0.58fr)]"
            : "grid-rows-1",
        )}
      >
        {screenShareTrack && (
          <ScreenShareView track={screenShareTrack} className="min-h-0 h-full" />
        )}
        <VideoGrid
          participants={allParticipants}
          activeSpeakerId={activeOrPinned?.identity}
          layoutMode={layoutMode}
          participantNameMap={participantNameMap}
        />
      </div>

      <ParticipantControls
        permissions={permissions}
        isTeacher={isTeacher}
        onLeave={leaveRoom}
      />

      {!isTeacher && (
        <div className="flex gap-2">
          <Button onClick={() => onRaiseHand(sessionId)}>Raise Hand</Button>
          <Button variant="outline" onClick={() => onLowerHand(sessionId)}>
            Lower Hand
          </Button>
        </div>
      )}

      {isTeacher && (
        <div className="grid shrink-0 gap-3 xl:grid-cols-4">
          <WaitingRoomPanel
            sessionId={sessionId}
            participants={waitingParticipants}
            onApprove={onApproveParticipant}
            onReject={onRemoveParticipant}
          />
          <RaiseHandQueue
            sessionId={sessionId}
            participants={raisedHands}
            onLowerHand={(id, userId) => onLowerHand(id, userId)}
            onAllowMicrophone={(id, userId) => onModerateParticipant(id, userId, "allow-microphone")}
          />
          <TeacherControls
            sessionId={sessionId}
            connectedParticipants={participants.map((participant) => ({
              identity: participant.identity,
              name: participant.name,
            }))}
            onModerate={onModerateParticipant}
            onRemove={onRemoveParticipant}
          />
          <Button
            variant="destructive"
            className="xl:self-start"
            onClick={async () => {
              await onEndSession(sessionId);
              await leaveRoom();
            }}
          >
            End Session
          </Button>
        </div>
      )}
    </div>
  );
}

function TeacherClassroomLivePage({
  classroomId,
  startPermissions,
  onLeavePage,
}: Required<Pick<ClassroomLivePageProps, "classroomId">> & Omit<ClassroomLivePageProps, "classroomId">) {
  const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});
  const classroomName = useClassroomName(classroomId);
  const [layoutMode, setLayoutMode] = useState<MeetingLayoutMode>("tiled");
  const {
    session,
    tokenData,
    joinStatus,
    waitingParticipants,
    raisedHands,
    isLoading,
    error,
    isTeacher,
    initialize,
    approveParticipant,
    removeParticipant,
    moderateParticipant,
    raiseHand,
    lowerHand,
    endSession,
  } = useLiveSession(classroomId, startPermissions);

  useEffect(() => {
    let mounted = true;
    const loadParticipantNames = async () => {
      const { data } = await ClassroomAnnouncementService.getAllClassroomUsers(classroomId);
      if (!mounted) return;
      const map: Record<string, string> = {};
      for (const user of data || []) {
        if (!user?.id || !user?.name) continue;
        map[user.id] = user.name;
      }
      setParticipantNameMap(map);
    };

    loadParticipantNames();
    return () => {
      mounted = false;
    };
  }, [classroomId]);

  if (isLoading) {
    return <div className="p-4">Loading live class...</div>;
  }

  if (error && !session && !tokenData) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => initialize()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!isTeacher && joinStatus === "waiting" && !tokenData) {
    return (
      <div className="space-y-3 p-4">
        <h1 className="text-xl font-semibold">Waiting Room</h1>
        <p className="text-sm text-muted-foreground">
          Your join request is pending teacher approval.
        </p>
      </div>
    );
  }

  if (!session || !tokenData) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">Preparing live classroom...</p>
        <Button variant="outline" onClick={() => initialize()}>
          Refresh
        </Button>
      </div>
    );
  }

  const effectivePermissions: LiveClassPermissions = {
    allowStudentMicrophone: tokenData.allowStudentMicrophone ?? session.allowStudentMicrophone ?? false,
    allowStudentCamera: tokenData.allowStudentCamera ?? session.allowStudentCamera ?? false,
    allowStudentScreenShare: tokenData.allowStudentScreenShare ?? session.allowStudentScreenShare ?? false,
  };

  return (
    <div className="h-[calc(100vh-1.5rem)] overflow-hidden">
      <LiveRoomProvider token={tokenData.token} livekitUrl={tokenData.livekitUrl || import.meta.env.VITE_LIVEKIT_WS_URL}>
        <LiveRoomContent
          sessionId={session.sessionId}
          isTeacher={isTeacher}
          permissions={effectivePermissions}
          classroomName={classroomName}
          participantNameMap={participantNameMap}
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
          onRaiseHand={raiseHand}
          onLowerHand={lowerHand}
          onEndSession={endSession}
          waitingParticipants={waitingParticipants}
          raisedHands={raisedHands}
          onApproveParticipant={approveParticipant}
          onRemoveParticipant={removeParticipant}
          onModerateParticipant={moderateParticipant}
          onLeavePage={onLeavePage}
        />
      </LiveRoomProvider>
    </div>
  );
}

function StudentRoomRuntime({
  session,
  classroomName,
  permissions,
  participantNameMap,
  onConnected,
  onPermissionsChange,
  onLeavePage,
}: {
  session: LiveSession;
  classroomName: string;
  permissions: LiveClassPermissions;
  participantNameMap?: Record<string, string>;
  onConnected: () => void;
  onPermissionsChange: (permissions: LiveClassPermissions) => void;
  onLeavePage?: () => void;
}) {
  const { room, connectionState } = useLiveRoom();
  const [layoutMode, setLayoutMode] = useState<MeetingLayoutMode>("tiled");
  const isSetupDone = useRef(false);

  useEffect(() => {
    if (connectionState !== "connected" || isSetupDone.current) return;
    isSetupDone.current = true;
    onConnected();
  }, [connectionState, onConnected]);

  useEffect(() => {
    if (!room) return;
    const syncPermissions = () => {
      const raw = room.localParticipant.permissions as
        | { canPublish?: boolean; canPublishData?: boolean; canPublishSources?: Array<string | number> }
        | undefined;

      if (Array.isArray(raw?.canPublishSources)) {
        const hasSource = (name: "camera" | "microphone" | "screen_share") => {
          return raw.canPublishSources!.some((source) => {
            if (typeof source === "number") {
              if (name === "camera") return source === 1;
              if (name === "microphone") return source === 2;
              return source === 3 || source === 4;
            }
            const normalized = source.toLowerCase();
            if (name === "screen_share") {
              return normalized === "screen_share" || normalized === "screenshare" || normalized === "screen_share_audio";
            }
            return normalized === name;
          });
        };
        onPermissionsChange({
          allowStudentMicrophone: hasSource("microphone"),
          allowStudentCamera: hasSource("camera"),
          allowStudentScreenShare: hasSource("screen_share"),
        });
        return;
      }

      const canPublish = raw?.canPublish === true;
      const canPublishData = raw?.canPublishData === true;
      onPermissionsChange({
        allowStudentMicrophone: canPublish,
        allowStudentCamera: canPublish,
        allowStudentScreenShare: canPublishData || canPublish,
      });
    };

    syncPermissions();
    room.on(RoomEvent.ParticipantPermissionsChanged, syncPermissions);
    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, syncPermissions);
    };
  }, [onPermissionsChange, room]);

  if (connectionState !== "connected") {
    return (
      <div className="space-y-3 p-4">
        <h1 className="text-xl font-semibold">Connecting to live class...</h1>
        <p className="text-sm text-muted-foreground">
          Please wait while we connect your session.
        </p>
      </div>
    );
  }

  return (
    <LiveRoomContent
      sessionId={session.sessionId}
      isTeacher={false}
      permissions={permissions}
      classroomName={classroomName}
      participantNameMap={participantNameMap}
      layoutMode={layoutMode}
      onLayoutModeChange={setLayoutMode}
      onRaiseHand={LiveSessionApi.raiseHand.bind(LiveSessionApi)}
      onLowerHand={LiveSessionApi.lowerHand.bind(LiveSessionApi)}
      onEndSession={async () => {}}
      waitingParticipants={[]}
      raisedHands={[]}
      onApproveParticipant={async () => {}}
      onRemoveParticipant={async () => {}}
      onModerateParticipant={async () => {}}
      onLeavePage={onLeavePage}
    />
  );
}

function StudentClassroomLivePage({
  classroomId,
  onLeavePage,
}: Required<Pick<ClassroomLivePageProps, "classroomId">> & Omit<ClassroomLivePageProps, "classroomId" | "startPermissions">) {
  const { user } = useAuth();
  const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});
  const classroomName = useClassroomName(classroomId);
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

  useEffect(() => {
    let mounted = true;
    const loadParticipantNames = async () => {
      const { data } = await ClassroomAnnouncementService.getAllClassroomUsers(classroomId);
      if (!mounted) return;
      const map: Record<string, string> = {};
      for (const classroomUser of data || []) {
        if (!classroomUser?.id || !classroomUser?.name) continue;
        map[classroomUser.id] = classroomUser.name;
      }
      setParticipantNameMap(map);
    };

    loadParticipantNames();
    return () => {
      mounted = false;
    };
  }, [classroomId]);

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
      setError(err?.response?.data?.message || err?.message || "Failed to check active live class.");
      setSession(null);
      setTokenData(null);
      setLiveState("no-session");
    }
  }, [classroomId]);

  const fetchTokenAndConnect = useCallback(async (sessionId: string, fallbackState: StudentLiveState = "waiting-approval") => {
    setError(null);
    setLiveState("connecting");
    try {
      const token = await LiveSessionApi.getToken(sessionId);
      setTokenData(token);
      // Approved students can manage own mic/camera/screenshare.
      setPermissions({
        allowStudentMicrophone: true,
        allowStudentCamera: true,
        allowStudentScreenShare: true,
      });
    } catch (err: any) {
      setTokenData(null);
      setLiveState(fallbackState);
      setError(err?.response?.data?.message || err?.message || "Failed to connect to live class.");
    }
  }, []);

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
    loadActiveSession();
  }, [loadActiveSession]);

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
        <Button variant="outline" onClick={loadActiveSession}>
          Refresh
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">Unable to locate active live session.</p>
        <Button variant="outline" onClick={loadActiveSession}>
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
        <Button onClick={handleRequestJoin} disabled={isLoading}>
          {isLoading ? "Requesting..." : "Request to Join Live Class"}
        </Button>
      </div>
    );
  }

  if (liveState === "waiting-approval" && !tokenData) {
    return (
      <div className="space-y-3 p-4">
        <h1 className="text-xl font-semibold">Waiting for teacher approval...</h1>
        <p className="text-sm text-muted-foreground">
          Your join request has been sent.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-1.5rem)] overflow-hidden">
      <LiveRoomProvider token={tokenData.token} livekitUrl={tokenData.livekitUrl || import.meta.env.VITE_LIVEKIT_WS_URL}>
        <StudentRoomRuntime
          session={session}
          classroomName={classroomName}
          permissions={permissions}
          participantNameMap={participantNameMap}
          onConnected={() => setLiveState("connected")}
          onPermissionsChange={setPermissions}
          onLeavePage={onLeavePage}
        />
      </LiveRoomProvider>
    </div>
  );
}

export default function ClassroomLivePage({
  classroomId: classroomIdProp,
  startPermissions,
  onLeavePage,
}: ClassroomLivePageProps) {
  const { classroomId: classroomIdParam } = useParams<{ classroomId: string }>();
  const classroomId = classroomIdProp || classroomIdParam;
  const { user } = useAuth();
  const isTeacher = user?.role?.toLowerCase?.() === "teacher";

  if (!classroomId) {
    return <div className="p-4">Select a classroom to start live class.</div>;
  }

  if (isTeacher) {
    return (
      <TeacherClassroomLivePage
        classroomId={classroomId}
        startPermissions={startPermissions}
        onLeavePage={onLeavePage}
      />
    );
  }

  return (
    <StudentClassroomLivePage
      classroomId={classroomId}
      onLeavePage={onLeavePage}
    />
  );
}
