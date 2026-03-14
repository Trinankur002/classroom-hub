import { ReactNode } from "react";
import { PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LiveFullscreenModeProps {
  participantsOpen: boolean;
  onToggleParticipants: () => void;
  stage: ReactNode;
  sidebar?: ReactNode;
}

export function LiveFullscreenMode({
  participantsOpen,
  onToggleParticipants,
  stage,
  sidebar,
}: LiveFullscreenModeProps) {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-black">
      <div className={cn("flex h-full min-h-0 flex-1 flex-col overflow-hidden p-3", participantsOpen ? "pr-[24rem]" : "pr-3")}>
        {stage}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onToggleParticipants}
        className="absolute right-4 top-4 z-20 rounded-full bg-card/90"
      >
        <PanelRight className="mr-1.5 h-4 w-4" />
        {participantsOpen ? "Hide participants" : "Show participants"}
      </Button>

      {participantsOpen && (
        <aside className="absolute right-3 top-16 z-10 h-[calc(100%-5.5rem)] w-[22rem] overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-3 shadow-xl">
          {sidebar}
        </aside>
      )}
    </div>
  );
}
