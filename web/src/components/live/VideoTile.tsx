import { useEffect, useMemo, useRef } from "react";
import { Participant, Track } from "livekit-client";
import { Hand, Mic, MicOff, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveRoom } from "./LiveRoomProvider";

interface VideoTileProps {
  participant: Participant;
  isActiveSpeaker?: boolean;
  isVisible?: boolean;
  tileWidth?: number;
  label?: string;
  className?: string;
  size?: "stage" | "grid" | "filmstrip";
  handRaised?: boolean;
  isPinned?: boolean;
  onClick?: () => void;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "P";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function VideoTileComponent({
  participant,
  isActiveSpeaker = false,
  isVisible = true,
  tileWidth = 320,
  label,
  className,
  size = "grid",
  handRaised = false,
  isPinned = false,
  onClick,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { setParticipantVisibility } = useLiveRoom();

  const { cameraTrack, microphoneTrack, isMicMuted, participantDisplayName } = useMemo(() => {
    const publications = Array.from(participant.trackPublications.values());
    const cameraPublication = publications.find(
      (publication) =>
        publication.kind === Track.Kind.Video &&
        publication.source === Track.Source.Camera,
    );
    const microphonePublication = publications.find(
      (publication) =>
        publication.kind === Track.Kind.Audio &&
        publication.source === Track.Source.Microphone,
    );

    const candidate = (label || participant.name || "").trim();
    const participantDisplayName = !candidate || UUID_REGEX.test(candidate)
      ? participant.isLocal
        ? "You"
        : "Participant"
      : candidate;

    return {
      cameraTrack:
        cameraPublication?.track && !cameraPublication.isMuted
          ? cameraPublication.track
          : null,
      microphoneTrack:
        microphonePublication?.track && !microphonePublication.isMuted
          ? microphonePublication.track
          : null,
      isMicMuted: !microphonePublication || microphonePublication.isMuted,
      participantDisplayName,
    };
  }, [label, participant]);

  const shouldPlayAudio = !participant.isLocal && !!microphoneTrack;

  useEffect(() => {
    setParticipantVisibility(participant.identity, isVisible, tileWidth);
  }, [isVisible, participant.identity, setParticipantVisibility, tileWidth]);

  useEffect(() => {
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;
    if (!videoElement) return;

    if (cameraTrack) {
      cameraTrack.attach(videoElement);
    }
    if (audioElement && shouldPlayAudio && microphoneTrack) {
      microphoneTrack.attach(audioElement);
    }

    return () => {
      if (cameraTrack) {
        cameraTrack.detach(videoElement);
      }
      if (audioElement && shouldPlayAudio && microphoneTrack) {
        microphoneTrack.detach(audioElement);
      }
    };
  }, [cameraTrack, microphoneTrack, shouldPlayAudio]);

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onClick();
            }
          }
          : undefined
      }
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-muted/30 transition",
        size === "stage" ? "shadow-sm" : "shadow-xs",
        isActiveSpeaker ? "border-primary ring-2 ring-primary/30" : "border-border",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <video
        ref={videoRef}
        className={cn(
          "h-full w-full bg-zinc-950 object-cover",
          size === "stage" && "object-contain",
        )}
        autoPlay
        playsInline
        muted={participant.isLocal}
      />
      {!participant.isLocal && <audio ref={audioRef} autoPlay muted={false} />}
      {!cameraTrack && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/70">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/85 text-lg font-semibold text-foreground shadow-sm">
              {getInitials(participantDisplayName)}
            </div>
            <div className="text-sm font-medium text-muted-foreground">Camera off</div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

      <div className="absolute left-3 top-3 flex items-center gap-2">
        {isPinned && (
          <span className="rounded-full bg-background/85 p-1.5 text-foreground shadow-sm">
            <Pin className="h-3.5 w-3.5" />
          </span>
        )}
        {handRaised && (
          <span className="rounded-full bg-amber-500/90 p-1.5 text-white shadow-sm">
            <Hand className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {participantDisplayName}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/80">
            <span
              className={cn(
                "inline-flex h-2.5 w-2.5 rounded-full",
                isActiveSpeaker ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(74,222,128,0.18)]" : "bg-white/35",
              )}
            />
            <span>{isActiveSpeaker ? "Speaking" : participant.isLocal ? "Local" : "Listening"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end">
          <span className="rounded-full bg-background/80 p-1.5 text-foreground shadow-sm">
            {isMicMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </span>
        </div>
      </div>
    </div>
  );
}

export const VideoTile = VideoTileComponent;
