import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Participant } from "livekit-client";
import { LayoutGrid, MonitorUp, Pin, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { VideoTile } from "./VideoTile";

export type MeetingLayoutMode = "grid" | "stage" | "screen-share";

interface VideoGridProps {
  participants: Participant[];
  stageParticipant?: Participant | null;
  activeSpeakerId?: string;
  participantNameMap?: Record<string, string>;
  raisedHandIds?: Set<string>;
  layoutMode: MeetingLayoutMode;
  isScreenSharing?: boolean;
  compactMode?: boolean;
  hideFilmstrip?: boolean;
  pinnedParticipantId?: string | null;
  onPinParticipant?: (participantId: string | null) => void;
}

interface GridMetrics {
  columns: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
}

const PARTICIPANT_COLUMN_WIDTH = 200;
const COMPACT_PARTICIPANT_COLUMN_WIDTH = 160;
const PARTICIPANT_TILE_WIDTH = 176;
const COMPACT_PARTICIPANT_TILE_WIDTH = 144;
const GRID_GAP = 12;

function getContainerMetrics(element: HTMLDivElement | null) {
  return {
    width: element?.clientWidth || 0,
    height: element?.clientHeight || 0,
  };
}

function getBestGridMetrics(count: number, width: number, height: number): GridMetrics {
  if (count <= 0 || width <= 0 || height <= 0) {
    return { columns: 1, rows: 1, tileWidth: Math.max(width, 0), tileHeight: Math.max(height, 0) };
  }

  let best: GridMetrics = { columns: 1, rows: count, tileWidth: width, tileHeight: height / count };
  let bestScore = -1;

  for (let columns = 1; columns <= count; columns += 1) {
    const rows = Math.ceil(count / columns);
    const totalGapWidth = GRID_GAP * Math.max(columns - 1, 0);
    const totalGapHeight = GRID_GAP * Math.max(rows - 1, 0);
    const tileWidth = (width - totalGapWidth) / columns;
    const tileHeight = (height - totalGapHeight) / rows;

    if (tileWidth <= 0 || tileHeight <= 0) continue;

    const aspectPenalty = Math.abs(tileWidth / tileHeight - 16 / 9);
    const area = tileWidth * tileHeight;
    const score = area - aspectPenalty * 8000 - Math.abs(columns - rows) * 250;

    if (score > bestScore) {
      bestScore = score;
      best = { columns, rows, tileWidth, tileHeight };
    }
  }

  return best;
}

export function VideoGrid({
  participants,
  stageParticipant,
  activeSpeakerId,
  participantNameMap,
  raisedHandIds,
  layoutMode,
  isScreenSharing = false,
  compactMode = false,
  hideFilmstrip = false,
  pinnedParticipantId,
  onPinParticipant,
}: VideoGridProps) {
  const isMobile = useIsMobile();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const orderedParticipants = useMemo(() => {
    const stageId = stageParticipant?.identity;
    return [...participants].sort((left, right) => {
      if (left.identity === stageId) return -1;
      if (right.identity === stageId) return 1;
      if (left.identity === activeSpeakerId) return -1;
      if (right.identity === activeSpeakerId) return 1;
      if (left.isLocal) return -1;
      if (right.isLocal) return 1;
      return (left.name || left.identity).localeCompare(right.name || right.identity);
    });
  }, [activeSpeakerId, participants, stageParticipant?.identity]);

  const filmstripParticipants = useMemo(() => {
    if (layoutMode === "grid") return orderedParticipants;
    return orderedParticipants.filter((participant) => participant.identity !== stageParticipant?.identity);
  }, [layoutMode, orderedParticipants, stageParticipant?.identity]);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const syncMetrics = () => {
      setContainerSize(getContainerMetrics(element));
    };

    syncMetrics();

    const resizeObserver = new ResizeObserver(syncMetrics);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [layoutMode, orderedParticipants.length]);

  const gridMetrics = useMemo(() => {
    return getBestGridMetrics(
      orderedParticipants.length,
      containerSize.width,
      containerSize.height,
    );
  }, [containerSize.height, containerSize.width, orderedParticipants.length]);

  const showStage = layoutMode !== "grid" && !!stageParticipant;
  const participantColumnWidth = compactMode ? COMPACT_PARTICIPANT_COLUMN_WIDTH : PARTICIPANT_COLUMN_WIDTH;
  const participantTileWidth = compactMode ? COMPACT_PARTICIPANT_TILE_WIDTH : PARTICIPANT_TILE_WIDTH;

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${gridMetrics.columns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${gridMetrics.rows}, minmax(0, 1fr))`,
    gap: GRID_GAP,
  };

  const stageRailStyle: CSSProperties | undefined = isMobile || hideFilmstrip
    ? undefined
    : {
      gridTemplateColumns: `minmax(0, 1fr) ${participantColumnWidth}px`,
    };

  return (
    <div ref={rootRef} className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {layoutMode === "grid" ? (
        <div className="grid min-h-0 flex-1 auto-rows-fr" style={gridStyle}>
          {orderedParticipants.map((participant) => (
            <VideoTile
              key={participant.sid}
              participant={participant}
              label={participantNameMap?.[participant.identity]}
              isVisible
              tileWidth={gridMetrics.tileWidth}
              className="h-full min-h-0"
              size="grid"
              isActiveSpeaker={activeSpeakerId === participant.identity}
              handRaised={raisedHandIds?.has(participant.identity)}
              isPinned={participant.identity === pinnedParticipantId}
              onClick={() =>
                onPinParticipant?.(
                  pinnedParticipantId === participant.identity ? null : participant.identity,
                )
              }
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "grid min-h-0 h-full flex-1 gap-3",
            hideFilmstrip ? "grid-cols-1 grid-rows-[minmax(0,1fr)]" : "",
            isMobile && !hideFilmstrip ? "grid-cols-1 grid-rows-[minmax(0,1fr)_auto]" : "",
          )}
          style={stageRailStyle}
        >
          {showStage && stageParticipant ? (
            <div className={cn("min-h-0 h-full flex-1 border border-border/70 bg-card/70 shadow-sm", compactMode ? "rounded-[24px] p-1" : "rounded-[28px] p-2")}>
              <div className={cn("flex h-full min-h-[280px] flex-col bg-background/70", compactMode ? "gap-1 rounded-[20px] p-1" : "gap-2 rounded-[24px] p-2")}>
                <div className={cn("flex items-center justify-between text-muted-foreground", compactMode ? "gap-2 px-1 pt-0.5 text-xs" : "gap-3 px-2 pt-1 text-sm")}>
                  <div className="flex items-center gap-2">
                    {isScreenSharing ? <MonitorUp className={cn(compactMode ? "h-3.5 w-3.5" : "h-4 w-4")} /> : <Users className={cn(compactMode ? "h-3.5 w-3.5" : "h-4 w-4")} />}
                    <span>{isScreenSharing ? "Presenting now" : "Stage focus"}</span>
                  </div>
                  {stageParticipant.identity === pinnedParticipantId && (
                    <div className={cn("inline-flex items-center gap-1 rounded-full bg-primary/10 font-medium text-primary", compactMode ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs")}>
                      <Pin className={cn(compactMode ? "h-2.5 w-2.5" : "h-3 w-3")} />
                      <span>Pinned</span>
                    </div>
                  )}
                </div>
                <VideoTile
                  key={stageParticipant.sid}
                  participant={stageParticipant}
                  label={participantNameMap?.[stageParticipant.identity]}
                  isVisible
                  tileWidth={Math.max(containerSize.width - (isMobile || hideFilmstrip ? 0 : participantColumnWidth), 720)}
                  className="min-h-0 flex-1"
                  size="stage"
                  isActiveSpeaker={activeSpeakerId === stageParticipant.identity}
                  handRaised={raisedHandIds?.has(stageParticipant.identity)}
                  isPinned={stageParticipant.identity === pinnedParticipantId}
                  onClick={() =>
                    onPinParticipant?.(
                      pinnedParticipantId === stageParticipant.identity ? null : stageParticipant.identity,
                    )
                  }
                />
              </div>
            </div>
          ) : null}

          {!hideFilmstrip && (
            <aside
              className={cn(
                "min-h-0 overflow-hidden border border-border/70 bg-card/60 shadow-sm",
                compactMode ? "rounded-[20px] p-2" : "rounded-[24px] p-3",
                isMobile ? "max-h-[40vh]" : "",
              )}
              style={isMobile ? undefined : { width: participantColumnWidth }}
            >
              <div className={cn("flex items-center justify-between gap-3 px-1", compactMode ? "mb-2" : "mb-3")}>
                <div className={cn("flex items-center gap-2 font-medium text-foreground", compactMode ? "text-xs" : "text-sm")}>
                  {isScreenSharing ? <MonitorUp className={cn(compactMode ? "h-3.5 w-3.5" : "h-4 w-4")} /> : <LayoutGrid className={cn(compactMode ? "h-3.5 w-3.5" : "h-4 w-4")} />}
                  <span>Participants</span>
                  <span className="text-muted-foreground">{filmstripParticipants.length}</span>
                </div>
              </div>

              <ScrollArea className="h-full rounded-xl">
                <div className={cn("flex flex-col pr-2", compactMode ? "gap-2" : "gap-3")}>
                  {filmstripParticipants.map((participant) => (
                    <VideoTile
                      key={participant.sid}
                      participant={participant}
                      label={participantNameMap?.[participant.identity]}
                      isVisible
                      tileWidth={participantTileWidth}
                      className={cn("aspect-video h-auto w-full", compactMode ? "min-h-[80px]" : "min-h-[96px]")}
                      size="filmstrip"
                      isActiveSpeaker={activeSpeakerId === participant.identity}
                      handRaised={raisedHandIds?.has(participant.identity)}
                      isPinned={participant.identity === pinnedParticipantId}
                      onClick={() =>
                        onPinParticipant?.(
                          pinnedParticipantId === participant.identity ? null : participant.identity,
                        )
                      }
                    />
                  ))}
                </div>
              </ScrollArea>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
