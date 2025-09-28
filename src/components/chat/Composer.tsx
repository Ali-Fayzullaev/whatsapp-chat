// src/components/chat/Composer.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Paperclip, Send } from "lucide-react";

export function Composer({
  draft,
  setDraft,
  onSend,
  disabled,
  placeholder,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (disabled) return;                        // ← блокируем хоткей, если нельзя
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = !disabled && !!draft.trim();

  return (
    <div className="p-4 border-t bg-white">
      <div className="flex items-end gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              aria-label="Вложить файл"
              disabled={disabled}
              title={disabled ? "Сначала выберите чат" : undefined}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Прикрепить файл</TooltipContent>
        </Tooltip>

        <Input
          placeholder={placeholder ?? "Введите сообщение..."}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 rounded-2xl min-h-[44px] resize-none"
          disabled={disabled}
          autoFocus={!disabled}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onSend}
              size="icon"
              className="rounded-full flex-shrink-0 bg-blue-500 hover:bg-blue-600"
              aria-label="Отправить сообщение"
              disabled={!canSend}
              title={disabled ? "Сначала выберите чат" : undefined}
            >
              <Send className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Отправить</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
