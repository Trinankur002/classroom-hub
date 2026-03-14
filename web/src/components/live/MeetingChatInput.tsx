import { FormEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MeetingChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => Promise<void> | void;
  disabled?: boolean;
}

export function MeetingChatInput({ value, onChange, onSend, disabled }: MeetingChatInputProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    await onSend();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border/70 p-3">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Send a message to everyone"
        maxLength={2000}
        disabled={disabled}
      />
      <Button type="submit" size="icon" disabled={disabled || !value.trim()}>
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </form>
  );
}
