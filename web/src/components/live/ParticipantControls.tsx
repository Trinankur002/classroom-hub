import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from "lucide-react";
import { useLiveRoom } from "./LiveRoomProvider";
import { LiveClassPermissions } from "@/types/live-session";
import { Track } from "livekit-client";
import { toast } from "@/hooks/use-toast";

interface ParticipantControlsProps {
  isTeacher: boolean;
  permissions: LiveClassPermissions;
  onLeave: () => void;
}

export function ParticipantControls({ isTeacher, permissions, onLeave }: ParticipantControlsProps) {
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

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
      <Button
        variant="outline"
        className={isMicEnabled
          ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-500 hover:text-white"
          : "border-input bg-background text-foreground hover:bg-background hover:text-foreground"}
        disabled={!localParticipant || isSubmitting || (!isTeacher && !permissions.allowStudentMicrophone)}
        onClick={async () => {
          setIsSubmitting(true);
          try {
            if (isMicEnabled) await disableMicrophone();
            else await enableMicrophone();
          } catch (error) {
            withControlError(error, "Microphone");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {isMicEnabled ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
        {isMicEnabled ? "Mic On" : "Mic Off"}
      </Button>

      <Button
        variant="outline"
        className={isCameraEnabled
          ? "border-sky-500 bg-sky-500 text-white hover:bg-sky-500 hover:text-white"
          : "border-input bg-background text-foreground hover:bg-background hover:text-foreground"}
        disabled={!localParticipant || isSubmitting || (!isTeacher && !permissions.allowStudentCamera)}
        onClick={async () => {
          setIsSubmitting(true);
          try {
            if (isCameraEnabled) await disableCamera();
            else await enableCamera();
          } catch (error) {
            withControlError(error, "Camera");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {isCameraEnabled ? <Video className="mr-2 h-4 w-4" /> : <VideoOff className="mr-2 h-4 w-4" />}
        {isCameraEnabled ? "Camera On" : "Camera Off"}
      </Button>

      <Button
        variant="outline"
        className={isScreenSharing
          ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-500 hover:text-white"
          : "border-input bg-background text-foreground hover:bg-background hover:text-foreground"}
        disabled={!localParticipant || isSubmitting || (!isTeacher && !permissions.allowStudentScreenShare)}
        onClick={async () => {
          setIsSubmitting(true);
          try {
            if (isScreenSharing) {
              await stopScreenShare();
            } else {
              await startScreenShare();
            }
          } catch (error) {
            withControlError(error, "Screen sharing");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <MonitorUp className="mr-2 h-4 w-4" />
        {isScreenSharing ? "Stop Share" : "Share Screen"}
      </Button>

      <Button variant="destructive" onClick={onLeave}>
        <PhoneOff className="mr-2 h-4 w-4" />
        Leave
      </Button>
    </div>
  );
}
