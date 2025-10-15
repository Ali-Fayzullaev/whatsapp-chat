// src/components/chat/MessageBubble.tsx
"use client";
import { Check, CheckCheck, Download, Image, File, Video, Mic2Icon } from "lucide-react";
import type { Message } from "./types";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.author === "me";
  const [imageError, setImageError] = useState(false);
  
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  // 🔹 Функция для определения типа файла по расширению или MIME типу
  const getFileTypeFromUrl = (url: string, mimeType?: string): string => {
    if (mimeType) {
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('audio/')) return 'audio';
    }
    
    // Определяем по расширению файла
    const extension = url.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
    
    if (imageExtensions.includes(extension || '')) return 'image';
    if (videoExtensions.includes(extension || '')) return 'video';
    if (audioExtensions.includes(extension || '')) return 'audio';
    
    return 'document';
  };

  // 🔹 Функция для получения красивого имени файла
  const getDisplayFileName = (url: string, originalName?: string): string => {
    if (originalName && originalName !== url) {
      return originalName;
    }
    
    // Если имя файла - это UUID, показываем тип файла
    const fileName = url.split('/').pop() || '';
    const fileType = getFileTypeFromUrl(url, msg.media?.mime);
    
    if (fileName.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.\w+$/)) {
      const extension = fileName.split('.').pop()?.toUpperCase();
      return `Файл.${extension}`;
    }
    
    return fileName || 'Файл';
  };

  const renderMedia = () => {
    if (!msg.media) return null;

    // 🔹 Определяем тип медиа на основе URL и MIME типа
    const mediaType = msg.media.type || getFileTypeFromUrl(msg.media.url, msg.media.mime);
    const displayFileName = getDisplayFileName(msg.media.url, msg.media.name);

    switch (mediaType) {
      case 'image':
        return (
          <div className="mb-2 rounded-lg overflow-hidden max-w-[280px]">
            {!imageError ? (
              <img 
                src={msg.media.url} 
                alt={displayFileName}
                className="w-full h-auto object-cover max-h-[300px]"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-muted text-muted-foreground">
                <Image className="h-8 w-8 mb-2" />
                <div className="text-sm text-center">
                  <div className="font-medium">{displayFileName}</div>
                  <div className="text-xs mt-1">Не удалось загрузить изображение</div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="mb-2 rounded-lg overflow-hidden max-w-[280px]">
            <div className="relative">
              <video 
                controls 
                className="w-full h-auto max-h-[300px]"
                poster="/video-poster.jpg" // можно добавить стандартный poster
              >
                <source src={msg.media.url} type={msg.media.mime} />
                Ваш браузер не поддерживает видео.
              </video>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                <Video className="h-3 w-3 inline mr-1" />
                Видео
              </div>
            </div>
          </div>
        );
      
      case 'audio':
        return (
          <div className="mb-2 p-3 bg-muted rounded-lg max-w-[280px]">
            <div className="flex items-center gap-3 mb-2">
              <Mic2Icon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {displayFileName}
                </div>
              </div>
            </div>
            <audio controls className="w-full">
              <source src={msg.media.url} type={msg.media.mime} />
              Ваш браузер не поддерживает аудио.
            </audio>
          </div>
        );
      
      case 'document':
      default:
        return (
          <div className="mb-2 flex items-center gap-3 p-3 bg-muted rounded-lg max-w-[280px]">
            <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {displayFileName}
              </div>
              {msg.media.size && (
                <div className="text-xs text-muted-foreground">
                  {(msg.media.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
              {msg.media.mime && (
                <div className="text-xs text-muted-foreground capitalize">
                  {msg.media.mime.split('/')[1]} файл
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(msg.media!.url, displayFileName)}
              className="flex-shrink-0"
              title="Скачать файл"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
    }
  };

  // 🔹 Определяем, является ли сообщение только медиа-файлом
  const isMediaOnly = msg.media && (
    msg.text === "📷 Изображение" ||
    msg.text === "🎥 Видео" || 
    msg.text === "🎵 Аудио" ||
    msg.text === "📄 Документ" ||
    msg.text.includes("📎 Файл")
  );

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={[
          "relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
          isMe
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-white text-gray-900 rounded-bl-md border border-gray-200",
        ].join(" ")}
      >
        {renderMedia()}
        
        {/* 🔹 Показываем текст только если это не стандартное описание медиа */}
        {!isMediaOnly && (
          <div className="whitespace-pre-wrap break-words pr-12">
            {msg.text}
          </div>
        )}
        
        <div
          className={`absolute bottom-2 right-3 flex items-center gap-1 text-xs ${
            isMe ? "text-blue-100" : "text-gray-500"
          }`}
        >
          <span>{msg.time}</span>
          {isMe &&
            (msg.status === "read" ? (
              <CheckCheck className="h-3 w-3" />
            ) : msg.status === "delivered" ? (
              <CheckCheck className="h-3 w-3 opacity-75" />
            ) : msg.status === "failed" ? (
              <span className="text-red-300">⚠️</span>
            ) : (
              <Check className="h-3 w-3" />
            ))}
        </div>
      </div>
    </div>
  );
}