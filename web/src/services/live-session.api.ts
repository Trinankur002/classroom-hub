import api from "./api";
import { LiveClassPermissions, LiveParticipant, LiveSession, ModerationAction, TokenResponse } from "@/types/live-session";

const normalizeSession = (raw: any): LiveSession | null => {
  if (!raw) return null;
  return {
    ...raw,
    sessionId: raw.sessionId ?? raw.id ?? "",
  };
};

const normalizeToken = (raw: any): TokenResponse => ({
  ...raw,
  sessionId: raw?.sessionId ?? raw?.id ?? "",
});

class LiveSessionApiService {
  async startSession(classroomId: string, permissions?: Partial<LiveClassPermissions>): Promise<TokenResponse & LiveSession> {
    const { data } = await api.post(`/live-sessions/${classroomId}/start`, permissions || {});
    const normalizedSession = normalizeSession(data);
    const normalizedToken = normalizeToken(data);
    return {
      ...(normalizedSession as LiveSession),
      ...normalizedToken,
    };
  }

  async getActiveSession(classroomId: string): Promise<LiveSession | null> {
    const { data } = await api.get(`/live-sessions/${classroomId}/active`);
    return normalizeSession(data);
  }

  async getTeacherActiveSession(): Promise<LiveSession | null> {
    const { data } = await api.get("/live-sessions/teacher/active");
    return normalizeSession(data);
  }

  async requestJoin(sessionId: string): Promise<{ status: string; sessionId: string }> {
    const { data } = await api.post(`/live-sessions/${sessionId}/request-join`);
    return data;
  }

  async getToken(sessionId: string): Promise<TokenResponse> {
    if (!sessionId || sessionId === "undefined") {
      throw new Error("Invalid session id for token request");
    }
    const { data } = await api.get(`/live-sessions/${sessionId}/token`);
    return normalizeToken(data);
  }

  async raiseHand(sessionId: string) {
    const { data } = await api.post(`/live-sessions/${sessionId}/raise-hand`);
    return data;
  }

  async lowerHand(sessionId: string, userId?: string) {
    const { data } = await api.post(`/live-sessions/${sessionId}/lower-hand`, { userId });
    return data;
  }

  async endSession(sessionId: string) {
    const { data } = await api.post(`/live-sessions/${sessionId}/end`);
    return data;
  }

  async approveParticipant(sessionId: string, userId: string) {
    const { data } = await api.post(`/live-sessions/${sessionId}/approve-participant`, { userId });
    return data;
  }

  async removeParticipant(sessionId: string, userId: string) {
    const { data } = await api.post(`/live-sessions/${sessionId}/remove-participant`, { userId });
    return data;
  }

  async moderateParticipant(sessionId: string, userId: string, action: ModerationAction) {
    const { data } = await api.post(`/live-sessions/${sessionId}/moderate`, { userId, action });
    return data;
  }

  async getWaitingRoom(sessionId: string): Promise<LiveParticipant[]> {
    const { data } = await api.get(`/live-sessions/${sessionId}/waiting-room`);
    return data;
  }

  async getRaisedHands(sessionId: string): Promise<LiveParticipant[]> {
    const { data } = await api.get(`/live-sessions/${sessionId}/raised-hands`);
    return data;
  }
}

export const LiveSessionApi = new LiveSessionApiService();
