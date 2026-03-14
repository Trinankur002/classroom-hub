import { LiveSessionMessage } from "@/types/live-session";
import { cn } from "@/lib/utils";

interface MeetingChatMessageProps {
  message: LiveSessionMessage;
  isOwn: boolean;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function MeetingChatMessage({ message, isOwn }: MeetingChatMessageProps) {
  return (
    <div className={cn("rounded-xl border px-3 py-2", isOwn ? "border-primary/30 bg-primary/10" : "border-border/60 bg-background/80")}>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-xs font-semibold text-foreground">{message.senderName || "Participant"}</span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</span>
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{message.message}</p>
    </div>
  );
}
