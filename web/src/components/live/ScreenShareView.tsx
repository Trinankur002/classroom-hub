import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { Track } from "livekit-client";
import { MonitorUp } from "lucide-react";

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
    <div className={cn("relative overflow-hidden rounded-[28px] border border-primary/20 bg-black shadow-sm", className)}>
      <video ref={videoRef} className="h-full w-full object-contain" autoPlay playsInline />
      <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
        <MonitorUp className="h-3.5 w-3.5 text-primary" />
        <span>Screen share</span>
      </div>
    </div>
  );
}
