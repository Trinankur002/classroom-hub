import { useMemo } from "react";
import { Participant, Track } from "livekit-client";
import { Hand, Mic, MicOff, Signal, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClassroomChat from "@/components/customComponent/ClassroomChat";
import { LiveParticipant } from "@/types/live-session";
import { TeacherControls } from "./TeacherControls";
import { WaitingRoomPanel } from "./WaitingRoomPanel";
import { RaiseHandQueue } from "./RaiseHandQueue";

type SidebarView = "participants" | "chat" | "hands";

interface ParticipantSidebarProps {
  classroomId?: string;
  view: SidebarView;
  onViewChange: (view: SidebarView) => void;
  connectedParticipants: Participant[];
  participantNameMap?: Record<string, string>;
  participantRoleMap?: Record<string, string>;
  raisedHands: LiveParticipant[];
  waitingParticipants: LiveParticipant[];
  sessionId: string;
  isTeacher: boolean;
  teacherIdentity?: string;
  onApproveParticipant: (sessionId: string, userId: string) => Promise<void>;
  onRemoveParticipant: (sessionId: string, userId: string) => Promise<void>;
  onModerateParticipant: (sessionId: string, userId: string, action: "mute" | "disable-camera" | "allow-microphone") => Promise<void>;
  onLowerHand: (sessionId: string, userId?: string) => Promise<void>;
}

function getParticipantRoleLabel(
  participant: Participant,
  teacherIdentity?: string,
  participantRoleMap?: Record<string, string>,
) {
  const mappedRole = participantRoleMap?.[participant.identity];
  if (mappedRole) return mappedRole;
  if (teacherIdentity && participant.identity === teacherIdentity) return "Teacher";
  return "Student";
}

export function ParticipantSidebar({
  classroomId,
  view,
  onViewChange,
  connectedParticipants,
  participantNameMap,
  participantRoleMap,
  raisedHands,
  waitingParticipants,
  sessionId,
  isTeacher,
  teacherIdentity,
  onApproveParticipant,
  onRemoveParticipant,
  onModerateParticipant,
  onLowerHand,
}: ParticipantSidebarProps) {
  const raisedHandIds = useMemo(() => new Set(raisedHands.map((participant) => participant.userId)), [raisedHands]);

  return (
    <Tabs value={view} onValueChange={(value) => onViewChange(value as SidebarView)} className="flex h-full flex-col">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="participants">Participants</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="hands">Hands</TabsTrigger>
      </TabsList>

      <TabsContent value="participants" className="mt-3 min-h-0 flex-1">
        <ScrollArea className="h-full rounded-2xl border border-border/70 bg-card/80 p-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Participants</h3>
              <Badge variant="secondary">{connectedParticipants.length}</Badge>
            </div>

            <div className="space-y-2">
              {connectedParticipants.map((participant) => {
                const name = participantNameMap?.[participant.identity] || participant.name || (participant.isLocal ? "You" : "Participant");
                const roleLabel = getParticipantRoleLabel(participant, teacherIdentity, participantRoleMap);
                const isRaised = raisedHandIds.has(participant.identity);
                const isMicMuted = Array.from(participant.trackPublications.values()).find(
                  (publication) => publication.source === Track.Source.Microphone,
                )?.isMuted ?? true;

                return (
                  <div key={participant.sid} className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded-full bg-muted p-2 text-muted-foreground">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{roleLabel}</span>
                            <span>{participant.isLocal ? "You" : participant.isSpeaking ? "Speaking" : "Connected"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-background px-2 py-1 text-[11px] text-muted-foreground">
                          <Signal className="mr-1 inline h-3 w-3" />
                          Live
                        </span>
                        <span className="rounded-full bg-background p-1.5 text-foreground">
                          {isMicMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                        </span>
                        {isRaised && (
                          <span className="rounded-full bg-amber-500/15 p-1.5 text-amber-600">
                            <Hand className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isTeacher && (
              <>
                <TeacherControls
                  sessionId={sessionId}
                  connectedParticipants={connectedParticipants.map((participant) => ({
                    identity: participant.identity,
                    name: participantNameMap?.[participant.identity] || participant.name,
                  }))}
                  onModerate={onModerateParticipant}
                  onRemove={onRemoveParticipant}
                />
                <WaitingRoomPanel
                  sessionId={sessionId}
                  participants={waitingParticipants}
                  participantNameMap={participantNameMap}
                  onApprove={onApproveParticipant}
                  onReject={onRemoveParticipant}
                />
              </>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="chat" className="mt-3 min-h-0 flex-1">
        <div className="h-full overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-0">
          {classroomId ? <ClassroomChat classroomId={classroomId} /> : <div className="p-4 text-sm text-muted-foreground">Chat unavailable.</div>}
        </div>
      </TabsContent>

      <TabsContent value="hands" className="mt-3 min-h-0 flex-1">
        <div className="h-full rounded-2xl border border-border/70 bg-card/80 p-3">
          <RaiseHandQueue
            sessionId={sessionId}
            participants={raisedHands}
            participantNameMap={participantNameMap}
            onLowerHand={(id, userId) => onLowerHand(id, userId)}
            onAllowMicrophone={(id, userId) => onModerateParticipant(id, userId, "allow-microphone")}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
