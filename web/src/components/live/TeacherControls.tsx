import { ModerationAction } from "@/types/live-session";
import { Button } from "@/components/ui/button";

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
    <div className="flex max-h-36 flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-3">
      <h3 className="text-sm font-semibold">Teacher Moderation</h3>
      <div className="space-y-2 overflow-auto">
        {connectedParticipants.map((participant) => (
          <div
            key={participant.identity}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2"
          >
            <div className="text-sm">{participant.name || "Participant"}</div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onModerate(sessionId, participant.identity, "mute")}
              >
                Mute
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onModerate(sessionId, participant.identity, "disable-camera")}
              >
                Disable Camera
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemove(sessionId, participant.identity)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
