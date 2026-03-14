import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Participant, RoomEvent, Track } from "livekit-client";
import { Maximize2, Minimize2, PanelRight } from "lucide-react";
import { LiveRoomProvider, useLiveRoom } from "@/components/live/LiveRoomProvider";
import { useLiveSession } from "@/hooks/useLiveSession";
import { Button } from "@/components/ui/button";
import { ScreenShareView } from "@/components/live/ScreenShareView";
import { MeetingLayoutMode, VideoGrid } from "@/components/live/VideoGrid";
import { VideoTile } from "@/components/live/VideoTile";
import { ParticipantControls } from "@/components/live/ParticipantControls";
import { ParticipantSidebar } from "@/components/live/ParticipantSidebar";
import { FullscreenControls } from "@/components/live/FullscreenControls";
import { LiveFullscreenMode } from "@/components/live/LiveFullscreenMode";
import { useAuth } from "@/hooks/useAuth";
import { liveSessionSocketService } from "@/services/live-session.socket.service";
import { WEBSOCKET_EVENTS } from "@/constants/websocketEvents";
import { LiveClassPermissions, LiveParticipant, LiveSession, TokenResponse } from "@/types/live-session";
import ClassroomService from "@/services/classroomService";
import { cn } from "@/lib/utils";
import { LiveSessionApi } from "@/services/live-session.api";
import ClassroomAnnouncementService from "@/services/classroomAnnouncementService";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveSessionContext } from "@/components/live/LiveSessionContext";

interface ClassroomLivePageProps {
  classroomId?: string;
  startPermissions?: Partial<LiveClassPermissions>;
  preJoinState?: {
    sessionId?: string;
    status?: string;
  };
  onLeavePage?: () => void;
}

type StudentLiveState = "checking-session" | "no-session" | "session-active" | "waiting-approval" | "connecting" | "connected";
type SidebarView = "participants" | "chat" | "hands";

interface PreJoinState {
  preJoin?: {
    sessionId?: string;
    status?: string;
  };
}

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

function findScreenShareParticipant(participants: Participant[]) {
  return participants.find((participant) =>
    Array.from(participant.trackPublications.values()).some(
      (publication) => publication.source === Track.Source.ScreenShare && publication.track && !publication.isMuted,
    ),
  ) ?? null;
}

