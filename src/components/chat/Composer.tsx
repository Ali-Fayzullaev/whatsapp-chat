"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Paperclip, Send, X, Image as ImageIcon, File, Video } from "lucide-react";
import { useState, useRef } from "react";

interface MediaFile {
  file: File;
  type: "image" | "video" | "document" | "audio";
  previewUrl?: string;
}

export function Composer({
  draft,
  setDraft,
  onSend,
  onFileSelect, // 🔹 ИЗМЕНЕНО: передаем напрямую файл
  disabled,
  placeholder,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  onFileSelect?: (file: File) => void; // 🔹 УПРОЩЕНО
  disabled?: boolean;
  placeholder?: string;
}) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log("Files selected:", files.length);

    const newMediaFiles: MediaFile[] = [];

    Array.from(files).forEach((file) => {
      console.log("Processing file:", file.name, file.type, file.size);
      
      const type = getFileType(file.type);
      const mediaFile: MediaFile = {
        file,
        type,
        previewUrl: type === "image" ? URL.createObjectURL(file) : undefined,
      };
      newMediaFiles.push(mediaFile);
    });

    setMediaFiles((prev) => [...prev, ...newMediaFiles]);
    e.target.value = ""; // Очищаем input
  };

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

 // В Composer компоненте исправьте функцию handleSendClick:
const handleSendClick = async () => {
  if (disabled) return;

  // Отправляем медиа-файлы
  if (mediaFiles.length > 0) {
    console.log("Sending media files:", mediaFiles.length);
    
    for (const media of mediaFiles) {
      try {
        console.log("Sending file:", media.file.name);
        await onFileSelect?.(media.file);
      } catch (error) {
        console.error("Failed to send file:", media.file.name, error);
        // Можно добавить уведомление об ошибке
      }
    }
    
    // Очищаем превью и файлы после отправки
    mediaFiles.forEach(media => {
      if (media.previewUrl) {
        URL.revokeObjectURL(media.previewUrl);
      }
    });
    setMediaFiles([]);
  } 
  
  // Отправляем текстовое сообщение
  if (draft.trim()) {
    onSend();
    setDraft(""); // Очищаем поле ввода
  }
};

  const canSend = !disabled && (!!draft.trim() || mediaFiles.length > 0);

  return (
    <div className="p-4 border-t bg-white dark:bg-muted">
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