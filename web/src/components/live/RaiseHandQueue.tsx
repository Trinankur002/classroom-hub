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
            className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm">{participantNameMap?.[participant.userId] || "Student"}</span>
            <div className="ml-auto flex shrink-0 gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => onAllowMicrophone(sessionId, participant.userId)}
              >
                Allow Mic
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
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
