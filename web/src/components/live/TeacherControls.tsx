import { ModerationAction } from "@/types/live-session";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MicOff, VideoOff, UserX } from "lucide-react";

interface TeacherControlsProps {
  sessionId: string;
  connectedParticipants: Array<{ identity: string; name?: string }>;
  onModerate: (sessionId: string, userId: string, action: ModerationAction) => Promise<void>;
  onRemove: (sessionId: string, userId: string) => Promise<void>;
}

export function TeacherControls({
  sessionId,
  connectedParticipants,
  onModerate,
  onRemove,
}: TeacherControlsProps) {
  if (!connectedParticipants.length) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-3">
        <h3 className="text-sm font-semibold">Teacher Moderation</h3>
        <div className="space-y-2">
          {connectedParticipants.map((participant) => (
            <div
              key={participant.identity}
              className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
            >
              <div className="min-w-0 truncate text-sm">{participant.name || "Participant"}</div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9"
                      onClick={() => onModerate(sessionId, participant.identity, "mute")}
                    >
                      <MicOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mute</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9"
                      onClick={() => onModerate(sessionId, participant.identity, "disable-camera")}
                    >
                      <VideoOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Disable Camera</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-9 w-9"
                      onClick={() => onRemove(sessionId, participant.identity)}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