function LiveRoomContent({
  classroomId,
  sessionId,
  isTeacher,
  permissions,
  classroomName,
  participantNameMap,
  participantRoleMap,
  teacherIdentity,
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
  classroomId?: string;
  sessionId: string;
  isTeacher: boolean;
  permissions: LiveClassPermissions;
  classroomName: string;
  participantNameMap?: Record<string, string>;
  participantRoleMap?: Record<string, string>;
  teacherIdentity?: string;
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
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { beginLiveSession, endLiveSession } = useLiveSessionContext();
  const {
    room,
    participants,
    localParticipant,
    activeSpeaker,
    screenShareTrack,
    connectionState,
    disableCamera,
    disableMicrophone,
    enableMicrophone,
    enableCamera,
  } = useLiveRoom();

  const [sidebarView, setSidebarView] = useState<SidebarView>("participants");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [eventSpeakerId, setEventSpeakerId] = useState<string | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusParticipantsOpen, setFocusParticipantsOpen] = useState(true);
  const stageSignalsBound = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const allParticipants = useMemo(() => {
    if (!localParticipant) return participants;
    return [localParticipant, ...participants];
  }, [localParticipant, participants]);

  const teacherParticipant = useMemo(() => {
    if (!teacherIdentity) return allParticipants.find((participant) => participant.isLocal) ?? allParticipants[0] ?? null;
    return allParticipants.find((participant) => participant.identity === teacherIdentity) ?? allParticipants[0] ?? null;
  }, [allParticipants, teacherIdentity]);

  const raisedHandIds = useMemo(() => {
    const ids = new Set(raisedHands.map((participant) => participant.userId));
    if (isHandRaised && user?.id) {
      ids.add(user.id);
    }
    return ids;
  }, [isHandRaised, raisedHands, user?.id]);

  const screenShareParticipant = useMemo(() => findScreenShareParticipant(allParticipants), [allParticipants]);
  const effectiveActiveSpeakerId = activeSpeaker?.identity || eventSpeakerId || undefined;
  const isScreenSharing = !!screenShareTrack;

  const stageParticipant = useMemo(() => {
    if (screenShareParticipant) return screenShareParticipant;
    if (pinnedParticipantId) {
      const pinned = allParticipants.find((participant) => participant.identity === pinnedParticipantId);
      if (pinned) return pinned;
    }
    if (effectiveActiveSpeakerId) {
      const speaker = allParticipants.find((participant) => participant.identity === effectiveActiveSpeakerId);
      if (speaker) return speaker;
    }
    return teacherParticipant;
  }, [allParticipants, effectiveActiveSpeakerId, pinnedParticipantId, screenShareParticipant, teacherParticipant]);

  const layoutMode: MeetingLayoutMode = useMemo(() => {
    if (isScreenSharing) return "screen-share";
    if (allParticipants.length <= 4 && !effectiveActiveSpeakerId && !pinnedParticipantId) {
      return "grid";
    }
    return "stage";
  }, [allParticipants.length, effectiveActiveSpeakerId, isScreenSharing, pinnedParticipantId]);
  const isCompactPinnedMode = !!pinnedParticipantId && layoutMode !== "grid";

  useEffect(() => {
    setSidebarOpen(!isMobile);
    setFocusParticipantsOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (!classroomId) return;
    beginLiveSession({
      sessionId,
      classroomId,
      classroomName,
      liveRoutePath: location.pathname,
    });
  }, [beginLiveSession, classroomId, classroomName, location.pathname, sessionId]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFocusMode(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!room || stageSignalsBound.current) return;

    const syncStageSignals = () => {
      setEventSpeakerId(room.activeSpeakers[0]?.identity || null);
    };

    syncStageSignals();
    room.on(RoomEvent.ActiveSpeakersChanged, syncStageSignals);
    room.on(RoomEvent.TrackSubscribed, syncStageSignals);
    room.on(RoomEvent.TrackUnsubscribed, syncStageSignals);
    stageSignalsBound.current = true;

    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, syncStageSignals);
      room.off(RoomEvent.TrackSubscribed, syncStageSignals);
      room.off(RoomEvent.TrackUnsubscribed, syncStageSignals);
      stageSignalsBound.current = false;
    };
  }, [room]);

  useEffect(() => {
    if (!pinnedParticipantId) return;
    const stillPresent = allParticipants.some((participant) => participant.identity === pinnedParticipantId);
    if (!stillPresent) {
      setPinnedParticipantId(null);
    }
  }, [allParticipants, pinnedParticipantId]);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tagName = (event.target as HTMLElement | null)?.tagName || "";
      if (tagName === "INPUT" || tagName === "TEXTAREA") return;
      const key = event.key.toLowerCase();
      if (key === "f") {
        event.preventDefault();
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else {
          void rootRef.current?.requestFullscreen?.();
        }
        return;
      }
      if (key === "m") {
        event.preventDefault();
        const micPublication = localParticipant
          ? Array.from(localParticipant.trackPublications.values()).find(
            (publication) => publication.source === Track.Source.Microphone,
          )
          : null;
        if (!localParticipant || (!isTeacher && !permissions.allowStudentMicrophone)) return;
        if (micPublication && !micPublication.isMuted) {
          void disableMicrophone();
        } else {
          void enableMicrophone();
        }
        return;
      }
      if (key === "v") {
        event.preventDefault();
        const cameraPublication = localParticipant
          ? Array.from(localParticipant.trackPublications.values()).find(
            (publication) => publication.source === Track.Source.Camera,
          )
          : null;
        if (!localParticipant || (!isTeacher && !permissions.allowStudentCamera)) return;
        if (cameraPublication && !cameraPublication.isMuted) {
          void disableCamera();
        } else {
          void enableCamera();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    disableCamera,
    disableMicrophone,
    enableCamera,
    enableMicrophone,
    isTeacher,
    localParticipant,
    permissions.allowStudentCamera,
    permissions.allowStudentMicrophone,
  ]);

  const toggleFocusMode = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFocusMode(false);
      return;
    }
    await rootRef.current?.requestFullscreen?.();
    setIsFocusMode(true);
  };

  const leaveRoom = async () => {
    await endLiveSession();
    if (onLeavePage) {
      onLeavePage();
      return;
    }
    navigate(-1);
  };

  const sidebarContent = (
    <ParticipantSidebar
      view={sidebarView}
      onViewChange={setSidebarView}
      connectedParticipants={allParticipants}
      participantNameMap={participantNameMap}
      participantRoleMap={participantRoleMap}
      raisedHands={raisedHands}
      waitingParticipants={waitingParticipants}
      sessionId={sessionId}
      isTeacher={isTeacher}
      teacherIdentity={teacherIdentity}
      onApproveParticipant={onApproveParticipant}
      onRemoveParticipant={onRemoveParticipant}
      onModerateParticipant={onModerateParticipant}
      onLowerHand={onLowerHand}
    />
  );

  const stageContent = (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", isFocusMode ? "h-full gap-3" : isCompactPinnedMode ? "gap-2" : "gap-4")}>
      {layoutMode === "screen-share" && screenShareTrack ? (
        <div className="relative min-h-0 h-full flex-1">
          <ScreenShareView
            track={screenShareTrack}
            className={cn("h-full min-h-0", isCompactPinnedMode ? "rounded-[24px]" : "rounded-[28px]")}
          />

          {screenShareParticipant && (
            <div
              className={cn(
                "absolute bottom-4 right-4 z-20 overflow-hidden rounded-2xl border border-border/70 bg-background/80 shadow-xl",
                isFocusMode ? "h-36 w-60" : "h-32 w-56",
              )}
            >
              <VideoTile
                participant={screenShareParticipant}
                label={participantNameMap?.[screenShareParticipant.identity]}
                isVisible
                tileWidth={isFocusMode ? 240 : 224}
                className="h-full w-full rounded-none border-0"
                size="filmstrip"
                isActiveSpeaker={effectiveActiveSpeakerId === screenShareParticipant.identity}
                handRaised={raisedHandIds?.has(screenShareParticipant.identity)}
                isPinned={screenShareParticipant.identity === pinnedParticipantId}
                onClick={() =>
                  setPinnedParticipantId(
                    pinnedParticipantId === screenShareParticipant.identity ? null : screenShareParticipant.identity,
                  )
                }
              />
            </div>
          )}
        </div>
      ) : (
        <VideoGrid
          participants={allParticipants}
          stageParticipant={stageParticipant}
          activeSpeakerId={effectiveActiveSpeakerId}
          layoutMode={layoutMode}
          participantNameMap={participantNameMap}
          raisedHandIds={raisedHandIds}
          isScreenSharing={layoutMode === "screen-share"}
          compactMode={isCompactPinnedMode}
          hideFilmstrip={isFocusMode}
          pinnedParticipantId={pinnedParticipantId}
          onPinParticipant={setPinnedParticipantId}
        />
      )}
    </div>
  );

  const handleRaiseHand = async () => {
    await onRaiseHand(sessionId);
    setIsHandRaised(true);
  };

  const handleLowerHand = async () => {
    await onLowerHand(sessionId, user?.id);
    setIsHandRaised(false);
  };

  return (
    <div ref={rootRef} className="relative flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {!isFocusMode && (
        <div className={cn("flex items-center justify-between gap-3 border-b border-border/60", isCompactPinnedMode ? "px-3 py-1.5" : "px-4 py-2")}>
          <div className="min-w-0 flex items-center gap-3 overflow-hidden">
            <h1 className={cn("shrink-0 truncate font-semibold", isCompactPinnedMode ? "text-base" : "text-lg")}>{classroomName}</h1>
            <div className={cn("flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-muted-foreground", isCompactPinnedMode ? "text-[11px]" : "text-xs")}>
              <Badge variant="secondary" className={cn("shrink-0", isCompactPinnedMode && "px-2 py-0 text-[11px]")}>
                {layoutMode === "grid" ? "Grid" : layoutMode === "stage" ? "Stage" : "Screen share"}
              </Badge>
              <span className="shrink-0">{allParticipants.length} in room</span>
              <span className="truncate">Connection {connectionState}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("rounded-full", isCompactPinnedMode && "h-8 px-3 text-xs")}
              onClick={() => void toggleFocusMode()}
            >
              <Maximize2 className="mr-2 h-4 w-4" />
              Fullscreen / Focus
            </Button>

            {isMobile ? (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="rounded-full">
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[92vw] max-w-sm p-4">
                  <SheetHeader className="mb-4">
                    <SheetTitle>Meeting sidebar</SheetTitle>
                  </SheetHeader>
                  <div className="h-full min-h-0">{sidebarContent}</div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("rounded-full", isCompactPinnedMode && "h-8 px-3 text-xs")}
                onClick={() => setSidebarOpen((current) => !current)}
              >
                <PanelRight className="mr-2 h-4 w-4" />
                {sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              </Button>
            )}
          </div>
        </div>
      )}

      {isFocusMode ? (
        <>
          <LiveFullscreenMode
            participantsOpen={focusParticipantsOpen}
            onToggleParticipants={() => setFocusParticipantsOpen((current) => !current)}
            stage={stageContent}
            sidebar={sidebarContent}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void toggleFocusMode()}
            className="absolute left-4 top-4 z-[61] rounded-full bg-card/90"
          >
            <Minimize2 className="mr-1.5 h-4 w-4" />
            Exit focus
          </Button>
          <FullscreenControls
            permissions={permissions}
            isTeacher={isTeacher}
            isHandRaised={isHandRaised}
            onRaiseHand={handleRaiseHand}
            onLowerHand={handleLowerHand}
            onLeave={leaveRoom}
            onEndSession={isTeacher ? async () => {
              await onEndSession(sessionId);
              await leaveRoom();
            } : undefined}
          />
        </>
      ) : (
        <>
          <div className={cn(isCompactPinnedMode ? "grid min-h-0 flex-1 gap-2 overflow-hidden p-2 pb-20" : "grid min-h-0 flex-1 gap-4 overflow-hidden p-4 pb-24", sidebarOpen && !isMobile ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : "grid-cols-1")}>
            {stageContent}

            {sidebarOpen && !isMobile && (
              <aside className={cn("min-h-0 overflow-hidden border border-border/70 bg-background/70 shadow-sm", isCompactPinnedMode ? "rounded-[24px] p-2" : "rounded-[28px] p-3")}>
                {sidebarContent}
              </aside>
            )}
          </div>

          <ParticipantControls
            permissions={permissions}
            isTeacher={isTeacher}
            isHandRaised={isHandRaised}
            compactMode={isCompactPinnedMode}
            onRaiseHand={handleRaiseHand}
            onLowerHand={handleLowerHand}
            onLeave={leaveRoom}
            onEndSession={isTeacher ? async () => {
              await onEndSession(sessionId);
              await leaveRoom();
            } : undefined}
          />
        </>
      )}
    </div>
  );
}

