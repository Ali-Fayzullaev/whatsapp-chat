// src/components/chat/MessageBubble.tsx
"use client";
import { Check, CheckCheck, Download } from "lucide-react";
import type { Message } from "./types";
import { Button } from "@/components/ui/button";

export function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.author === "me";
  
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const renderMedia = () => {
    if (!msg.media) return null;

    switch (msg.media.type) {
      case 'image':
        return (
          <div className="mb-2 rounded-lg overflow-hidden max-w-[280px]">
            <img 
              src={msg.media.url} 
              alt={msg.media.name || 'Изображение'}
              className="w-full h-auto object-cover"
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="mb-2 rounded-lg overflow-hidden max-w-[280px]">
            <video 
              controls 
              className="w-full h-auto"
              poster={msg.media.url} // можно добавить poster для превью
            >
              <source src={msg.media.url} type={msg.media.mime} />
              Ваш браузер не поддерживает видео.
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className="mb-2">
            <audio controls className="w-full max-w-[280px]">
              <source src={msg.media.url} type={msg.media.mime} />
              Ваш браузер не поддерживает аудио.
            </audio>
          </div>
        );
      
      case 'document':
        return (
          <div className="mb-2 flex items-center gap-2 p-3 bg-muted rounded-lg max-w-[280px]">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {msg.media.name || 'Документ'}
              </div>
              {msg.media.size && (
                <div className="text-xs text-muted-foreground">
                  {(msg.media.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(msg.media!.url, msg.media!.name || 'download')}
              className="flex-shrink-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

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
        
        <div className="whitespace-pre-wrap break-words pr-12">
          {msg.text}
        </div>
        
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