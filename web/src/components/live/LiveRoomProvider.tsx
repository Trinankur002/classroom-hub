import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { ConnectionState, LocalParticipant, Participant, Room, Track } from "livekit-client";
import { livekitService } from "@/services/livekit.service";
import { LiveRoomContextValue } from "@/types/live-session";
import { useParticipants } from "@/hooks/useParticipants";

interface LiveRoomProviderProps {
  token?: string;
  livekitUrl?: string;
  children: ReactNode;
}

interface ExtendedLiveRoomContextValue extends LiveRoomContextValue {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  enableMicrophone: () => Promise<void>;
  disableMicrophone: () => Promise<void>;
  enableCamera: () => Promise<void>;
  disableCamera: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  setParticipantVisibility: (participantId: string, isVisible: boolean, tileWidth: number) => void;
}

const LiveRoomContext = createContext<ExtendedLiveRoomContextValue | null>(null);

export function LiveRoomProvider({ token, livekitUrl, children }: LiveRoomProviderProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<Participant | null>(null);
  const [screenShareTrack, setScreenShareTrack] = useState<Track | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState | "idle">("idle");
  const {
    page,
    totalPages,
    setPage,
  } = useParticipants(participants);

  useEffect(() => {
    const unsubscribe = livekitService.subscribe((state) => {
      setParticipants(state.participants);
      setActiveSpeaker(state.activeSpeaker);
      setScreenShareTrack(state.screenShareTrack);
      setConnectionState(state.connectionState);
      const currentRoom = livekitService.getRoom();
      setRoom(currentRoom);
      setLocalParticipant(currentRoom?.localParticipant || null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!token || !livekitUrl) return;
    let mounted = true;

    const connect = async () => {
      try {
        const currentRoom = await livekitService.connectToRoom(token, livekitUrl);
        if (!mounted) return;
        setRoom(currentRoom);
        setLocalParticipant(currentRoom.localParticipant);
      } catch {
        if (!mounted) return;
        setConnectionState("disconnected");
      }
    };

    connect();

    return () => {
      mounted = false;
      livekitService.disconnect();
    };
  }, [livekitUrl, token]);

  const value = useMemo<ExtendedLiveRoomContextValue>(() => ({
    room,
    participants,
    localParticipant,
    activeSpeaker,
    screenShareTrack,
    connectionState,
    page,
    totalPages,
    setPage,
    connect: async () => {
      if (!token || !livekitUrl) return;
      await livekitService.connectToRoom(token, livekitUrl);
    },
    disconnect: async () => {
      await livekitService.disconnect();
    },
    enableMicrophone: () => livekitService.enableMicrophone(),
    disableMicrophone: () => livekitService.disableMicrophone(),
    enableCamera: () => livekitService.enableCamera(),
    disableCamera: () => livekitService.disableCamera(),
    startScreenShare: () => livekitService.startScreenShare(),
    stopScreenShare: () => livekitService.stopScreenShare(),
    setParticipantVisibility: (participantId, isVisible, tileWidth) =>
      livekitService.setParticipantVisibility(participantId, isVisible, tileWidth),
  }), [
    room,
    participants,
    localParticipant,
    activeSpeaker,
    screenShareTrack,
    connectionState,
    page,
    totalPages,
    setPage,
    token,
    livekitUrl,
  ]);

  return <LiveRoomContext.Provider value={value}>{children}</LiveRoomContext.Provider>;
}

export function useLiveRoom() {
  const context = useContext(LiveRoomContext);
  if (!context) {
    throw new Error("useLiveRoom must be used inside LiveRoomProvider");
  }
  return context;
}

