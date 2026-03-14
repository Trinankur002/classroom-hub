import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { LiveSessionApi } from "@/services/live-session.api";
import { liveSessionSocketService } from "@/services/live-session.socket.service";
import { WEBSOCKET_EVENTS } from "@/constants/websocketEvents";
import { LiveSessionMessage } from "@/types/live-session";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { MeetingChatMessage } from "./MeetingChatMessage";
import { MeetingChatInput } from "./MeetingChatInput";

interface MeetingChatPanelProps {
  sessionId: string;
}

export function MeetingChatPanel({ sessionId }: MeetingChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LiveSessionMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const appendMessage = useCallback((nextMessage: LiveSessionMessage) => {
    setMessages((current) => {
      if (current.some((item) => item.id === nextMessage.id)) {
        return current;
      }
      return [...current, nextMessage];
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = listRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadMessages = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await LiveSessionApi.getMessages(sessionId);
        if (!mounted) return;
        setMessages(data || []);
      } catch (error) {
        if (!mounted) return;
        setLoadError("Failed to load meeting chat.");
        toast({
          title: "Meeting chat unavailable",
          description: String(error),
          variant: "destructive",
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadMessages();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    const onLiveMessage = (payload: Record<string, unknown>) => {
      if (String(payload?.liveSessionId || "") !== sessionId) return;
      appendMessage(payload as LiveSessionMessage);
    };

    liveSessionSocketService.on(WEBSOCKET_EVENTS.LIVE_CHAT_MESSAGE, onLiveMessage);
    return () => {
      liveSessionSocketService.off(WEBSOCKET_EVENTS.LIVE_CHAT_MESSAGE, onLiveMessage);
    };
  }, [appendMessage, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const content = messageInput.trim();
    if (!content || isSending) return;

    setIsSending(true);
    try {
      await LiveSessionApi.sendMessage(sessionId, content);
      setMessageInput("");
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [isSending, messageInput, sessionId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/70 px-4 py-3">
        <p className="text-sm font-semibold">Meeting chat</p>
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading messages...</p>}
        {!isLoading && loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {!isLoading && !loadError && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <MessageCircle className="h-8 w-8" />
            <p className="mt-2 text-sm">No messages yet</p>
          </div>
        )}
        {!isLoading && messages.map((message) => (
          <MeetingChatMessage
            key={message.id}
            message={message}
            isOwn={message.senderId === user?.id}
          />
        ))}
      </div>

      <MeetingChatInput
        value={messageInput}
        onChange={setMessageInput}
        onSend={handleSend}
        disabled={isSending}
      />
    </div>
  );
}
