import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RoomEvent, Track } from "livekit-client";
import { Maximize2, Minimize2, PanelRight } from "lucide-react";
import { useLiveRoom } from "@/components/live/LiveRoomProvider";
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
import { LiveClassPermissions, LiveParticipant } from "@/types/live-session";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLiveSessionContext } from "@/components/live/LiveSessionContext";
import { findScreenShareParticipant } from "./classroomLiveShared";

type SidebarView = "participants" | "chat" | "hands";

interface LiveRoomContentProps {
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
  onModerateParticipant: (
    sessionId: string,
    userId: string,
    action: "mute" | "disable-camera" | "allow-microphone",
  ) => Promise<void>;
  onLeavePage?: () => void;
}

export function LiveRoomContent({
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
}: LiveRoomContentProps) {
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
    if (!teacherIdentity) {
      return allParticipants.find((participant) => participant.isLocal) ?? allParticipants[0] ?? null;
    }
    return allParticipants.find((participant) => participant.identity === teacherIdentity) ?? allParticipants[0] ?? null;
  }, [allParticipants, teacherIdentity]);

  const raisedHandIds = useMemo(() => {
    const ids = new Set(raisedHands.map((participant) => participant.userId));
    if (isHandRaised && user?.id) {
      ids.add(user.id);
    }
    return ids;
  }, [isHandRaised, raisedHands, user?.id]);

  const screenShareParticipant = useMemo(
    () => findScreenShareParticipant(allParticipants),
    [allParticipants],
  );
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
  }, [
    allParticipants,
    effectiveActiveSpeakerId,
    pinnedParticipantId,
    screenShareParticipant,
    teacherParticipant,
  ]);

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
    const stillPresent = allParticipants.some(
      (participant) => participant.identity === pinnedParticipantId,
    );
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

  const handleRaiseHand = async () => {
    await onRaiseHand(sessionId);
    setIsHandRaised(true);
  };

  const handleLowerHand = async () => {
    await onLowerHand(sessionId, user?.id);
    setIsHandRaised(false);
  };

  const handleEndSessionAndLeave = isTeacher
    ? async () => {
        await onEndSession(sessionId);
        await leaveRoom();
      }
    : undefined;

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
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        isFocusMode ? "h-full gap-3" : isCompactPinnedMode ? "gap-2" : "gap-4",
      )}
    >
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
                handRaised={raisedHandIds.has(screenShareParticipant.identity)}
                isPinned={screenShareParticipant.identity === pinnedParticipantId}
                onClick={() =>
                  setPinnedParticipantId(
                    pinnedParticipantId === screenShareParticipant.identity
                      ? null
                      : screenShareParticipant.identity,
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

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/30"
    >
      {!isFocusMode && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b border-border/60",
            isCompactPinnedMode ? "px-3 py-1.5" : "px-4 py-2",
          )}
        >
          <div className="min-w-0 flex items-center gap-3 overflow-hidden">
            <h1 className={cn("shrink-0 truncate font-semibold", isCompactPinnedMode ? "text-base" : "text-lg")}>
              {classroomName}
            </h1>
            <div
              className={cn(
                "flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-muted-foreground",
                isCompactPinnedMode ? "text-[11px]" : "text-xs",
              )}
            >
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
            onEndSession={handleEndSessionAndLeave}
          />
        </>
      ) : (
        <>
          <div
            className={cn(
              isCompactPinnedMode
                ? "grid min-h-0 flex-1 gap-2 overflow-hidden p-2 pb-20"
                : "grid min-h-0 flex-1 gap-4 overflow-hidden p-4 pb-24",
              sidebarOpen && !isMobile ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : "grid-cols-1",
            )}
          >
            {stageContent}

            {sidebarOpen && !isMobile && (
              <aside
                className={cn(
                  "min-h-0 overflow-hidden border border-border/70 bg-background/70 shadow-sm",
                  isCompactPinnedMode ? "rounded-[24px] p-2" : "rounded-[28px] p-3",
                )}
              >
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
            onEndSession={handleEndSessionAndLeave}
          />
        </>
      )}
    </div>
  );
}
