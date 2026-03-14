import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { livekitService } from "@/services/livekit.service";

interface LiveSessionMeta {
  sessionId: string;
  classroomId: string;
  classroomName: string;
  liveRoutePath: string;
}

interface LiveSessionContextValue {
  liveSessionActive: boolean;
  currentSessionId: string | null;
  currentClassroomId: string | null;
  currentClassroomName: string | null;
  currentLiveRoutePath: string | null;
  isMiniMode: boolean;
  beginLiveSession: (meta: LiveSessionMeta) => void;
  endLiveSession: () => Promise<void>;
}

const LiveSessionContext = createContext<LiveSessionContextValue | null>(null);

export function LiveSessionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [activeSession, setActiveSession] = useState<LiveSessionMeta | null>(null);
  const [liveSessionActive, setLiveSessionActive] = useState(false);

  useEffect(() => {
    const unsubscribe = livekitService.subscribe((state) => {
      if (state.connectionState === "connected") {
        setLiveSessionActive(true);
        return;
      }
      if (state.connectionState === "disconnected") {
        setLiveSessionActive(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!liveSessionActive) {
      setActiveSession(null);
    }
  }, [liveSessionActive]);

  const isMiniMode = useMemo(() => {
    if (!liveSessionActive || !activeSession) return false;
    return location.pathname !== activeSession.liveRoutePath;
  }, [activeSession, liveSessionActive, location.pathname]);

  const value = useMemo<LiveSessionContextValue>(() => ({
    liveSessionActive,
    currentSessionId: activeSession?.sessionId ?? null,
    currentClassroomId: activeSession?.classroomId ?? null,
    currentClassroomName: activeSession?.classroomName ?? null,
    currentLiveRoutePath: activeSession?.liveRoutePath ?? null,
    isMiniMode,
    beginLiveSession: (meta) => {
      setActiveSession(meta);
    },
    endLiveSession: async () => {
      await livekitService.disconnect();
      setLiveSessionActive(false);
      setActiveSession(null);
    },
  }), [activeSession, isMiniMode, liveSessionActive]);

  return <LiveSessionContext.Provider value={value}>{children}</LiveSessionContext.Provider>;
}

export function useLiveSessionContext() {
  const context = useContext(LiveSessionContext);
  if (!context) {
    throw new Error("useLiveSessionContext must be used within LiveSessionProvider");
  }
  return context;
}
