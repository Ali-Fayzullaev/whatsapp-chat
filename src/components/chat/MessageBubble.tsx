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
  X
} from "lucide-react";
import type { Message } from "./types";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MessageBubbleProps {
  msg: Message;
  onReply?: (message: Message) => void;
  isReplying?: boolean;
}

export function MessageBubble({ msg, onReply, isReplying }: MessageBubbleProps) {
  const isMe = msg.author === "me";
  const [imageError, setImageError] = useState(false);
  const [showReplyButton, setShowReplyButton] = useState(false);
  
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
  };

  // 💬 WhatsApp Style: Рендеринг сообщения, на которое отвечают
  const renderReply = () => {
    if (!msg.replyTo) return null;

    // В WhatsApp цитата всегда имеет вертикальную полоску и другой фон
    return (
      <div 
        className={`
          mb-1 p-2 rounded-lg border-l-4 max-w-full cursor-default
          ${isMe 
            ? 'bg-white/70 border-green-500 text-gray-700' // Светлая цитата внутри зеленого пузыря
            : 'bg-gray-100/70 border-green-500 text-gray-700' // Светлая цитата внутри белого пузыря
          }
        `}
      >
        <div className="flex items-center gap-1 mb-1">
          <span className={`text-xs font-medium ${isMe ? 'text-green-600' : 'text-green-600'}`}>
            {msg.replyTo.author === "me" ? "Вы" : "Сообщение"}
          </span>
        </div>
        
        {/* Текст или описание медиа */}
        <div className="text-sm line-clamp-2"> {/* line-clamp для ограничения по высоте */}
          {msg.replyTo.media ? (
            <div className="flex items-center gap-1 text-muted-foreground/80">
              {msg.replyTo.media.type === 'image' && <Image className="h-3 w-3" />}
              {msg.replyTo.media.type === 'video' && <Video className="h-3 w-3" />}
              {msg.replyTo.media.type === 'audio' && <Mic2Icon className="h-3 w-3" />}
              {msg.replyTo.media.type === 'document' && <File className="h-3 w-3" />}
              <span className="truncate">
                {msg.replyTo.media.name || 
                 (msg.replyTo.media.type === 'image' ? 'Изображение' :
                  msg.replyTo.media.type === 'video' ? 'Видео' :
                  msg.replyTo.media.type === 'audio' ? 'Аудио' : 'Документ')}
              </span>
            </div>
          ) : (
            <div className="truncate text-foreground/80">
              {msg.replyTo.text}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ... (Функции getFileTypeFromMessage и getDisplayFileName оставляем без изменений)

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
  
  // 💬 WhatsApp Style: Улучшаем рендеринг медиа
  const renderMedia = () => {
    if (!msg.media) return null;

    const mediaType = getFileTypeFromMessage(msg);
    const displayFileName = getDisplayFileName();
    
    // В WhatsApp медиа обычно не имеет такого большого отступа, как текстовое сообщение,
    // а само медиа занимает всю ширину "пузыря" (с внутренними отступами).

    switch (mediaType) {
      case 'image':
        return (
          // Убираем mb-2, чтобы оно сливалось с текстом, если он есть
          <div className="rounded-xl overflow-hidden max-w-[280px] relative"> 
            {!imageError ? (
              <img 
                src={msg.media.url} 
                alt={displayFileName}
                className="w-full h-auto object-cover max-h-[300px] cursor-pointer"
                onError={() => setImageError(true)}
                loading="lazy"
                onClick={() => window.open(msg.media!.url, '_blank')}
              />
            ) : (
              // ... (Оставляем обработку ошибки без изменений, но уберите mb-2)
              <div className="flex flex-col items-center justify-center p-4 bg-muted text-muted-foreground rounded-lg">
                <Image className="h-8 w-8 mb-2" />
                <div className="text-sm text-center">
                  <div className="font-medium">{displayFileName}</div>
                  <div className="text-xs mt-1">Не удалось загрузить изображение</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleDownload(msg.media!.url, displayFileName)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Скачать
                </Button>
              </div>
            )}
            {/* Если медиа не является только медиа, то текст будет ниже, 
                в этом случае время/статус будет на тексте. 
                Если это только медиа, то время/статус на картинке, но это сложнее.
                Пока оставим время внизу компонента, но уберем правый отступ для медиа */}
          </div>
        );
      
      case 'video':
        return (
          <div className="rounded-xl overflow-hidden max-w-[280px] relative">
            <video 
              controls 
              className="w-full h-auto max-h-[300px] rounded-lg"
              preload="metadata"
            >
              <source src={msg.media.url} type={msg.media.mime} />
              Ваш браузер не поддерживает видео.
            </video>
          </div>
        );
      
      case 'audio':
        // Аудио в WhatsApp имеет свой особый дизайн, но для простоты:
        return (
          <div className="mb-2 w-full max-w-[280px] pr-10"> {/* pr-10 для места под время/статус */}
            <div className="flex items-center gap-3">
              {/* Аудио-плеер, похожий на WhatsApp */}
              <audio controls className="flex-1 w-full h-9">
                <source src={msg.media.url} type={msg.media.mime} />
                Ваш браузер не поддерживает аудио.
              </audio>
              {/* В WhatsApp здесь может быть аватарка/иконка */}
            </div>
          </div>
        );
      
      case 'document':
      default:
        // Упрощенный дизайн документа, похожий на WhatsApp
        return (
          <div className="flex items-center gap-3 p-2 rounded-lg max-w-[280px] pr-10">
            <div className={`p-2 rounded-full ${isMe ? 'bg-white/90' : 'bg-green-100'}`}>
                <File className="h-5 w-5 text-green-600 flex-shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {displayFileName}
              </div>
              {msg.media.size && (
                <div className={`text-xs ${isMe ? 'text-white/80' : 'text-gray-500'}`}>
                  {(msg.media.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(msg.media!.url, displayFileName)}
              className={`flex-shrink-0 ${isMe ? 'text-white/90 hover:text-white/70' : 'text-green-600 hover:text-green-700'}`}
              title="Скачать файл"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
    }
  };

  // 🔹 Определяем, является ли сообщение только медиа-файлом
  const isMediaOnly = msg.media && !msg.text; // Упрощенное определение для стиля

  return (
    <div 
      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}
      onMouseEnter={() => setShowReplyButton(true)}
      onMouseLeave={() => setShowReplyButton(false)}
    >
      <div
        className={[
          "relative max-w-[85%] px-3 pt-2 pb-1 shadow-sm group min-w-[80px]", // pb-1 для места под время
          // 💬 WhatsApp Style: Закругления и цвета
          isMe
            ? "bg-whatsapp-green  rounded-xl rounded-br-none bg-green-400 text-white" // Светло-зеленый, острый угол внизу справа
            : "bg-white text-gray-900 rounded-xl rounded-bl-none border border-gray-100", // Белый, острый угол внизу слева
        ].join(" ")}
      >
        {/* 💬 WhatsApp Style: Кнопка ответа (свайп вправо) */}
        {onReply && showReplyButton && (
          <Button
            variant="ghost"
            size="icon"
            className={`
              absolute z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity
              ${isMe 
                ? '-left-8 bg-transparent hover:bg-gray-100/50 text-gray-500' // Слева от зеленого пузыря
                : '-right-8 bg-transparent hover:bg-gray-100/50 text-gray-500' // Справа от белого пузыря
              }
            `}
            onClick={handleReply}
            title="Ответить"
          >
            <Reply className="h-4 w-4" />
          </Button>
        )}

        {/* 🔹 Сообщение, на которое отвечаем */}
        {renderReply()}
        
        {/* 🔹 Медиа (рендерим до текста) */}
        {renderMedia()}
        
        {/* 🔹 Текст сообщения */}
        {msg.text && (
          // Убираем pr-12, чтобы не было слишком много пустого места
          <div className="whitespace-pre-wrap break-words min-w-full text-base"> 
            {msg.text}
          </div>
        )}
        
        {/* 💬 WhatsApp Style: Время и статус (внизу справа) */}
        <div
          className={`
            flex items-center gap-1 text-[11px] mt-1 whitespace-nowrap justify-end 
            ${isMe ? "text-gray-500" : "text-gray-500"}
          `}
        >
          {/* Пустой div для выравнивания текста с медиа, если текст пуст */}
          {(!msg.text && !msg.media) && <div className="h-4"></div>} 
          
          <span className="leading-none">{msg.time}</span>
          {isMe &&
            (msg.status === "read" ? (
              <CheckCheck className="h-3 w-3 text-blue-500" /> // Синие галочки
            ) : msg.status === "delivered" ? (
              <CheckCheck className="h-3 w-3 text-gray-400" /> // Серые двойные галочки
            ) : msg.status === "failed" ? (
              <span className="text-red-500 leading-none">⚠️</span>
            ) : (
              <Check className="h-3 w-3 text-gray-400" /> // Серая одинарная галочка
            ))}
        </div>
      </div>
    </div>
  );
}