import { LiveParticipant } from "@/types/live-session";
import { Button } from "@/components/ui/button";

interface WaitingRoomPanelProps {
  sessionId: string;
  participants: LiveParticipant[];
  participantNameMap?: Record<string, string>;
  onApprove: (sessionId: string, userId: string) => Promise<void>;
  onReject: (sessionId: string, userId: string) => Promise<void>;
}

export function WaitingRoomPanel({
  sessionId,
  participants,
  participantNameMap,
  onApprove,
  onReject,
}: WaitingRoomPanelProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-3">
      <h3 className="text-sm font-semibold">Waiting Room</h3>
      <div className="space-y-2">
        {!participants.length && (
          <p className="text-sm text-muted-foreground">No students waiting.</p>
        )}
        {participants.map((participant) => (
          <div
            key={participant.userId}
            className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm">{participantNameMap?.[participant.userId] || "Student"}</span>
            <div className="ml-auto flex shrink-0 gap-1.5">
              <Button size="sm" className="h-8 px-3 text-xs" onClick={() => onApprove(sessionId, participant.userId)}>
                Approve
              </Button>
              <Button size="sm" variant="destructive" className="h-8 px-3 text-xs" onClick={() => onReject(sessionId, participant.userId)}>
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
