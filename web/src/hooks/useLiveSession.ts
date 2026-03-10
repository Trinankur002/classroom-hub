import { useCallback, useEffect, useMemo, useState } from "react";
import { LiveSessionApi } from "@/services/live-session.api";
import { liveSessionSocketService } from "@/services/live-session.socket.service";
import { WEBSOCKET_EVENTS } from "@/constants/websocketEvents";
import { JoinRequestStatus, LiveClassPermissions, LiveParticipant, LiveSession, ModerationAction, TokenResponse } from "@/types/live-session";
import { useAuth } from "./useAuth";

export function useLiveSession(classroomId?: string, startPermissions?: Partial<LiveClassPermissions>) {
  const { user } = useAuth();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [joinStatus, setJoinStatus] = useState<JoinRequestStatus | null>(null);
  const [waitingParticipants, setWaitingParticipants] = useState<LiveParticipant[]>([]);
  const [raisedHands, setRaisedHands] = useState<LiveParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = user?.role?.toLowerCase?.() === "teacher";
  const resolveSessionId = useCallback((raw: any): string => {
    const id = raw?.sessionId ?? raw?.id;
    if (!id || id === "undefined") return "";
    return String(id);
  }, []);

  const loadTeacherQueues = useCallback(async (sessionId: string) => {
    if (!isTeacher) return;
    const [waiting, hands] = await Promise.all([
      LiveSessionApi.getWaitingRoom(sessionId),
      LiveSessionApi.getRaisedHands(sessionId),
    ]);
    setWaitingParticipants(waiting);
    setRaisedHands(hands);
  }, [isTeacher]);

  const fetchAndSetToken = useCallback(async (sessionId: string) => {
    if (!sessionId || sessionId === "undefined") {
      setError("Invalid live session id while fetching token.");
      return;
    }
    const token = await LiveSessionApi.getToken(sessionId);
    setTokenData(token);
    setJoinStatus("approved");
  }, []);

  const setupSocketForSession = useCallback((sessionId: string) => {
    const authToken = localStorage.getItem("token");
    if (!authToken) return () => {};

    const socket = liveSessionSocketService.connect(authToken);
    liveSessionSocketService.joinSession(sessionId);

    const onWaitingUpdated = async () => {
      if (isTeacher) {
        await loadTeacherQueues(sessionId);
      }
    };

    const onParticipantApproved = async (payload: Record<string, unknown>) => {
      const approvedUserId = String(payload?.userId || "");
      if (isTeacher) {
        await loadTeacherQueues(sessionId);
        return;
      }
      if (approvedUserId && approvedUserId === user?.id) {
        await fetchAndSetToken(sessionId);
      }
    };

    const onHandRaised = async () => {
      if (isTeacher) {
        await loadTeacherQueues(sessionId);
      }
    };

    const onParticipantRemoved = (payload: Record<string, unknown>) => {
      const removedUserId = String(payload?.userId || "");
      if (removedUserId === user?.id) {
        setError("You were removed from live class by the teacher.");
        setTokenData(null);
      }
    };

    const onSessionEnded = () => {
      setError("Live session has ended.");
      setTokenData(null);
      setSession(null);
    };

    liveSessionSocketService.on(WEBSOCKET_EVENTS.WAITING_ROOM_UPDATED, onWaitingUpdated);
    liveSessionSocketService.on(WEBSOCKET_EVENTS.PARTICIPANT_APPROVED, onParticipantApproved);
    liveSessionSocketService.on(WEBSOCKET_EVENTS.HAND_RAISED, onHandRaised);
    liveSessionSocketService.on(WEBSOCKET_EVENTS.PARTICIPANT_REMOVED, onParticipantRemoved);
    liveSessionSocketService.on(WEBSOCKET_EVENTS.SESSION_ENDED, onSessionEnded);

    return () => {
      liveSessionSocketService.off(WEBSOCKET_EVENTS.WAITING_ROOM_UPDATED, onWaitingUpdated);
      liveSessionSocketService.off(WEBSOCKET_EVENTS.PARTICIPANT_APPROVED, onParticipantApproved);
      liveSessionSocketService.off(WEBSOCKET_EVENTS.HAND_RAISED, onHandRaised);
      liveSessionSocketService.off(WEBSOCKET_EVENTS.PARTICIPANT_REMOVED, onParticipantRemoved);
      liveSessionSocketService.off(WEBSOCKET_EVENTS.SESSION_ENDED, onSessionEnded);
      liveSessionSocketService.disconnect();
    };
  }, [fetchAndSetToken, isTeacher, loadTeacherQueues, user?.id]);

  const initialize = useCallback(async () => {
    if (!classroomId || !user) return;
    setError(null);
    setIsLoading(true);
    try {
      const active = await LiveSessionApi.getActiveSession(classroomId);
      setSession(active);

      if (isTeacher) {
        const sessionData = active ?? await LiveSessionApi.startSession(classroomId, startPermissions);
        setSession(sessionData as LiveSession);
        const sessionId = resolveSessionId(sessionData);
        if (!sessionId) {
          setError("Could not determine active live session id.");
          return;
        }
        await fetchAndSetToken(sessionId);
        await loadTeacherQueues(sessionId);
        setJoinStatus("approved");
      } else {
        if (!active) {
          setJoinStatus(null);
          setError("No active live class right now.");
          return;
        }
        const sessionId = resolveSessionId(active);
        if (!sessionId) {
          setError("Could not determine active live session id.");
          return;
        }
        const joinResponse = await LiveSessionApi.requestJoin(sessionId);
        setJoinStatus(joinResponse.status as JoinRequestStatus);
        if (joinResponse.status === "approved") {
          await fetchAndSetToken(sessionId);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to initialize live session");
    } finally {
      setIsLoading(false);
    }
  }, [classroomId, fetchAndSetToken, isTeacher, loadTeacherQueues, resolveSessionId, startPermissions, user]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!session?.sessionId) return;
    const cleanup = setupSocketForSession(session.sessionId);
    return cleanup;
  }, [session?.sessionId, setupSocketForSession]);

  const approveParticipant = useCallback(async (sessionId: string, userId: string) => {
    await LiveSessionApi.approveParticipant(sessionId, userId);
    await loadTeacherQueues(sessionId);
  }, [loadTeacherQueues]);

  const removeParticipant = useCallback(async (sessionId: string, userId: string) => {
    await LiveSessionApi.removeParticipant(sessionId, userId);
    await loadTeacherQueues(sessionId);
  }, [loadTeacherQueues]);

  const moderateParticipant = useCallback(async (sessionId: string, userId: string, action: ModerationAction) => {
    await LiveSessionApi.moderateParticipant(sessionId, userId, action);
  }, []);

  const raiseHand = useCallback(async (sessionId: string) => {
    await LiveSessionApi.raiseHand(sessionId);
  }, []);

  const lowerHand = useCallback(async (sessionId: string, userId?: string) => {
    await LiveSessionApi.lowerHand(sessionId, userId);
    if (isTeacher) {
      await loadTeacherQueues(sessionId);
    }
  }, [isTeacher, loadTeacherQueues]);

  const endSession = useCallback(async (sessionId: string) => {
    await LiveSessionApi.endSession(sessionId);
    setTokenData(null);
    setSession(null);
  }, []);

  return useMemo(() => ({
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
  }), [
    approveParticipant,
    endSession,
    error,
    initialize,
    isLoading,
    isTeacher,
    joinStatus,
    lowerHand,
    moderateParticipant,
    raiseHand,
    raisedHands,
    removeParticipant,
    session,
    tokenData,
    waitingParticipants,
  ]);
}
