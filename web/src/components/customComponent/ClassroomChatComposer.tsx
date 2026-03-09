import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AtSign, Paperclip, Send, X } from "lucide-react";
import { IChatParticipant } from "@/types/chat";
import { useRef } from "react";

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void | Promise<void>;
    disabled?: boolean;
    participants: IChatParticipant[];
    mentionedUserId?: string;
    onMentionChange: (userId?: string) => void;
    files: File[];
    onFilesChange: (files: File[]) => void;
}

function ClassroomChatComposer({
    value,
    onChange,
    onSend,
    disabled,
    participants,
    mentionedUserId,
    onMentionChange,
    files,
    onFilesChange,
}: Props) {
    const canSend = (value.trim().length > 0 || files.length > 0) && !disabled;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mentionedUser = participants.find((p) => p.userId === mentionedUserId);

    const getInitials = (name?: string) =>
        (name ? name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() : "U");

    return (
        <div className="border-t p-3 bg-card rounded-b-xl">
            <div className="space-y-2">
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {files.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="flex items-center px-2 py-1 rounded-md border text-xs bg-muted">
                                <span className="truncate max-w-[160px]">{file.name}</span>
                                <button
                                    type="button"
                                    className="ml-2 text-muted-foreground hover:text-destructive"
                                    onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        onChange={(e) => {
                            const selected = e.target.files ? Array.from(e.target.files) : [];
                            if (selected.length) onFilesChange([...files, ...selected]);
                            e.currentTarget.value = "";
                        }}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                                <AtSign className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64" align="start">
                            <DropdownMenuLabel>Mention someone</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {participants.map((participant) => (
                                <DropdownMenuItem
                                    key={participant.id}
                                    onSelect={() => onMentionChange(participant.userId)}
                                    className="cursor-pointer"
                                >
                                    <Avatar className="h-6 w-6 mr-2">
                                        <AvatarImage src={participant.user?.avatarUrl || undefined} alt={participant.user?.name} />
                                        <AvatarFallback className="text-xs">{getInitials(participant.user?.name)}</AvatarFallback>
                                    </Avatar>
                                    <span>{participant.user?.name || "Student"}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {mentionedUser && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                            <span className="text-xs">@{mentionedUser.user?.name}</span>
                            <button type="button" onClick={() => onMentionChange(undefined)}>
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                    placeholder="Type a message"
                    autoComplete="off"
                    className="flex-1"
                />
                <Button onClick={onSend} disabled={!canSend} size="sm">
                    Send
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default ClassroomChatComposer;