function TeacherClassroomLivePage({
  classroomId,
  startPermissions,
  onLeavePage,
}: Required<Pick<ClassroomLivePageProps, "classroomId">> & Omit<ClassroomLivePageProps, "classroomId">) {
  const { user } = useAuth();
  const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});
  const [participantRoleMap, setParticipantRoleMap] = useState<Record<string, string>>({});
  const classroomName = useClassroomName(classroomId);
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
      const roleMap: Record<string, string> = {};
      for (const classroomUser of data || []) {
        if (!classroomUser?.id || !classroomUser?.name) continue;
        map[classroomUser.id] = classroomUser.name;
        if (classroomUser.role) {
          roleMap[classroomUser.id] = classroomUser.role;
        }
      }
      setParticipantNameMap(map);
      setParticipantRoleMap(roleMap);
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
    <div className="h-[calc(100vh-1.5rem)] overflow-hidden rounded-[32px] border border-border/60 bg-card/50">
      <LiveRoomProvider
        token={tokenData.token}
        livekitUrl={tokenData.livekitUrl || import.meta.env.VITE_LIVEKIT_WS_URL}
        preserveConnectionOnUnmount
      >
        <LiveRoomContent
          classroomId={classroomId}
          sessionId={session.sessionId}
          isTeacher={isTeacher}
          permissions={effectivePermissions}
          classroomName={classroomName}
          participantNameMap={participantNameMap}
          participantRoleMap={participantRoleMap}
          teacherIdentity={user?.id}
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
  classroomId,
  classroomName,
  permissions,
  participantNameMap,
  participantRoleMap,
  teacherIdentity,
  onConnected,
  onPermissionsChange,
  onLeavePage,
}: {
  session: LiveSession;
  classroomId: string;
  classroomName: string;
  permissions: LiveClassPermissions;
  participantNameMap?: Record<string, string>;
  participantRoleMap?: Record<string, string>;
  teacherIdentity?: string;
  onConnected: () => void;
  onPermissionsChange: (permissions: LiveClassPermissions) => void;
  onLeavePage?: () => void;
}) {
  const { room, connectionState } = useLiveRoom();
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
      classroomId={classroomId}
      sessionId={session.sessionId}
      isTeacher={false}
      permissions={permissions}
      classroomName={classroomName}
      participantNameMap={participantNameMap}
      participantRoleMap={participantRoleMap}
      teacherIdentity={teacherIdentity}
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

function WaitingApprovalSkeleton({
  classroomName,
  error,
}: {
  classroomName: string;
  error?: string | null;
}) {
  return (
    <div className="h-[calc(100vh-1.5rem)] overflow-hidden rounded-[32px] border border-border/60 bg-card/50">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="min-w-0 flex items-center gap-3 overflow-hidden">
            <h1 className="truncate text-lg font-semibold">{classroomName}</h1>
            <Badge variant="secondary" className="px-3 py-1 text-xs">
              Waiting approval
            </Badge>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 p-4 pb-24 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid min-h-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-[220px] rounded-2xl" />
            <Skeleton className="h-[220px] rounded-2xl" />
            <Skeleton className="h-[220px] rounded-2xl sm:col-span-2" />
          </div>
          <aside className="hidden min-h-0 overflow-hidden rounded-[28px] border border-border/70 bg-background/70 p-3 lg:block">
            <Skeleton className="mb-3 h-8 w-2/3 rounded-lg" />
            <Skeleton className="mb-2 h-6 w-full rounded-lg" />
            <Skeleton className="mb-2 h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-5/6 rounded-lg" />
          </aside>
        </div>

        <div className="border-t border-border/60 px-4 py-4">
          <p className="text-sm text-muted-foreground">Join request sent. Waiting for teacher approval...</p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function StudentClassroomLivePage({
  classroomId,
  preJoinState,
  onLeavePage,
}: Required<Pick<ClassroomLivePageProps, "classroomId">> & Omit<ClassroomLivePageProps, "classroomId" | "startPermissions">) {
  const { user } = useAuth();
  const location = useLocation();
  const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});
  const [participantRoleMap, setParticipantRoleMap] = useState<Record<string, string>>({});
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
  const preJoin = preJoinState || (location.state as PreJoinState | null)?.preJoin;
  const preJoinAppliedRef = useRef(false);
  const teacherIdentity = useMemo(() => {
    return Object.entries(participantRoleMap).find(([, role]) => role === "Teacher")?.[0];
  }, [participantRoleMap]);

  useEffect(() => {
    let mounted = true;
    const loadParticipantNames = async () => {
      const { data } = await ClassroomAnnouncementService.getAllClassroomUsers(classroomId);
      if (!mounted) return;
      const map: Record<string, string> = {};
      const roleMap: Record<string, string> = {};
      for (const classroomUser of data || []) {
        if (!classroomUser?.id || !classroomUser?.name) continue;
        map[classroomUser.id] = classroomUser.name;
        if (classroomUser.role) {
          roleMap[classroomUser.id] = classroomUser.role;
        }
      }
      setParticipantNameMap(map);
      setParticipantRoleMap(roleMap);
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

export default function ClassroomLivePage({
  classroomId: classroomIdProp,
  startPermissions,
  preJoinState,
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
      preJoinState={preJoinState}
      onLeavePage={onLeavePage}
    />
  );
}
