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
            className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
          >
            <span className="truncate text-sm">{participantNameMap?.[participant.userId] || "Student"}</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onApprove(sessionId, participant.userId)}>
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onReject(sessionId, participant.userId)}>
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
