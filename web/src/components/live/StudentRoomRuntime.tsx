import { useEffect, useRef } from "react";
import { RoomEvent } from "livekit-client";
import { useLiveRoom } from "@/components/live/LiveRoomProvider";
import { LiveSessionApi } from "@/services/live-session.api";
import { LiveClassPermissions, LiveSession } from "@/types/live-session";
import { LiveRoomContent } from "./LiveRoomContent";

interface StudentRoomRuntimeProps {
  session: LiveSession;
  classroomId: string;
  classroomName: string;
  permissions: LiveClassPermissions;
  participantNameMap?: Record<string, string>;
  participantRoleMap?: Record<string, string>;
  teacherIdentity?: string;
  onConnected: () => void;
  onPermissionsChange: (permissions: LiveClassPermissions) => void;
  onLeavePage?: () => void;
}

export function StudentRoomRuntime({
  session,
  classroomId,
  classroomName,
  permissions,
  participantNameMap,
  participantRoleMap,
  teacherIdentity,
  onConnected,
  onPermissionsChange,
  onLeavePage,
}: StudentRoomRuntimeProps) {
  const { room, connectionState } = useLiveRoom();
  const isSetupDone = useRef(false);

  useEffect(() => {
    if (connectionState !== "connected" || isSetupDone.current) return;
    isSetupDone.current = true;
    onConnected();
  }, [connectionState, onConnected]);

  useEffect(() => {
    if (!room) return;

    const syncPermissions = () => {
      const raw = room.localParticipant.permissions as
        | {
            canPublish?: boolean;
            canPublishData?: boolean;
            canPublishSources?: Array<string | number>;
          }
        | undefined;

      if (Array.isArray(raw?.canPublishSources)) {
        const hasSource = (name: "camera" | "microphone" | "screen_share") => {
          return raw.canPublishSources!.some((source) => {
            if (typeof source === "number") {
              if (name === "camera") return source === 1;
              if (name === "microphone") return source === 2;
              return source === 3 || source === 4;
            }

            const normalized = source.toLowerCase();
            if (name === "screen_share") {
              return (
                normalized === "screen_share" ||
                normalized === "screenshare" ||
                normalized === "screen_share_audio"
              );
            }
            return normalized === name;
          });
        };

        onPermissionsChange({
          allowStudentMicrophone: hasSource("microphone"),
          allowStudentCamera: hasSource("camera"),
          allowStudentScreenShare: hasSource("screen_share"),
        });
        return;
      }

      const canPublish = raw?.canPublish === true;
      const canPublishData = raw?.canPublishData === true;
      onPermissionsChange({
        allowStudentMicrophone: canPublish,
        allowStudentCamera: canPublish,
        allowStudentScreenShare: canPublishData || canPublish,
      });
    };

    syncPermissions();
    room.on(RoomEvent.ParticipantPermissionsChanged, syncPermissions);
    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, syncPermissions);
    };
  }, [onPermissionsChange, room]);

  if (connectionState !== "connected") {
    return (
      <div className="space-y-3 p-4">
        <h1 className="text-xl font-semibold">Connecting to live class...</h1>
        <p className="text-sm text-muted-foreground">
          Please wait while we connect your session.
        </p>
      </div>
    );
  }

  return (
    <LiveRoomContent
      classroomId={classroomId}
      sessionId={session.sessionId}
      isTeacher={false}
      permissions={permissions}
      classroomName={classroomName}
      participantNameMap={participantNameMap}
      participantRoleMap={participantRoleMap}
      teacherIdentity={teacherIdentity}
      onRaiseHand={LiveSessionApi.raiseHand.bind(LiveSessionApi)}
      onLowerHand={LiveSessionApi.lowerHand.bind(LiveSessionApi)}
      onEndSession={async () => {}}
      waitingParticipants={[]}
      raisedHands={[]}
      onApproveParticipant={async () => {}}
      onRemoveParticipant={async () => {}}
      onModerateParticipant={async () => {}}
      onLeavePage={onLeavePage}
    />
  );
}
