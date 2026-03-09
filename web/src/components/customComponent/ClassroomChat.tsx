import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import ChatService from "@/services/chatService";
import { getGlobalSocket } from "@/services/socketService";
import { IChatMessage, IChatParticipant, IChatRoom } from "@/types/chat";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClassroomChatComposer from "./ClassroomChatComposer";
import ClassroomChatMessageList from "./ClassroomChatMessageList";

interface Props {
    classroomId: string;
}

function ClassroomChat({ classroomId }: Props) {
    const navigate = useNavigate();
    const [room, setRoom] = useState<IChatRoom | null>(null);
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [participants, setParticipants] = useState<IChatParticipant[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token") || "";
    const userId = user?.id || "";
    const userRole = user?.role?.toString().toLowerCase();

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prependScrollRef = useRef<{ top: number; height: number } | null>(null);

    const participantsMap = useMemo(() => {
        const map: Record<string, IChatParticipant | undefined> = {};
        participants.forEach((p) => {
            map[p.userId] = p;
        });
        return map;
    }, [participants]);

    const moveToDashboard = useCallback(() => {
        toast({
            title: "Removed from classroom",
            description: "You are no longer a participant in this classroom chat.",
            variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
    }, [navigate]);

    const scrollToBottom = useCallback((smooth = true) => {
        const container = scrollContainerRef.current;
        const viewport = container?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
        if (!viewport) return;
        viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: smooth ? "smooth" : "auto",
        });
    }, []);

    const appendUniqueMessages = useCallback((current: IChatMessage[], incoming: IChatMessage[]) => {
        const map = new Map<string, IChatMessage>();
        current.forEach((m) => map.set(m.id, m));
        incoming.forEach((m) => map.set(m.id, m));
        return Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }, []);

    const loadOlderMessages = useCallback(async () => {
        if (!room?.id || !hasMore || isLoadingOlder || !cursor) return;

        const container = scrollContainerRef.current;
        const viewport = container?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;

        if (viewport) {
            prependScrollRef.current = {
                top: viewport.scrollTop,
                height: viewport.scrollHeight,
            };
        }

        setIsLoadingOlder(true);
        try {
            const { data, error, statusCode } = await ChatService.getChatMessages(room.id, {
                before: cursor,
                limit: 30,
            });

            if (error) {
                if (statusCode === 403) {
                    moveToDashboard();
                    return;
                }
                throw new Error(error);
            }

            if (data) {
                setMessages((prev) => appendUniqueMessages(data.messages, prev));
                setHasMore(Boolean(data.hasMore));
                setCursor(data.nextCursor);
            }
        } catch (error) {
            toast({
                title: "Failed to load older messages",
                description: String(error),
                variant: "destructive",
            });
        } finally {
            setIsLoadingOlder(false);
        }
    }, [appendUniqueMessages, cursor, hasMore, isLoadingOlder, moveToDashboard, room?.id]);

    useEffect(() => {
        const saved = prependScrollRef.current;
        if (!saved) return;

        const container = scrollContainerRef.current;
        const viewport = container?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;

        if (!viewport) return;

        const newTop = viewport.scrollHeight - saved.height + saved.top;
        viewport.scrollTo({ top: newTop, behavior: "auto" });
        prependScrollRef.current = null;
    }, [messages]);

    const loadChat = useCallback(async () => {
        if (!classroomId || userRole !== "student") return;

        setIsLoading(true);
        try {
            const roomResponse = await ChatService.getClassroomChatroom(classroomId);
            if (roomResponse.error || !roomResponse.data) {
                if (roomResponse.statusCode === 403) {
                    moveToDashboard();
                    return;
                }
                throw new Error(roomResponse.error || "Could not load chatroom");
            }

            const nextRoom = roomResponse.data;
            setRoom(nextRoom);

            const [messagesResponse, participantsResponse] = await Promise.all([
                ChatService.getChatMessages(nextRoom.id, { limit: 30 }),
                ChatService.getChatParticipants(nextRoom.id),
            ]);

            if (messagesResponse.error) {
                if (messagesResponse.statusCode === 403) {
                    moveToDashboard();
                    return;
                }
                throw new Error(messagesResponse.error);
            }

            if (participantsResponse.error) {
                if (participantsResponse.statusCode === 403) {
                    moveToDashboard();
                    return;
                }
                throw new Error(participantsResponse.error);
            }

            const page = messagesResponse.data;
            setMessages(page?.messages || []);
            setHasMore(Boolean(page?.hasMore));
            setCursor(page?.nextCursor || null);
            setParticipants(participantsResponse.data);

            setTimeout(() => scrollToBottom(false), 0);
        } catch (error) {
            toast({
                title: "Failed to load classroom chat",
                description: String(error),
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [classroomId, moveToDashboard, scrollToBottom, userRole]);

    const handleSendMessage = useCallback(() => {
        if (!room?.id || !messageInput.trim()) return;

        const socket = getGlobalSocket(token);
        socket.emit("send_message", {
            roomId: room.id,
            content: messageInput.trim(),
        });
        setMessageInput("");
    }, [messageInput, room?.id, token]);

    useEffect(() => {
        if (userRole !== "student") return;
        loadChat();
    }, [loadChat, userRole]);

    useEffect(() => {
        if (!room?.id || userRole !== "student") return;

        const socket = getGlobalSocket(token);
        if (!socket.connected) {
            socket.connect();
        }

        const onConnect = () => {
            socket.emit("join_room", room.id);
        };

        const onReconnect = () => {
            socket.emit("join_room", room.id);
        };

        const onReceiveMessage = (message: IChatMessage) => {
            if (message.roomId !== room.id) return;
            setMessages((prev) => appendUniqueMessages(prev, [message]));
            setTimeout(() => scrollToBottom(), 0);
        };

        const onRemoved = (payload: { classroomId?: string }) => {
            if (!payload?.classroomId || payload.classroomId === classroomId) {
                moveToDashboard();
            }
        };

        socket.on("connect", onConnect);
        socket.on("reconnect", onReconnect);
        socket.on("receive_message", onReceiveMessage);
        socket.on("removed_from_classroom", onRemoved);

        if (socket.connected) {
            socket.emit("join_room", room.id);
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("reconnect", onReconnect);
            socket.off("receive_message", onReceiveMessage);
            socket.off("removed_from_classroom", onRemoved);
        };
    }, [appendUniqueMessages, classroomId, moveToDashboard, room?.id, scrollToBottom, token, userRole]);

    if (userRole !== "student") {
        return (
            <Card className="p-12 text-center">
                <div className="space-y-4">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Student Chat Only</h3>
                        <p className="text-muted-foreground">
                            Teachers use announcements and doubt responses in this classroom.
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card className="p-6 text-muted-foreground">
                Loading classroom chat...
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-[calc(83vh-4rem)] rounded-xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <div>
                    <p className="font-semibold">Classroom Chat</p>
                    <p className="text-xs text-muted-foreground">{participants.length} participants</p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ClassroomChatMessageList
                    messages={messages}
                    currentUserId={userId}
                    participantsMap={participantsMap}
                    hasMore={hasMore}
                    isLoadingOlder={isLoadingOlder}
                    onLoadOlder={loadOlderMessages}
                    scrollContainerRef={scrollContainerRef}
                />
            </div>

            <ClassroomChatComposer
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSendMessage}
            />
        </Card>
    );
}

export default ClassroomChat;
