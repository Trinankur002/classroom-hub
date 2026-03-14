import { useEffect, useState } from "react";
import { Participant, Track } from "livekit-client";
import ClassroomService from "@/services/classroomService";
import ClassroomAnnouncementService from "@/services/classroomAnnouncementService";
import { LiveClassPermissions } from "@/types/live-session";

export interface ClassroomLivePageProps {
  classroomId?: string;
  startPermissions?: Partial<LiveClassPermissions>;
  preJoinState?: {
    sessionId?: string;
    status?: string;
  };
  onLeavePage?: () => void;
}

export type StudentLiveState =
  | "checking-session"
  | "no-session"
  | "session-active"
  | "waiting-approval"
  | "connecting"
  | "connected";

export interface PreJoinState {
  preJoin?: {
    sessionId?: string;
    status?: string;
  };
}

export function useClassroomName(classroomId?: string) {
  const [classroomName, setClassroomName] = useState("Live Classroom");

  useEffect(() => {
    if (!classroomId) return;
    let mounted = true;

    const loadClassroomName = async () => {
      const { data } = await ClassroomService.getClassroomById(classroomId);
      if (!mounted) return;
      setClassroomName(data?.name || "Live Classroom");
    };

    void loadClassroomName();
    return () => {
      mounted = false;
    };
  }, [classroomId]);

  return classroomName;
}

export function useParticipantDirectory(classroomId: string) {
  const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});
  const [participantRoleMap, setParticipantRoleMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    const loadParticipantNames = async () => {
      const { data } = await ClassroomAnnouncementService.getAllClassroomUsers(classroomId);
      if (!mounted) return;

      const nameMap: Record<string, string> = {};
      const roleMap: Record<string, string> = {};

      for (const classroomUser of data || []) {
        if (!classroomUser?.id || !classroomUser?.name) continue;
        nameMap[classroomUser.id] = classroomUser.name;
        if (classroomUser.role) {
          roleMap[classroomUser.id] = classroomUser.role;
        }
      }

      setParticipantNameMap(nameMap);
      setParticipantRoleMap(roleMap);
    };

    void loadParticipantNames();
    return () => {
      mounted = false;
    };
  }, [classroomId]);

  return { participantNameMap, participantRoleMap };
}

export function findScreenShareParticipant(participants: Participant[]) {
  return (
    participants.find((participant) =>
      Array.from(participant.trackPublications.values()).some(
        (publication) =>
          publication.source === Track.Source.ScreenShare &&
          publication.track &&
          !publication.isMuted,
      ),
    ) ?? null
  );
}
