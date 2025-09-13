import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, Send, Paperclip, X } from "lucide-react";
import { IDoubt, IDoubtClearMessages } from "@/types/doubts";
import DoubtService from "@/services/doubtService";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
    doubt: IDoubt;
    onClose?: () => void; // used by mobile to go back to list
    onDoubtUpdated?: (doubt: IDoubt) => void; // Prop to notify parent of an update
}

function DoubtChat({ doubt, onClose, onDoubtUpdated }: Props) {
    const [messages, setMessages] = useState<IDoubtClearMessages[]>(doubt?.messages || []);
    const [isLoading, setIsLoading] = useState(false);
    const [text, setText] = useState("");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        if (!doubt?.id) return;
        try {
            setIsLoading(true);
            const { data, error } = await DoubtService.getDoubtMessages(doubt.id);
            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            toast({
                title: "Failed to load messages",
                description: String(err),
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setMessages(doubt?.messages || []);
        fetchMessages();
    }, [doubt?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() && !file) return;

        try {
            const payload = { doubtId: doubt.id, message: text.trim() };
            const { data, error } = await DoubtService.createDoubtMessage(payload, file);

            if (error || !data) {
                throw new Error(error || "Failed to send message. No data returned.");
            }

            setMessages(data.messages || []);
            onDoubtUpdated?.(data);

            setText("");
            setFile(null);
        } catch (err) {
            toast({
                title: "Failed to send message",
                description: String(err),
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] sm:h-[85vh] w-full bg-card">
            {/* Header */}
            <div className="flex items-center px-4 py-3 border-b flex-shrink-0">
                {onClose && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden mr-2"
                        onClick={onClose}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <div className="min-w-0">
                    <p className="font-semibold truncate">{doubt?.student?.name || "Student"}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                        {doubt?.doubtDescribtion}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {isLoading ? (
                    <div className="text-center text-muted-foreground mt-8">
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                        No messages yet.
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex items-end gap-2 ${msg.sender?.id !== user.id ? "justify-start" : "justify-end"
                                    }`}
                            >
                                <div
                                    className={`rounded-lg px-3 py-2 max-w-[85%] sm:max-w-[70%] ${msg.sender?.id !== user.id
                                            ? "bg-muted text-muted-foreground"
                                            : "bg-primary text-primary-foreground"
                                        }`}
                                >
                                    <p className="text-sm break-words">{msg.message}</p>
                                    {msg.file && (
                                        <img
                                            src={msg.file.url}
                                            alt="Attached file"
                                            className="mt-2 rounded-md max-w-full h-auto"
                                        />
                                    )}
                                    <p className="text-[10px] text-right opacity-70 mt-1">
                                        {new Date(msg.time).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="border-t p-2 flex-shrink-0">
                {file && (
                    <div className="px-2 py-1 text-xs text-muted-foreground flex justify-between items-center">
                        <span className="truncate">{file.name}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setFile(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleFileSelect}
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message or attach a file"
                        className="flex-1"
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );

}
export default DoubtChat;