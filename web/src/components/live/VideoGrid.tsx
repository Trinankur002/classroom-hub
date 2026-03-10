import { useMemo, useRef } from "react";
import { Participant } from "livekit-client";
import { Button } from "@/components/ui/button";
import { VideoTile } from "./VideoTile";
import { useLiveRoom } from "./LiveRoomProvider";

export type MeetingLayoutMode = "tiled" | "spotlight" | "sidebar";

interface VideoGridProps {
  participants: Participant[];
  activeSpeakerId?: string;
  layoutMode: MeetingLayoutMode;
}

export function VideoGrid({ participants, activeSpeakerId, layoutMode }: VideoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { page, setPage } = useLiveRoom();
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(participants.length / pageSize));
  const visibleParticipants = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return participants.slice(startIndex, startIndex + pageSize);
  }, [page, participants, totalPages]);

  const tileWidth = useMemo(() => {
    const width = containerRef.current?.clientWidth || 1280;
    if (layoutMode === "spotlight") return 220;
    if (layoutMode === "sidebar") return 240;
    const columns = Math.max(1, Math.floor(width / 280));
    return Math.floor(width / columns);
  }, [layoutMode, containerRef.current?.clientWidth]);

  const primaryParticipant = useMemo(() => {
    return visibleParticipants.find((participant) => participant.identity === activeSpeakerId) || visibleParticipants[0];
  }, [activeSpeakerId, visibleParticipants]);

  const secondaryParticipants = useMemo(() => {
    if (!primaryParticipant) return visibleParticipants;
    return visibleParticipants.filter((participant) => participant.identity !== primaryParticipant.identity);
  }, [primaryParticipant, visibleParticipants]);

  const renderPageControls = totalPages > 1;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div ref={containerRef} className="min-h-0 flex-1">
        {layoutMode === "tiled" && (
          <div
            className="grid h-full gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              alignItems: "stretch",
            }}
          >
            {visibleParticipants.map((participant) => (
              <VideoTile
                key={participant.sid}
                participant={participant}
                isVisible
                tileWidth={tileWidth}
                className="h-full min-h-[120px]"
                isActiveSpeaker={activeSpeakerId === participant.identity}
              />
            ))}
          </div>
        )}

        {layoutMode === "spotlight" && primaryParticipant && (
          <div className="flex h-full min-h-0 flex-col gap-3">
            <VideoTile
              key={primaryParticipant.sid}
              participant={primaryParticipant}
              isVisible
              tileWidth={Math.max(tileWidth, 480)}
              className="min-h-0 flex-1"
              isActiveSpeaker={activeSpeakerId === primaryParticipant.identity}
            />

            {secondaryParticipants.length > 0 && (
              <div className="grid max-h-[28%] grid-cols-2 gap-3 md:grid-cols-4">
                {secondaryParticipants.map((participant) => (
                  <VideoTile
                    key={participant.sid}
                    participant={participant}
                    isVisible
                    tileWidth={220}
                    className="h-full min-h-[80px]"
                    isActiveSpeaker={activeSpeakerId === participant.identity}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {layoutMode === "sidebar" && primaryParticipant && (
          <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[1fr_240px]">
            <VideoTile
              key={primaryParticipant.sid}
              participant={primaryParticipant}
              isVisible
              tileWidth={Math.max(tileWidth, 560)}
              className="min-h-0 h-full"
              isActiveSpeaker={activeSpeakerId === primaryParticipant.identity}
            />

            <div className="grid auto-rows-min gap-3 overflow-hidden">
              {secondaryParticipants.map((participant) => (
                <VideoTile
                  key={participant.sid}
                  participant={participant}
                  isVisible
                  tileWidth={220}
                  className="h-full min-h-[80px]"
                  isActiveSpeaker={activeSpeakerId === participant.identity}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {renderPageControls && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
