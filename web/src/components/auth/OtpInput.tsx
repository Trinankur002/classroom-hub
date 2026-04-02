import { useMemo, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  length?: number;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function OtpInput({
  value,
  length = 6,
  onChange,
  disabled = false,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const normalizedValue = useMemo(() => {
    return value.replace(/\D/g, "").slice(0, length);
  }, [value, length]);

  const chars = useMemo(() => {
    return Array.from({ length }, (_, index) => normalizedValue[index] ?? "");
  }, [length, normalizedValue]);

  const focusInput = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[boundedIndex]?.focus();
    inputRefs.current[boundedIndex]?.select();
  };

  const handleInputChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);

    const nextChars = [...chars];
    nextChars[index] = digit;

    const nextValue = nextChars.join("");
    onChange(nextValue);

    if (digit && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      if (chars[index]) {
        const nextChars = [...chars];
        nextChars[index] = "";
        onChange(nextChars.join(""));
        return;
      }

      if (index > 0) {
        const nextChars = [...chars];
        nextChars[index - 1] = "";
        onChange(nextChars.join(""));
        focusInput(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusInput(index + 1);
      return;
    }

    if (event.key === " " || event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

    if (!pasted) {
      return;
    }

    onChange(pasted);

    const nextFocus = Math.min(pasted.length, length - 1);
    focusInput(nextFocus);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {chars.map((char, index) => (
        <Input
          key={index}
          ref={(node) => {
            inputRefs.current[index] = node;
          }}
          value={char}
          onChange={(event) => handleInputChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          className="h-11 w-11 text-center text-base font-semibold"
        />
      ))}
    </div>
  );
}
