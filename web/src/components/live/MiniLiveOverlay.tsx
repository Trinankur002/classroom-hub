import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoorOpen, Maximize2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Track } from "livekit-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { livekitService } from "@/services/livekit.service";
import { useLiveSessionContext } from "./LiveSessionContext";

function getPreviewTrack(room: ReturnType<typeof livekitService.getRoom>) {
  if (!room) return null;

  const localPublications = Array.from(room.localParticipant.trackPublications.values());
  const remotePublications = Array.from(room.remoteParticipants.values()).flatMap((participant) =>
    Array.from(participant.trackPublications.values()),
  );

  const allPublications = [...localPublications, ...remotePublications];

  const screenSharePublication = allPublications.find(
    (publication) =>
      publication.source === Track.Source.ScreenShare &&
      publication.track &&
      !publication.isMuted,
  );
  if (screenSharePublication?.track) {
    return screenSharePublication.track;
  }

  const cameraPublication = allPublications.find(
    (publication) =>
      publication.source === Track.Source.Camera &&
      publication.track &&
      !publication.isMuted,
  );
  if (cameraPublication?.track) {
    return cameraPublication.track;
  }

  return null;
}

function getLocalMediaState(room: ReturnType<typeof livekitService.getRoom>) {
  if (!room) {
    return { micEnabled: false, cameraEnabled: false };
  }

  const localPublications = Array.from(room.localParticipant.trackPublications.values());
  const micPublication = localPublications.find((publication) => publication.source === Track.Source.Microphone);
  const cameraPublication = localPublications.find((publication) => publication.source === Track.Source.Camera);

  return {
    micEnabled: !!micPublication && !micPublication.isMuted,
    cameraEnabled: !!cameraPublication && !cameraPublication.isMuted,
  };
}

function MiniVideoPreview() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [videoTrack, setVideoTrack] = useState<any>(null);

  useEffect(() => {
    const syncTrack = () => {
      setVideoTrack(getPreviewTrack(livekitService.getRoom()));
    };

    syncTrack();
    const unsubscribe = livekitService.subscribe(() => {
      syncTrack();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!containerRef.current || !videoTrack) return;
    const element = videoTrack.attach();
    element.classList.add("h-full", "w-full", "object-cover", "rounded-lg");
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [videoTrack]);

  useEffect(() => {
    if (!videoTrack && containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, [videoTrack]);

  return (
    <div className="relative h-24 w-full overflow-hidden rounded-lg bg-muted/60">
      {!videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Live preview
        </div>
      )}
      <div ref={containerRef} className={cn("h-full w-full", !videoTrack && "opacity-0")} />
    </div>
  );
}

export function MiniLiveOverlay() {
  const navigate = useNavigate();
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const {
    liveSessionActive,
    currentClassroomId,
    currentClassroomName,
    currentLiveRoutePath,
    isMiniMode,
    endLiveSession,
  } = useLiveSessionContext();

  useEffect(() => {
    const syncMediaState = () => {
      const mediaState = getLocalMediaState(livekitService.getRoom());
      setIsMicEnabled(mediaState.micEnabled);
      setIsCameraEnabled(mediaState.cameraEnabled);
    };

    syncMediaState();
    const unsubscribe = livekitService.subscribe(() => {
      syncMediaState();
    });
    return unsubscribe;
  }, []);

  const toggleMic = async () => {
    setIsBusy(true);
    try {
      if (isMicEnabled) {
        await livekitService.disableMicrophone();
      } else {
        await livekitService.enableMicrophone();
      }
    } finally {
      setIsBusy(false);
    }
  };

  const toggleCamera = async () => {
    setIsBusy(true);
    try {
      if (isCameraEnabled) {
        await livekitService.disableCamera();
      } else {
        await livekitService.enableCamera();
      }
    } finally {
      setIsBusy(false);
    }
  };

  if (!liveSessionActive || !isMiniMode || !currentClassroomId) return null;

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[70] w-72 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-2xl backdrop-blur">
      <MiniVideoPreview />
      <div className="mt-3 min-w-0">
        <p className="truncate text-sm font-semibold">{currentClassroomName || "Live Class"}</p>
        <p className="text-xs text-muted-foreground">Class in progress</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full",
            isMicEnabled && "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          onClick={() => void toggleMic()}
          disabled={isBusy}
          aria-label={isMicEnabled ? "Turn microphone off" : "Turn microphone on"}
          title={isMicEnabled ? "Turn microphone off" : "Turn microphone on"}
        >
          {isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full",
            isCameraEnabled && "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          onClick={() => void toggleCamera()}
          disabled={isBusy}
          aria-label={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
          title={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
        >
          {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1"
          onClick={() => navigate(currentLiveRoutePath || `/classrooms/${currentClassroomId}/live`)}
        >
          <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
          Return
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="flex-1"
          onClick={() => void endLiveSession()}
        >
          <DoorOpen className="mr-1.5 h-3.5 w-3.5" />
          Leave
        </Button>
      </div>
    </div>
  );
}
