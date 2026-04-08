import { io, Socket } from "socket.io-client";
import { WEBSOCKET_EVENTS } from "@/constants/websocketEvents";
import { resolveBackendOrigin } from "@/lib/backend-url";

type LiveEventPayload = Record<string, unknown>;

class LiveSessionSocketService {
  private socket: Socket | null = null;

  private getNamespaceUrl() {
    return `${resolveBackendOrigin()}/live-session`;
  }

  connect(token: string) {
    if (!this.socket) {
      this.socket = io(this.getNamespaceUrl(), {
        transports: ["websocket"],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
      });
    }

    this.socket.auth = { token };
    this.socket.connect();
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
  }

  joinSession(sessionId: string) {
    this.socket?.emit(WEBSOCKET_EVENTS.LIVE_SESSION_JOIN, { sessionId });
  }

  on(event: WEBSOCKET_EVENTS, cb: (payload: LiveEventPayload) => void) {
    this.socket?.on(event, cb);
  }

  off(event: WEBSOCKET_EVENTS, cb?: (payload: LiveEventPayload) => void) {
    if (!this.socket) return;
    if (cb) {
      this.socket.off(event, cb);
      return;
    }
    this.socket.off(event);
  }
}

export const liveSessionSocketService = new LiveSessionSocketService();

