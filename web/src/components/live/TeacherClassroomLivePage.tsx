import { useAuth } from "@/hooks/useAuth";
import { useLiveSession } from "@/hooks/useLiveSession";
import { LiveRoomProvider } from "@/components/live/LiveRoomProvider";
import { Button } from "@/components/ui/button";
import { LiveClassPermissions } from "@/types/live-session";
import { LiveRoomContent } from "./LiveRoomContent";
import {
  ClassroomLivePageProps,
  useClassroomName,
  useParticipantDirectory,
} from "./classroomLiveShared";

type TeacherClassroomLivePageProps = Required<Pick<ClassroomLivePageProps, "classroomId">> &
  Omit<ClassroomLivePageProps, "classroomId">;

export function TeacherClassroomLivePage({
  classroomId,
  startPermissions,
  onLeavePage,
}: TeacherClassroomLivePageProps) {
  const { user } = useAuth();
  const classroomName = useClassroomName(classroomId);
  const { participantNameMap, participantRoleMap } = useParticipantDirectory(classroomId);
  const {
    session,
    tokenData,
    joinStatus,
    waitingParticipants,
    raisedHands,
    isLoading,
    error,
    isTeacher,
    initialize,
    approveParticipant,
    removeParticipant,
    moderateParticipant,
    raiseHand,
    lowerHand,
    endSession,
  } = useLiveSession(classroomId, startPermissions);

  if (isLoading) {
    return <div className="p-4">Loading live class...</div>;
  }

  if (error && !session && !tokenData) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => initialize()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!isTeacher && joinStatus === "waiting" && !tokenData) {
    return (
      <div className="space-y-3 p-4">
        <h1 className="text-xl font-semibold">Waiting Room</h1>
        <p className="text-sm text-muted-foreground">
          Your join request is pending teacher approval.
        </p>
      </div>
    );
  }

  if (!session || !tokenData) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">Preparing live classroom...</p>
        <Button variant="outline" onClick={() => initialize()}>
          Refresh
        </Button>
      </div>
    );
  }

  const effectivePermissions: LiveClassPermissions = {
    allowStudentMicrophone:
      tokenData.allowStudentMicrophone ?? session.allowStudentMicrophone ?? false,
    allowStudentCamera: tokenData.allowStudentCamera ?? session.allowStudentCamera ?? false,
    allowStudentScreenShare:
      tokenData.allowStudentScreenShare ?? session.allowStudentScreenShare ?? false,
  };

  return (
    <div className="h-[calc(100vh-1.5rem)] overflow-hidden rounded-[32px] border border-border/60 bg-card/50">
      <LiveRoomProvider
        token={tokenData.token}
        livekitUrl={tokenData.livekitUrl || import.meta.env.VITE_LIVEKIT_WS_URL}
        preserveConnectionOnUnmount
      >
        <LiveRoomContent
          classroomId={classroomId}
          sessionId={session.sessionId}
          isTeacher={isTeacher}
          permissions={effectivePermissions}
          classroomName={classroomName}
          participantNameMap={participantNameMap}
          participantRoleMap={participantRoleMap}
          teacherIdentity={user?.id}
          onRaiseHand={raiseHand}
          onLowerHand={lowerHand}
          onEndSession={endSession}
          waitingParticipants={waitingParticipants}
          raisedHands={raisedHands}
          onApproveParticipant={approveParticipant}
          onRemoveParticipant={removeParticipant}
          onModerateParticipant={moderateParticipant}
          onLeavePage={onLeavePage}
        />
      </LiveRoomProvider>
    </div>
  );
}
