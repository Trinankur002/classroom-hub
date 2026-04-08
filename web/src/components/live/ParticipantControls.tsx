import { ReactNode, useEffect, useState } from "react";
import { Track } from "livekit-client";
import { Hand, Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LiveClassPermissions } from "@/types/live-session";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLiveRoom } from "./LiveRoomProvider";

interface ParticipantControlsProps {
  isTeacher: boolean;
  permissions: LiveClassPermissions;
  isHandRaised?: boolean;
  compactMode?: boolean;
  onRaiseHand?: () => Promise<void>;
  onLowerHand?: () => Promise<void>;
  onLeave: () => void;
  onEndSession?: () => Promise<void>;
}

interface ControlButtonProps {
  active?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onClick: () => Promise<void> | void;
  icon: ReactNode;
  label: string;
  compactMode?: boolean;
}

function ControlButton({ active, destructive, disabled, onClick, icon, label, compactMode = false }: ControlButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        compactMode ? "h-10 w-10" : "h-12 w-12",
        "rounded-full border-border/80 bg-background/80 text-foreground shadow-sm transition hover:bg-accent",
        active && "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90",
        destructive && "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
      )}
      title={label}
      aria-label={label}
    >
      {icon}
    </Button>
  );
}

export function ParticipantControls({
  isTeacher,
  permissions,
  isHandRaised = false,
  compactMode = false,
  onRaiseHand,
  onLowerHand,
  onLeave,
  onEndSession,
}: ParticipantControlsProps) {
  const isMobile = useIsMobile();
  const {
    localParticipant,
    enableCamera,
    disableCamera,
    enableMicrophone,
    disableMicrophone,
    startScreenShare,
    stopScreenShare,
  } = useLiveRoom();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const publications = localParticipant
    ? Array.from(localParticipant.trackPublications.values())
    : [];

  const micPublication =
    publications.find((publication) => publication.source === Track.Source.Microphone) || null;
  const cameraPublication =
    publications.find((publication) => publication.source === Track.Source.Camera) || null;
  const screenSharePublication =
    publications.find((publication) => publication.source === Track.Source.ScreenShare) || null;

  const isMicEnabled = !!micPublication && !micPublication.isMuted;
  const isCameraEnabled = !!cameraPublication && !cameraPublication.isMuted;
  const isScreenSharing = !!screenSharePublication && !screenSharePublication.isMuted;
  const [uiMicEnabled, setUiMicEnabled] = useState(isMicEnabled);
  const [uiCameraEnabled, setUiCameraEnabled] = useState(isCameraEnabled);
  const [uiScreenSharing, setUiScreenSharing] = useState(isScreenSharing);

  useEffect(() => {
    setUiMicEnabled(isMicEnabled);
  }, [isMicEnabled]);

  useEffect(() => {
    setUiCameraEnabled(isCameraEnabled);
  }, [isCameraEnabled]);

  useEffect(() => {
    setUiScreenSharing(isScreenSharing);
  }, [isScreenSharing]);

  const withControlError = (error: unknown, control: string) => {
    const message =
      (error as { message?: string })?.message ||
      `Unable to access ${control}. Check browser permission and device availability.`;
    toast({
      title: `${control} failed`,
      description: message,
      variant: "destructive",
    });
  };

  const runControl = async (control: string, action: () => Promise<void>) => {
    setIsSubmitting(true);
    try {
      await action();
    } catch (error) {
      withControlError(error, control);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-auto fixed inset-x-0 z-30 flex justify-center px-2 sm:px-4",
        isMobile ? "bottom-20" : compactMode ? "bottom-3" : "bottom-4",
      )}
      style={isMobile ? { paddingBottom: "env(safe-area-inset-bottom)" } : undefined}
    >
      <div
        className={cn(
          "flex items-center rounded-full border border-border/70 bg-card/95 shadow-lg backdrop-blur",
          isMobile ? "max-w-[calc(100vw-1rem)] gap-1 overflow-x-auto px-2 py-1.5" : compactMode ? "gap-2 px-2.5 py-1.5" : "gap-2 px-3 py-2",
        )}
      >
        <ControlButton
          active={uiMicEnabled}
          disabled={!localParticipant || isSubmitting || (!isTeacher && !permissions.allowStudentMicrophone)}
          onClick={() => {
            const next = !uiMicEnabled;
            setUiMicEnabled(next);
            return runControl("Microphone", () => (next ? enableMicrophone() : disableMicrophone()));
          }}
          icon={uiMicEnabled ? <Mic className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} /> : <MicOff className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />}
          label={uiMicEnabled ? "Turn microphone off" : "Turn microphone on"}
          compactMode={compactMode || isMobile}
        />

        <ControlButton
          active={uiCameraEnabled}
          disabled={!localParticipant || isSubmitting || (!isTeacher && !permissions.allowStudentCamera)}
          onClick={() => {
            const next = !uiCameraEnabled;
            setUiCameraEnabled(next);
            return runControl("Camera", () => (next ? enableCamera() : disableCamera()));
          }}
          icon={uiCameraEnabled ? <Video className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} /> : <VideoOff className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />}
          label={uiCameraEnabled ? "Turn camera off" : "Turn camera on"}
          compactMode={compactMode || isMobile}
        />

        {!isTeacher && (
          <ControlButton
            active={isHandRaised}
            disabled={isSubmitting}
            onClick={() => runControl("Raise hand", async () => {
              if (isHandRaised) {
                await onLowerHand?.();
              } else {
                await onRaiseHand?.();
              }
            })}
            icon={<Hand className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />}
            label={isHandRaised ? "Lower hand" : "Raise hand"}
            compactMode={compactMode || isMobile}
          />
        )}

        <ControlButton
          active={uiScreenSharing}
          disabled={!localParticipant || isSubmitting || (!isTeacher && !permissions.allowStudentScreenShare)}
          onClick={() => {
            const next = !uiScreenSharing;
            setUiScreenSharing(next);
            return runControl("Screen sharing", () => (next ? startScreenShare() : stopScreenShare()));
          }}
          icon={<MonitorUp className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />}
          label={uiScreenSharing ? "Stop sharing screen" : "Share screen"}
          compactMode={compactMode || isMobile}
        />

        {isTeacher && onEndSession && (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => runControl("End session", onEndSession)}
            className={cn("shrink-0 rounded-full border-border/80 bg-background/80 shadow-sm", isMobile ? "px-3 py-2 text-xs" : compactMode ? "px-3 py-2 text-xs" : "px-4 text-sm")}
          >
            {isMobile ? "End" : "End session"}
          </Button>
        )}

        <ControlButton
          destructive
          disabled={isSubmitting}
          onClick={onLeave}
          icon={<PhoneOff className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />}
          label={isTeacher ? "Leave room" : "Leave class"}
          compactMode={compactMode || isMobile}
        />
      </div>
    </div>
  );
}
