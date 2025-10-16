// src/components/chat/Composer.tsx
"use client";

import { Button } from "@/components/ui/button";
// Мы будем стилизовать Textarea, чтобы оно выглядело как стандартное поле ввода WhatsApp
import { Textarea } from "@/components/ui/textarea"; 
import { Paperclip, Send, X, Reply, Mic2Icon } from "lucide-react"; // Добавим Mic2Icon
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
  placeholder = "Введите сообщение...",
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
      e.target.value = ""; // Сбрасываем input
    }
  };

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const hasText = draft.trim().length > 0;

  return (
    // 💬 WhatsApp Style: Отступы внизу, граница сверху
    <div className="p-2 border-t border-gray-100 bg-white dark:bg-gray-900">
      
      {/* 💬 WhatsApp Style: Баннер ответа на сообщение - более мягкий дизайн */}
      {replyingTo && (
        <div className="mx-2 mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl border-l-4 border-green-500">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                {replyingTo.author === "me" ? "Ваш" : "Ответ на сообщение"}
              </span>
              <div className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-full">
                {replyingTo.media ? (
                  <span className="flex items-center gap-1">
                    <Reply className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    {replyingTo.media.type === 'image' && '📷 Изображение'}
                    {replyingTo.media.type === 'video' && '🎥 Видео'}
                    {replyingTo.media.type === 'audio' && '🎵 Аудио'}
                    {replyingTo.media.type === 'document' && '📄 Документ'}
                    {replyingTo.media.name && ` • ${replyingTo.media.name}`}
                  </span>
                ) : (
                  <span className="line-clamp-1">{replyingTo.text}</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0 ml-2 text-gray-500 hover:bg-gray-200"
              onClick={onCancelReply}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 💬 WhatsApp Style: Основная строка ввода */}
      <div className="flex items-end gap-2">
        
        {/* Обертка для поля ввода и кнопки вложения */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            // 💬 WhatsApp Style: Закругленное, светло-серое поле
            className={`
              min-h-[44px] max-h-[120px] resize-none 
              py-3 pl-4 pr-12 text-base 
              rounded-3xl border-none shadow-sm 
              bg-gray-100 dark:bg-gray-800 focus-visible:ring-0
            `}
          />
          
          {/* Кнопка прикрепления файла - позиционируем внутри Textarea */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            // 💬 WhatsApp Style: Позиционируем справа от текста
            className="absolute right-1 bottom-1 h-10 w-10 text-gray-500 hover:bg-transparent"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </div>

        {/* 💬 WhatsApp Style: Кнопка отправки / микрофона */}
        <Button
          onClick={hasText ? handleSubmit : () => console.log('Record audio...')} // Если есть текст, отправляем, иначе - записываем
          disabled={disabled}
          size="icon"
          // 💬 WhatsApp Style: Круглая, зеленая, большая кнопка
          className={`
            h-11 w-11 rounded-full flex-shrink-0 
            ${hasText 
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-md' 
              : 'bg-green-500 hover:bg-green-600 text-white shadow-md' // В WhatsApp всегда зеленая
            }
          `}
        >
          {hasText ? <Send className="h-5 w-5 -ml-px" /> : <Mic2Icon className="h-5 w-5" />}
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