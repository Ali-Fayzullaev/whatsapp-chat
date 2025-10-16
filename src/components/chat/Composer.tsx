// src/components/chat/Composer.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, Mic } from "lucide-react";
import { useRef, useEffect } from "react";
import type { ReplyMessage } from "./types";

interface ComposerProps {
  draft: string;
  setDraft: (draft: string) => void;
  onSend: (text: string, replyTo?: ReplyMessage) => void;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
  replyingTo?: ReplyMessage | null;
  onCancelReply?: () => void;
}

export function Composer({
  draft,
  setDraft,
  onSend,
  onFileSelect,
  disabled,
  placeholder = "Сообщение...",
  replyingTo,
  onCancelReply,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text) return;

    onSend(text, replyingTo || undefined);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  return (
    <div className="p-4 border-t bg-white dark:bg-gray-900">
      {/* 🔹 Telegram Style: Баннер ответа */}
      {replyingTo && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Ответ на {replyingTo.author === "me" ? "ваше" : "сообщение"}
                </span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {replyingTo.media ? (
                  <span className="flex items-center gap-1">
                    {replyingTo.media.type === 'image' && '🖼️ Изображение'}
                    {replyingTo.media.type === 'video' && '🎥 Видео'}
                    {replyingTo.media.type === 'audio' && '🎵 Аудио'}
                    {replyingTo.media.type === 'document' && '📎 Документ'}
                    {replyingTo.media.name && ` • ${replyingTo.media.name}`}
                  </span>
                ) : (
                  replyingTo.text
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={onCancelReply}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Кнопка прикрепления файла */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 text-gray-500 hover:text-blue-500"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Поле ввода */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] flex justify-start items-center max-h-[120px] py-3 resize-none rounded-2xl pr-12 bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
            rows={1}
          />
        </div>

        {/* Кнопка отправки/микрофона */}
        <Button
          onClick={draft.trim() ? handleSubmit : () => console.log('Start recording...')}
          disabled={disabled}
          size="icon"
          className={`flex-shrink-0 rounded-full ${
            draft.trim() 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {draft.trim() ? <Send className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        {/* Скрытый input для файлов */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple={false}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  );
}