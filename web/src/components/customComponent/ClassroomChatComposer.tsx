import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    disabled?: boolean;
}

function ClassroomChatComposer({ value, onChange, onSend, disabled }: Props) {
    const canSend = value.trim().length > 0 && !disabled;

    return (
        <div className="border-t p-3 bg-card rounded-b-xl">
            <div className="flex items-center gap-2">
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
