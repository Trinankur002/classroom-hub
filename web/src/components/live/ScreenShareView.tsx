import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { Track } from "livekit-client";

interface ScreenShareViewProps {
  track: Track;
  className?: string;
}

export function ScreenShareView({ track, className }: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    track.attach(videoElement);
    return () => {
      track.detach(videoElement);
    };
  }, [track]);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-primary/30 bg-black", className)}>
      <video ref={videoRef} className="h-full w-full object-contain" autoPlay playsInline />
    </div>
  );
}
