import { LiveParticipant } from "@/types/live-session";
import { Button } from "@/components/ui/button";

interface RaiseHandQueueProps {
  sessionId: string;
  participants: LiveParticipant[];
  participantNameMap?: Record<string, string>;
  onLowerHand: (sessionId: string, userId: string) => Promise<void>;
  onAllowMicrophone: (sessionId: string, userId: string) => Promise<void>;
}

export function RaiseHandQueue({
  sessionId,
  participants,
  participantNameMap,
  onLowerHand,
  onAllowMicrophone,
}: RaiseHandQueueProps) {
  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden rounded-xl bg-transparent">
      <h3 className="text-sm font-semibold">Raised Hands</h3>
      <div className="space-y-2 overflow-auto">
        {!participants.length && (
          <p className="text-sm text-muted-foreground">No raised hands right now.</p>
        )}
        {participants.map((participant) => (
          <div
            key={participant.userId}
            className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
          >
            <span className="truncate text-sm">{participantNameMap?.[participant.userId] || "Student"}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAllowMicrophone(sessionId, participant.userId)}
              >
                Allow Mic
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLowerHand(sessionId, participant.userId)}
              >
                Lower Hand
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
