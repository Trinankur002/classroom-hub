import { Card } from "@/components/ui/card";
import { ActiveLiveSession } from "@/types/live-session";
import { LiveClassCard } from "./LiveClassCard";
import { TvMinimalPlay } from "lucide-react";

interface LiveClassListProps {
  sessions: ActiveLiveSession[];
  onJoin: (session: ActiveLiveSession) => void;
  joiningSessionId?: string | null;
}

export function LiveClassList({ sessions, onJoin, joiningSessionId = null }: LiveClassListProps) {
  if (!sessions.length) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-4">
          <TvMinimalPlay className="mx-auto h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">No Active Live Classes</h3>
            <p className="text-muted-foreground">No teachers are live in your classrooms right now.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <LiveClassCard
          key={session.sessionId}
          session={session}
          onJoin={onJoin}
          isJoining={joiningSessionId === session.sessionId}
        />
      ))}
    </div>
  );
}
