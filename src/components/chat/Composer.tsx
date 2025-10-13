"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Paperclip, Send, X, Image, File, Video } from "lucide-react";
import { useState, useRef } from "react";
import { MediaFile } from "./types";

export function Composer({
  draft,
  setDraft,
  onSend,
  onSendMedia,
  disabled,
  placeholder,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  onSendMedia?: (
    file: File,
    type: "image" | "video" | "document" | "audio"
  ) => void; // 🔹 ОБНОВЛЕННЫЙ ТИП
  disabled?: boolean;
  placeholder?: string;
}) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mediaFiles.length > 0) {
        // 🔹 ИСПРАВЛЕНО: передаем оба параметра
        mediaFiles.forEach((media) => {
          onSendMedia?.(media.file, media.type);
        });
        setMediaFiles([]);
      } else {
        onSend();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMediaFiles: MediaFile[] = [];

    Array.from(files).forEach((file) => {
      const type = getFileType(file.type);
      const mediaFile: MediaFile = {
        file,
        type,
        previewUrl: type === "image" ? URL.createObjectURL(file) : undefined,
      };
      newMediaFiles.push(mediaFile);
    });

    setMediaFiles((prev) => [...prev, ...newMediaFiles]);
    e.target.value = "";
  };

  // 🔹 ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОПРЕДЕЛЕНИЯ ТИПА ФАЙЛА
  const getFileType = (
    mimeType: string
  ): "image" | "video" | "document" | "audio" => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "document";
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].previewUrl) {
        URL.revokeObjectURL(newFiles[index].previewUrl!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSendClick = () => {
    if (mediaFiles.length > 0) {
      // 🔹 ПЕРЕДАЕМ ОБА ПАРАМЕТРА
      mediaFiles.forEach((media) => {
        onSendMedia?.(media.file, media.type);
      });
      setMediaFiles([]);
    } else {
      onSend();
    }
  };

  const canSend = !disabled && (!!draft.trim() || mediaFiles.length > 0);

  return (
    <div className="p-4 border-t bg-white">
      {/* Превью медиафайлов */}
      {mediaFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {mediaFiles.map((media, index) => (
            <div key={index} className="relative group">
              {media.type === "image" && media.previewUrl ? (
                <div className="w-16 h-16 rounded-lg border overflow-hidden">
                  <img
                    src={media.previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-muted">
                  {media.type === "video" && <Video className="h-6 w-6" />}
                  {media.type === "audio" && <File className="h-6 w-6" />}
                  {media.type === "document" && <File className="h-6 w-6" />}
                </div>
              )}
              <button
                type="button"
                onClick={() => removeMediaFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="text-xs mt-1 truncate max-w-16">
                {media.file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              aria-label="Прикрепить файл"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
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
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleSendClick}
              size="icon"
              className="rounded-full flex-shrink-0 bg-blue-500 hover:bg-blue-600"
              aria-label="Отправить сообщение"
              disabled={!canSend}
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
