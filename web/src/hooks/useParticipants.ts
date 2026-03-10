import { useMemo, useState } from "react";
import { Participant } from "livekit-client";

const PAGE_SIZE = 25;

export function useParticipants(participants: Participant[]) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(participants.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const visibleParticipants = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return participants.slice(startIndex, startIndex + PAGE_SIZE);
  }, [participants, safePage]);

  return {
    page: safePage,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,
    visibleParticipants,
  };
}

