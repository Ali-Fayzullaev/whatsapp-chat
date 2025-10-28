// src/components/chat/Composer.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, Mic, Smile } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { ReplyMessage } from "./types";

const EMOJI_LIST = [
  "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😍", "😘", "🥰", "😗", 
  "😙", "😚", "🙂", "🤗", "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", 
  "🤐", "😯", "😪", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", 
  "😲", "☹️", "🙁", "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", 
  "😰", "😱", "🥵", "🥶", "😳", "🤪", "😵", "😡", "😠", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", 
  "🤧", "😇", "🤠", "🥳", "🥺", "🤡", "🤥", "🤫", "🤭", "🧐", "🤓", "😈", "👿", "👻", "👽", 
  "🤖", "💩", "👍", "👎", "🙏", "👏", "🙌", "💪", "🤝", "❤️", "🧡", "💛", "💚", "💙", "💜", 
  "🤎", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💖", "💗", "💘", "💝", "✨", "⭐", "🌟", "🔥", "🌈",
];

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
  placeholder = "Введите сообщение",
  replyingTo,
  onCancelReply,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = draft.slice(0, start) + emoji + draft.slice(end);
      setDraft(newText);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setDraft(draft + emoji);
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
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Баннер ответа в стиле WhatsApp */}
      {replyingTo && (
        <div className="flex items-center justify-between mb-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-green-500">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Ответ на {replyingTo.author === "me" ? "ваше" : "сообщение"}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {replyingTo.media ? (
                <span className="flex items-center gap-2">
                  {replyingTo.media.type === "image" && "🖼️ Изображение"}
                  {replyingTo.media.type === "video" && "🎥 Видео"}
                  {replyingTo.media.type === "audio" && "🎵 Аудио"}
                  {replyingTo.media.type === "document" && "📎 Документ"}
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
            className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-end gap-2">
        {/* Кнопка эмодзи */}
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex-shrink-0"
              disabled={disabled}
            >
              <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-4 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-2xl"
            align="start"
            side="top"
          >
            <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
              {EMOJI_LIST.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleEmojiSelect(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Кнопка прикрепления файла */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex-shrink-0"
        >
          <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
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
            className="min-h-[36px] sm:min-h-[44px] max-h-[100px] sm:max-h-[120px] py-2 sm:py-3 px-3 sm:px-4 resize-none rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-700 border-0 focus-visible:ring-2 focus-visible:ring-green-500 pr-10 sm:pr-12 text-sm sm:text-base"
            rows={1}
          />
        </div>

        {/* Кнопка отправки/микрофона */}
        <Button
          onClick={draft.trim() ? handleSubmit : () => console.log("Start recording...")}
          disabled={disabled}
          size="icon"
          className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0 transition-all ${
            draft.trim() 
              ? "bg-green-500 hover:bg-green-600 text-white" 
              : "bg-gray-300 dark:bg-gray-600 text-gray-500 hover:bg-gray-400 dark:hover:bg-gray-500"
          }`}
        >
          {draft.trim() ? (
            <Send className="h-3 w-3 sm:h-5 sm:w-5" />
          ) : (
            <Mic className="h-3 w-3 sm:h-5 sm:w-5" />
          )}
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
    </div>
  );
}