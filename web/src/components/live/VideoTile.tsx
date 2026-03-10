import { useEffect, useRef } from "react";
import { Participant, Track } from "livekit-client";
import { cn } from "@/lib/utils";
import { useLiveRoom } from "./LiveRoomProvider";

interface VideoTileProps {
  participant: Participant;
  isActiveSpeaker?: boolean;
  isVisible?: boolean;
  tileWidth?: number;
  label?: string;
  className?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function VideoTileComponent({
  participant,
  isActiveSpeaker = false,
  isVisible = true,
  tileWidth = 320,
  label,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { setParticipantVisibility } = useLiveRoom();

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

  const cameraTrack =
    cameraPublication?.track && !cameraPublication.isMuted
      ? cameraPublication.track
      : null;
  const microphoneTrack =
    microphonePublication?.track && !microphonePublication.isMuted
      ? microphonePublication.track
      : null;
  const shouldPlayAudio = !participant.isLocal && !!microphoneTrack;
  const participantDisplayName = (() => {
    if (label) return label;
    const candidate = (participant.name || "").trim();
    if (!candidate || UUID_REGEX.test(candidate)) {
      return participant.isLocal ? "You" : "Participant";
    }
    return candidate;
  })();

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
      className={cn(
        "relative overflow-hidden rounded-xl border bg-muted/30",
        isActiveSpeaker ? "border-primary ring-2 ring-primary/30" : "border-border",
        className,
      )}
    >
      <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted={participant.isLocal} />
      {!participant.isLocal && <audio ref={audioRef} autoPlay muted={false} />}
      <div className="absolute bottom-2 left-2 rounded-md bg-background/70 px-2 py-1 text-xs font-medium">
        {participantDisplayName}
      </div>
      {!cameraTrack && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Camera off
        </div>
      )}
    </div>
  );
}
export const VideoTile = VideoTileComponent;
