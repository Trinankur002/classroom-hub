import { useMemo } from "react";
import { Participant, Track } from "livekit-client";

export function useActiveSpeaker(
  activeSpeaker: Participant | null,
  participants: Participant[],
  screenShareTrack: Track | null,
) {
  const pinnedParticipant = useMemo(() => {
    if (screenShareTrack) return null;
    if (activeSpeaker) return activeSpeaker;
    return participants[0] ?? null;
  }, [activeSpeaker, participants, screenShareTrack]);

  return pinnedParticipant;
}

