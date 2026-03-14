import { ActiveLiveSession } from "@/types/live-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio } from "lucide-react";

interface LiveClassCardProps {
  session: ActiveLiveSession;
  onJoin: (session: ActiveLiveSession) => void;
  isJoining?: boolean;
}

export function LiveClassCard({ session, onJoin, isJoining = false }: LiveClassCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-hover">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">{session.classroomName}</CardTitle>
          <Badge variant="destructive" className="px-3 py-1 text-xs">
            <Radio className="mr-1 h-3.5 w-3.5" />
            Live
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Teacher: {session.teacherName}</p>
      </CardHeader>

      <CardContent className="flex justify-end">
        <Button onClick={() => onJoin(session)} disabled={isJoining}>
          {isJoining ? "Sending Request..." : "Join Live Class"}
        </Button>
      </CardContent>
    </Card>
  );
}
