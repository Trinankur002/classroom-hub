import { useEffect, useMemo, useRef, useState } from "react";
import { Track } from "livekit-client";
import { Ellipsis, Hand, Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LiveClassPermissions } from "@/types/live-session";
import { useLiveRoom } from "./LiveRoomProvider";

interface FullscreenControlsProps {
  isTeacher: boolean;
  permissions: LiveClassPermissions;
  isHandRaised?: boolean;
  onRaiseHand?: () => Promise<void>;
  onLowerHand?: () => Promise<void>;
  onLeave: () => void;
  onEndSession?: () => Promise<void>;
}

export function FullscreenControls({
  isTeacher,
  permissions,
  isHandRaised = false,
  onRaiseHand,
  onLowerHand,
  onLeave,
  onEndSession,
}: FullscreenControlsProps) {
  const {
    localParticipant,
    enableCamera,
    disableCamera,
    enableMicrophone,
    disableMicrophone,
    startScreenShare,
    stopScreenShare,
  } = useLiveRoom();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const collapseTimerRef = useRef<number | null>(null);

  const publications = localParticipant
    ? Array.from(localParticipant.trackPublications.values())
    : [];
  const micPublication = publications.find((publication) => publication.source === Track.Source.Microphone) || null;
  const cameraPublication = publications.find((publication) => publication.source === Track.Source.Camera) || null;
  const screenSharePublication = publications.find((publication) => publication.source === Track.Source.ScreenShare) || null;

  const isMicEnabled = !!micPublication && !micPublication.isMuted;
  const isCameraEnabled = !!cameraPublication && !cameraPublication.isMuted;
  const isScreenSharing = !!screenSharePublication && !screenSharePublication.isMuted;

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

  const resetCollapseTimer = () => {
    if (collapseTimerRef.current) {
      window.clearTimeout(collapseTimerRef.current);
    }
    collapseTimerRef.current = window.setTimeout(() => {
      setIsExpanded(false);
    }, 3000);
  };

  useEffect(() => {
    if (!isExpanded) return;
    resetCollapseTimer();
    return () => {
      if (collapseTimerRef.current) {
        window.clearTimeout(collapseTimerRef.current);
      }
    };
  }, [isExpanded]);

  const controls = useMemo(() => {
    const list = [
      {
        key: "mic",
        label: isMicEnabled ? "Mic on" : "Mic off",
        icon: isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />,
        active: isMicEnabled,
        disabled: !localParticipant || isSubmitting || (!isTeacher && !permissions.allowStudentMicrophone),
        onClick: () => runControl("Microphone", () => (isMicEnabled ? disableMicrophone() : enableMicrophone())),
      },
      {
        key: "cam",
        label: isCameraEnabled ? "Camera on" : "Camera off",
        icon: isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />,
        active: isCameraEnabled,
        disabled: !localParticipant || isSubmitting || (!isTeacher && !permissions.allowStudentCamera),
        onClick: () => runControl("Camera", () => (isCameraEnabled ? disableCamera() : enableCamera())),
      },
      {
        key: "share",
        label: isScreenSharing ? "Stop share" : "Share",
        icon: <MonitorUp className="h-4 w-4" />,
        active: isScreenSharing,
        disabled: !localParticipant || isSubmitting || (!isTeacher && !permissions.allowStudentScreenShare),
        onClick: () => runControl("Screen sharing", () => (isScreenSharing ? stopScreenShare() : startScreenShare())),
      },
    ];

    if (!isTeacher) {
      list.push({
        key: "hand",
        label: isHandRaised ? "Lower hand" : "Raise hand",
        icon: <Hand className="h-4 w-4" />,
        active: isHandRaised,
        disabled: isSubmitting,
        onClick: () => runControl("Raise hand", async () => {
          if (isHandRaised) {
            await onLowerHand?.();
          } else {
            await onRaiseHand?.();
          }
        }),
      });
    }

    if (isTeacher && onEndSession) {
      list.push({
        key: "end",
        label: "End",
        icon: <PhoneOff className="h-4 w-4" />,
        active: false,
        disabled: isSubmitting,
        onClick: () => runControl("End session", onEndSession),
      });
    }

    list.push({
      key: "leave",
      label: "Leave",
      icon: <PhoneOff className="h-4 w-4" />,
      active: false,
      disabled: isSubmitting,
      onClick: () => onLeave(),
    });

    return list;
  }, [
    disableCamera,
    disableMicrophone,
    enableCamera,
    enableMicrophone,
    isCameraEnabled,
    isHandRaised,
    isMicEnabled,
    isScreenSharing,
    isSubmitting,
    isTeacher,
    localParticipant,
    onEndSession,
    onLeave,
    onLowerHand,
    onRaiseHand,
    permissions.allowStudentCamera,
    permissions.allowStudentMicrophone,
    permissions.allowStudentScreenShare,
    startScreenShare,
    stopScreenShare,
  ]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div
        className={cn(
          "pointer-events-auto rounded-full border border-border/70 bg-card/95 shadow-xl backdrop-blur transition-all duration-300 ease-out",
          isExpanded ? "px-2 py-2" : "px-1.5 py-1.5",
        )}
        onMouseEnter={() => {
          setIsExpanded(true);
          resetCollapseTimer();
        }}
        onMouseMove={resetCollapseTimer}
      >
        {!isExpanded ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-11 w-11 rounded-full"
            onClick={() => {
              setIsExpanded(true);
              resetCollapseTimer();
            }}
            aria-label="Expand controls"
          >
            <Ellipsis className="h-5 w-5" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {controls.map((control) => (
              <Button
                key={control.key}
                type="button"
                size="icon"
                variant="outline"
                disabled={control.disabled}
                onClick={() => {
                  control.onClick();
                  resetCollapseTimer();
                }}
                className={cn(
                  "h-10 w-10 rounded-full border-border/80 bg-background/85 text-foreground transition",
                  control.active && "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90",
                  (control.key === "leave" || control.key === "end") && "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
                )}
                title={control.label}
                aria-label={control.label}
              >
                {control.icon}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
