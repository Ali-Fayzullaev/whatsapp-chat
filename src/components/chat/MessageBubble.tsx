// src/components/chat/MessageBubble.tsx
"use client";
import { 
  Check, 
  CheckCheck, 
  Download, 
  Image, 
  File, 
  Video, 
  Mic2Icon,
  Reply,
  MoreHorizontal
} from "lucide-react";
import type { Message } from "./types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageBubbleProps {
  msg: Message;
  onReply?: (message: Message) => void;
  isReplying?: boolean;
}

export function MessageBubble({ msg, onReply, isReplying }: MessageBubbleProps) {
  const isMe = msg.author === "me";
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const handleReply = () => {
    if (onReply) {
      onReply(msg);
    }
    setShowMenu(false);
  };

  // 🔹 Telegram Style: Рендеринг сообщения, на которое отвечают
  const renderReply = () => {
    if (!msg.replyTo) return null;

    return (
      <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {msg.replyTo.author === "me" ? "Вы" : "Сообщение"}
          </span>
        </div>
        
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {msg.replyTo.media ? (
            <div className="flex items-center gap-1">
              {msg.replyTo.media.type === 'image' && <Image className="h-3 w-3" />}
              {msg.replyTo.media.type === 'video' && <Video className="h-3 w-3" />}
              {msg.replyTo.media.type === 'audio' && <Mic2Icon className="h-3 w-3" />}
              {msg.replyTo.media.type === 'document' && <File className="h-3 w-3" />}
              <span>
                {msg.replyTo.media.name || 
                 (msg.replyTo.media.type === 'image' ? 'Изображение' :
                  msg.replyTo.media.type === 'video' ? 'Видео' :
                  msg.replyTo.media.type === 'audio' ? 'Аудио' : 'Документ')}
              </span>
            </div>
          ) : (
            msg.replyTo.text
          )}
        </div>
      </div>
    );
  };

  // 🔹 Функции для определения типа файла
  const getFileTypeFromMessage = (msg: Message): string => {
    if (msg.media?.type) return msg.media.type;
    if (msg.media?.mime) {
      if (msg.media.mime.startsWith('image/')) return 'image';
      if (msg.media.mime.startsWith('video/')) return 'video';
      if (msg.media.mime.startsWith('audio/')) return 'audio';
    }
    
    const fileName = msg.media?.name || msg.media?.url || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
    
    if (imageExtensions.includes(extension || '')) return 'image';
    if (videoExtensions.includes(extension || '')) return 'video';
    if (audioExtensions.includes(extension || '')) return 'audio';
    
    return 'document';
  };

  const getDisplayFileName = (): string => {
    if (msg.media?.name && msg.media.name !== msg.media.url) {
      return msg.media.name;
    }
    
    const fileName = msg.media?.url?.split('/').pop() || '';
    const fileType = getFileTypeFromMessage(msg);
    
    if (fileName.match(/^[a-f0-9-]+\.\w+$/i)) {
      const extension = fileName.split('.').pop()?.toUpperCase();
      switch (fileType) {
        case 'image': return `Изображение.${extension}`;
        case 'video': return `Видео.${extension}`;
        case 'audio': return `Аудио.${extension}`;
        default: return `Файл.${extension}`;
      }
    }
    
    return fileName || 'Файл';
  };

  const renderMedia = () => {
    if (!msg.media) return null;

    const mediaType = getFileTypeFromMessage(msg);
    const displayFileName = getDisplayFileName();

    switch (mediaType) {
      case 'image':
        return (
          <div className="mb-3 rounded-lg overflow-hidden">
            {!imageError ? (
              <img 
                src={msg.media.url} 
                alt={displayFileName}
                className="w-full h-auto max-w-md object-cover cursor-pointer"
                onError={() => setImageError(true)}
                loading="lazy"
                onClick={() => window.open(msg.media!.url, '_blank')}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Image className="h-8 w-8 mb-2 text-gray-400" />
                <div className="text-sm text-center text-gray-500">
                  <div className="font-medium">{displayFileName}</div>
                  <div className="text-xs mt-1">Не удалось загрузить изображение</div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="mb-3 rounded-lg overflow-hidden">
            <video 
              controls 
              className="w-full h-auto max-w-md rounded-lg"
              preload="metadata"
            >
              <source src={msg.media.url} type={msg.media.mime} />
              Ваш браузер не поддерживает видео.
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className="mb-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-full">
                <Mic2Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
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
        const fileName = msg.media.name || msg.media.url;
        const isActuallyImage = fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || 
                               msg.media.mime?.startsWith('image/');
        
        if (isActuallyImage) {
          return (
            <div className="mb-3 rounded-lg overflow-hidden">
              {!imageError ? (
                <img 
                  src={msg.media.url} 
                  alt={displayFileName}
                  className="w-full h-auto max-w-md object-cover cursor-pointer"
                  onError={() => setImageError(true)}
                  loading="lazy"
                  onClick={() => window.open(msg.media!.url, '_blank')}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Image className="h-8 w-8 mb-2 text-gray-400" />
                  <div className="text-sm text-center text-gray-500">
                    <div className="font-medium">{displayFileName}</div>
                    <div className="text-xs mt-1">Не удалось загрузить изображение</div>
                  </div>
                </div>
              )}
            </div>
          );
        }
        
        return (
          <div className="mb-3 flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-md">
            <div className="p-3 bg-blue-500 rounded-lg">
              <File className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm mb-1">
                {displayFileName}
              </div>
              {msg.media.size && (
                <div className="text-xs text-gray-500">
                  {(msg.media.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(msg.media!.url, displayFileName)}
              className="flex-shrink-0 text-gray-500 hover:text-blue-500"
              title="Скачать файл"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
    }
  };

  // 🔹 Определяем, является ли сообщение только медиа-файлом
  const isMediaOnly = msg.media && !msg.text;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-4 group`}>
      <div
        className={[
          "relative max-w-[70%] rounded-2xl px-4 py-3",
          isMe
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700",
        ].join(" ")}
      >
        {/* 🔹 Telegram Style: Меню с тремя точками */}
        <div className="absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${
                  isMe 
                    ? 'text-blue-100 hover:text-white hover:bg-blue-600' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMe ? "end" : "start"}>
              <DropdownMenuItem onClick={handleReply}>
                <Reply className="h-4 w-4 mr-2" />
                Ответить
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(msg.text)}>
                <File className="h-4 w-4 mr-2" />
                Копировать текст
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 🔹 Сообщение, на которое отвечаем */}
        {renderReply()}
        
        {/* 🔹 Медиа */}
        {renderMedia()}
        
        {/* 🔹 Текст сообщения */}
        {msg.text && (
          <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {msg.text}
          </div>
        )}
        
        {/* 🔹 Telegram Style: Время и статус */}
        <div
          className={`flex items-center gap-1 text-xs mt-2 justify-end ${
            isMe ? "text-blue-200" : "text-gray-500"
          }`}
        >
          <span>{msg.time}</span>
          {isMe &&
            (msg.status === "read" ? (
              <CheckCheck className="h-3 w-3 text-blue-300" />
            ) : msg.status === "delivered" ? (
              <CheckCheck className="h-3 w-3" />
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