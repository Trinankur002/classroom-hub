import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { LiveClassPermissions, LiveParticipant } from "@/types/live-session";
import ClassroomService from "@/services/classroomService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ClassroomLivePageProps {
  classroomId?: string;
  startPermissions?: Partial<LiveClassPermissions>;
  onLeavePage?: () => void;
}

function LiveRoomContent({
  sessionId,
  isTeacher,
  permissions,
  classroomName,
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

export default function ClassroomLivePage({
  classroomId: classroomIdProp,
  startPermissions,
  onLeavePage,
}: ClassroomLivePageProps) {
  const { classroomId: classroomIdParam } = useParams<{ classroomId: string }>();
  const classroomId = classroomIdProp || classroomIdParam;
  const [classroomName, setClassroomName] = useState("Live Classroom");
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

  if (!classroomId) {
    return <div className="p-4">Select a classroom to start live class.</div>;
  }

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
