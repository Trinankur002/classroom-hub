import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IChatMessage, IChatParticipant } from "@/types/chat";
import { Loader2 } from "lucide-react";
import { RefObject, useEffect } from "react";

interface Props {
    messages: IChatMessage[];
    currentUserId: string;
    participantsMap: Record<string, IChatParticipant | undefined>;
    hasMore: boolean;
    isLoadingOlder: boolean;
    onLoadOlder: () => void;
    scrollContainerRef: RefObject<HTMLDivElement>;
}

function ClassroomChatMessageList({
    messages,
    currentUserId,
    participantsMap,
    hasMore,
    isLoadingOlder,
    onLoadOlder,
    scrollContainerRef,
}: Props) {
    useEffect(() => {
        const container = scrollContainerRef.current;
        const viewport = container?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;

        if (!viewport) return;

        const handleScroll = () => {
            if (viewport.scrollTop <= 40 && hasMore && !isLoadingOlder) {
                onLoadOlder();
            }
        };

        viewport.addEventListener("scroll", handleScroll);
        return () => viewport.removeEventListener("scroll", handleScroll);
    }, [hasMore, isLoadingOlder, onLoadOlder, scrollContainerRef]);

    if (messages.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No messages yet.
            </div>
        );
    }

    return (
        <ScrollArea className="h-full p-4" ref={scrollContainerRef}>
            <div className="space-y-3">
                <div className="flex justify-center">
                    {hasMore ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onLoadOlder}
                            disabled={isLoadingOlder}
                        >
                            {isLoadingOlder && <Loader2 className="h-4 w-4 animate-spin" />}
                            Load older messages
                        </Button>
                    ) : (
                        <p className="text-xs text-muted-foreground">No older messages</p>
                    )}
                </div>

                {messages.map((message) => {
                    const isMine = message.senderId === currentUserId;
                    const participant = participantsMap[message.senderId];
                    const senderName = participant?.user?.name || "Student";
                    const avatarUrl = participant?.user?.avatarUrl || "";
                    const initials = senderName.slice(0, 2).toUpperCase();

                    return (
                        <div
                            key={message.id}
                            className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                        >
                            {!isMine && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={`rounded-lg px-3 py-2 max-w-[80%] ${isMine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                    }`}
                            >
                                {!isMine && <p className="text-xs font-semibold opacity-90 mb-1">{senderName}</p>}
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                <p className="text-[10px] text-right opacity-70 mt-1">
                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}

export default ClassroomChatMessageList;
