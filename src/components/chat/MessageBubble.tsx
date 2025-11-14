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
  MoreHorizontal,
  Trash2,
  Edit3,
  Save,
  X,
  Forward,
  Copy
} from "lucide-react";
import type { Message } from "./types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContextMenu } from "@/components/ui/context-menu";
import { MobileContextMenu } from "@/components/ui/mobile-context-menu";
import { 
  Tooltip, 
  TooltipContent,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMessageTime } from "@/utils/dateFormat";
interface MessageBubbleProps {
  msg: Message;
  onReply?: (message: Message) => void;
  isReplying?: boolean;
  onDelete?: (messageId: string, remote?: boolean) => void;
  isGroup?: boolean; // Добавляем флаг групповой чат
  onEdit?: (messageId: string, newText: string) => Promise<void>; // Добавляем onEdit
  onUserClick?: (userId: string, userName: string) => void; // Обработчик клика по пользователю
  onReplyPreviewClick?: (messageId: string) => void; // Переход к исходному сообщению
  isHighlighted?: boolean; // Подсветка сообщения при переходе
}
export function MessageBubble({ msg, onReply, isReplying, onDelete, onEdit, isGroup, onUserClick, onReplyPreviewClick, isHighlighted }: MessageBubbleProps) {
  const isMe = msg.author === "me";
  const [imageError, setImageError] = useState(false);

  // Отладочное логирование для групповых сообщений
  if (!isMe && isGroup && msg.sender) {
    console.log('👥 Group message display:', {
      chatId: msg.chatId,
      isGroup,
      sender: msg.sender,
      text: msg.text?.substring(0, 50) + '...'
    });
  } else if (!isMe && isGroup && !msg.sender) {
    console.log('⚠️ Group message without sender:', {
      chatId: msg.chatId,
      isGroup,
      msgData: msg,
      text: msg.text?.substring(0, 50) + '...'
    });
  }
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteRemote, setDeleteRemote] = useState(false);
  // Состояние для редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);
  const [isEditLoading, setIsEditLoading] = useState(false);
  // Состояние для долгого нажатия на мобильных
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };
  const handleReply = () => {
    if (onReply) {
      onReply(msg);
    } else {
      console.warn("🔹 onReply function is not provided");
    }
    setShowMenu(false);
  };
  const handleDelete = (remote: boolean = false) => {
    setDeleteRemote(remote);
    setShowDeleteDialog(true);
    setShowMenu(false);
  };
  const confirmDelete = () => {
    if (onDelete) {
      onDelete(msg.id, deleteRemote);
    } else {
      console.warn("🗑️ onDelete function is not provided");
    }
    setShowDeleteDialog(false);
  };
  // Функции для редактирования
  const handleEdit = () => {
    setIsEditing(true);
    setEditText(msg.text);
    setShowMenu(false);
  };
  const handleSaveEdit = async () => {
    const trimmedText = editText.trim();

    if (!onEdit) {
      console.warn("onEdit function is not provided");
      setIsEditing(false);
      return;
    }

    if (!trimmedText || trimmedText === msg.text) {
      setIsEditing(false);
      return;
    }

    try {
      setIsEditLoading(true);
      await onEdit(msg.id, trimmedText);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit message:", error);
      // TODO: surface error to user via toast
    } finally {
      setIsEditLoading(false);
    }
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(msg.text);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  // Функции для контекстного меню
  const handleContextReply = () => {
    if (onReply) {
      onReply(msg);
    } else {
      console.warn("⚠️ onReply function not provided");
    }
  };
  const handleContextDeleteForMe = () => {
    if (onDelete) {
      handleDelete(false); // Удалить для себя
    } else {
      console.warn("⚠️ onDelete function not provided");
    }
  };
  const handleContextDeleteForEveryone = () => {
    if (onDelete) {
      handleDelete(true); // Удалить у всех
    } else {
      console.warn("⚠️ onDelete function not provided");
    }
  };
  const handleContextForward = () => {
    // TODO: Реализовать функцию пересылки
  };
  const handleContextCopy = () => {
    if (msg.text) {
      navigator.clipboard.writeText(msg.text).then(() => {
      }).catch(err => {
        console.error("❌ Failed to copy text:", err);
      });
    }
  };
  // Обработчики для долгого нажатия на мобильных
  const handleTouchStart = (e: React.TouchEvent) => {
    const timer = setTimeout(() => {
      setIsContextMenuOpen(true);
      // Вибрация если поддерживается
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms для долгого нажатия
    setLongPressTimer(timer);
  };
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  // Рендеринг сообщения, на которое отвечают (как в WhatsApp)
  const renderReply = () => {
    if (!msg.replyTo) return null;

    type ReplyReference = typeof msg.replyTo & Partial<Record<"id_message" | "message_id", string>>;
    const replyReference = msg.replyTo as ReplyReference;
    const originalMessageId = replyReference.id
      || replyReference.id_message
      || replyReference.message_id;
    const isClickable = Boolean(originalMessageId && onReplyPreviewClick);

    const handlePreviewClick = () => {
      if (isClickable && originalMessageId) {
        onReplyPreviewClick?.(originalMessageId);
      }
    };

    return (
      <div
        className={`mb-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500 ${isClickable ? 'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors' : ''}`}
        onClick={handlePreviewClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={(event) => {
          if (!isClickable) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handlePreviewClick();
          }
        }}
      >
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
                {msg.replyTo.media.type === 'image' ? 'Изображение' :
                 msg.replyTo.media.type === 'video' ? 'Видео' :
                 msg.replyTo.media.type === 'audio' ? 'Аудиосообщение' : 'Файл'}
              </span>
            </div>
          ) : (
            msg.replyTo.text
          )}
        </div>
      </div>
    );
  };
  // 🔹 Улучшенная функция определения типа файла
  const getFileTypeFromMessage = (msg: Message): string => {
    // 1. Проверяем указанный тип
    if (msg.media?.type && msg.media.type !== 'document') {
      return msg.media.type;
    }
    // 2. Проверяем MIME-тип
    if (msg.media?.mime) {
      if (msg.media.mime.startsWith('image/')) return 'image';
      if (msg.media.mime.startsWith('video/')) return 'video';
      if (msg.media.mime.startsWith('audio/')) return 'audio';
    }
    // 3. Проверяем расширение файла
    const fileName = msg.media?.name || msg.media?.url || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'ogv'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'];
    if (imageExtensions.includes(extension || '')) return 'image';
    if (videoExtensions.includes(extension || '')) return 'video';
    if (audioExtensions.includes(extension || '')) return 'audio';
    // 4. Особая логика для UUID файлов
    if (fileName.match(/^[a-f0-9-]+\.mp4$/i)) return 'video';
    if (fileName.match(/^[a-f0-9-]+\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (fileName.match(/^[a-f0-9-]+\.(mp3|wav|ogg|aac)$/i)) return 'audio';
    return 'document';
  };
  const getDisplayFileName = (): string => {
    // 1. Если есть нормальное имя файла - используем его
    if (msg.media?.name && msg.media.name !== msg.media.url && !msg.media.name.match(/^[a-f0-9-]+\.\w+$/i)) {
      return msg.media.name;
    }
    // 2. Извлекаем имя из URL
    const fileName = msg.media?.url?.split('/').pop() || msg.media?.name || '';
    const fileType = getFileTypeFromMessage(msg);
    // 3. Для UUID файлов создаем красивое имя
    if (fileName.match(/^[a-f0-9-]+\.\w+$/i)) {
      const extension = fileName.split('.').pop()?.toUpperCase();
      const timestamp = new Date().toLocaleDateString();
      switch (fileType) {
        case 'image': return `Изображение.${extension}`;
        case 'video': return `Видео.${extension}`;
        case 'audio': return `Аудио.${extension}`;
        default: return `Документ.${extension}`;
      }
    }
    // 4. Возвращаем оригинальное имя или fallback
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
                alt="Изображение"
                className="w-full h-auto max-w-[250px] sm:max-w-md object-cover cursor-pointer rounded-lg"
                onError={() => setImageError(true)}
                loading="lazy"
                onClick={() => window.open(msg.media!.url, '_blank')}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Image className="h-8 w-8 mb-2 text-gray-400" />
                <div className="text-sm text-center text-gray-500">
                  <div className="font-medium">Изображение</div>
                  <div className="text-xs mt-1">Не удалось загрузить изображение</div>
                </div>
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="mb-3 rounded-lg overflow-hidden bg-black">
            <div className="relative">
              <video 
                controls 
                className="w-full h-auto max-w-[250px] sm:max-w-md rounded-lg"
                preload="metadata"
                poster=""
                style={{ maxHeight: '300px' }}
              >
                <source src={msg.media.url} type={msg.media.mime || 'video/mp4'} />
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="mb-3 p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-[280px] sm:max-w-md w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-blue-500 rounded-full">
                <Mic2Icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  Аудиосообщение
                </div>
              </div>
            </div>
            <audio controls className="w-full h-8 sm:h-10">
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
                  alt="Изображение"
                  className="w-full h-auto max-w-md object-cover cursor-pointer"
                  onError={() => setImageError(true)}
                  loading="lazy"
                  onClick={() => window.open(msg.media!.url, '_blank')}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg ">
                  <Image className="h-8 w-8 mb-2 text-gray-400" />
                  <div className="text-sm text-center text-gray-500">
                    <div className="font-medium">Изображение</div>
                    <div className="text-xs mt-1">Не удалось загрузить изображение</div>
                  </div>
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="mb-3 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-[280px] sm:max-w-md">
            <div className="p-2 sm:p-3 bg-blue-500 rounded-lg">
              <File className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs sm:text-sm mb-1 text-gray-700 dark:text-gray-300">
                Файл
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
              onClick={() => handleDownload(msg.media!.url, msg.media?.name || 'file')}
              className="flex-shrink-0 text-gray-500 hover:text-blue-500"
              title="Скачать файл"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
    }
  };
  // 🔹 Проверяем, является ли текст только именем файла (UUID + расширение)
  const isFileNameOnly = (text: string): boolean => {
    if (!text || !msg.media) return false;
    // Проверяем, является ли текст UUID именем файла
    const uuidFilePattern = /^📄\s*[a-f0-9-]+\.[a-zA-Z0-9]+$/i;
    const simpleUuidPattern = /^[a-f0-9-]+\.[a-zA-Z0-9]+$/i;
    return uuidFilePattern.test(text.trim()) || simpleUuidPattern.test(text.trim());
  };
  // 🔹 Функция для форматирования информации о сообщении для tooltip
  const formatMessageInfo = (): string => {
    const parts: string[] = [];
    // Отправитель
    if (msg.sender?.name || msg.sender?.full_name) {
      const senderName = msg.sender.full_name || msg.sender.name || 'Неизвестный отправитель';
      parts.push(`Отправитель: ${senderName}`);
    } else {
      parts.push(`Отправитель: ${msg.author === 'me' ? 'Вы' : 'Собеседник'}`);
    }
    // User ID
    if (msg.sender?.user_id) {
      parts.push(`User ID: ${msg.sender.user_id}`);
    } else if (msg.sender?.id) {
      parts.push(`Sender ID: ${msg.sender.id}`);
    }
    // Добавим ID сообщения для отладки
    // Дата и время
    if (msg.timestamp) {
      try {
        const date = new Date(msg.timestamp);
        const formatted = date.toLocaleString('ru-RU', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        parts.push(`Дата: ${formatted}`);
      } catch (error) {
        parts.push(`Время: ${formatMessageTime(msg.timestamp || msg.time)}`);
      }
    } else {
      parts.push(`Время: ${formatMessageTime(msg.time)}`);
    }
    // Платформа и направление
    if (msg.platform) {
      parts.push(`Платформа: ${msg.platform}`);
    }
    if (msg.direction) {
      const directionText = msg.direction === 'in' ? 'Входящее' : 'Исходящее';
      parts.push(`Направление: ${directionText}`);
    }
    // ID сообщения
    if (msg.id_message) {
      parts.push(`ID сообщения: ${msg.id_message}`);
    }
    // Всегда показываем хотя бы базовую информацию
    if (parts.length === 0) {
      parts.push('Информация о сообщении недоступна');
    }
    return parts.join('\n');
  };
  // 🔹 Определяем, является ли сообщение только медиа-файлом
  const isMediaOnly = msg.media && !msg.text;
  // Общие пункты контекстного меню
  const menuItems = [
    { 
      label: 'Ответить', 
      action: handleContextReply,
      icon: <Reply className="h-4 w-4" />
    },
    { 
      label: 'Копировать', 
      action: handleContextCopy, 
      disabled: !msg.text,
      icon: <Copy className="h-4 w-4" />
    },
    // Для своих сообщений - две опции удаления как в WhatsApp
    ...(isMe ? [
      { 
        label: 'Удалить для меня', 
        action: handleContextDeleteForMe,
        className: 'text-orange-600 dark:text-orange-400 focus:bg-orange-50 dark:focus:bg-orange-900/20',
        icon: <Trash2 className="h-4 w-4" />
      },
      { 
        label: 'Удалить у всех', 
        action: handleContextDeleteForEveryone,
        className: 'text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20',
        icon: <Trash2 className="h-4 w-4" />
      }
    ] : [
      // Для чужих сообщений - только удалить для себя
      { 
        label: 'Удалить для меня', 
        action: handleContextDeleteForMe,
        className: 'text-orange-600 dark:text-orange-400 focus:bg-orange-50 dark:focus:bg-orange-900/20',
        icon: <Trash2 className="h-4 w-4" />
      }
    ])
  ];
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2 sm:mb-3 group ${isReplying ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 -m-2' : ''}`}>
      {/* Аватар пользователя (только для входящих сообщений в группах) */}
      {!isMe && isGroup && msg.sender && (() => {
        // Простая хэш функция для генерации цвета имени
        const getHashColor = (str: string) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          return Math.abs(hash) % 360;
        };
        
        const senderName = msg.sender.full_name || msg.sender.name || msg.sender.id?.replace('@c.us', '').replace(/^\+/, '') || 'Пользователь';
        const colorHue = getHashColor(msg.sender.id || senderName);
        const avatarFallback = senderName.charAt(0).toUpperCase();
        
        const handleUserClick = () => {
          if (onUserClick && msg.sender) {
            onUserClick(msg.sender.id, senderName);
          }
        };
        
        return (
          <div className="flex-shrink-0 mr-2">
            <Avatar 
              className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all" 
              onClick={handleUserClick}
              title={`Открыть чат с ${senderName}`}
            >
              <AvatarImage 
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(senderName)}&backgroundColor=${colorHue.toString(16).padStart(6, '0')}`}
                alt={senderName}
              />
              <AvatarFallback 
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: `hsl(${colorHue}, 65%, 45%)` }}
              >
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </div>
        );
      })()}

      {/* Контейнер сообщения */}
      <div
        id={`message-${msg.id}`}
        data-message-id={msg.id}
        className={`flex flex-col max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] ${isMe ? 'items-end' : 'items-start'} min-w-0 ${isHighlighted ? 'ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/20 transition-all duration-500' : ''}`}
      >
        {/* Десктопное контекстное меню */}
        <ContextMenu menuItems={menuItems}>
          {/* Мобильное контекстное меню */}
          <MobileContextMenu 
            menuItems={menuItems}
            isOpen={isContextMenuOpen}
            onClose={() => setIsContextMenuOpen(false)}
          >
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div
                className={[ 
                  "relative rounded-2xl px-3 py-2 sm:px-4 sm:py-3 transition-all duration-200 hover:shadow-md cursor-pointer group-tooltip select-none",
                  isMe
                    ? "bg-[#DCF8C6] text-black shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 shadow-sm",
                  // Стили как в настоящем WhatsApp
                  isMe 
                    ? "rounded-br-md" 
                    : "rounded-bl-md",
                  // Лучшая видимость на мобильных + перенос текста
                  "active:scale-[0.98] touch-manipulation min-w-0 w-full"
                ].join(" ")}
                style={{ 
                  wordBreak: 'break-word', 
                  overflowWrap: 'anywhere',
                  hyphens: 'auto'
                }}
                onMouseEnter={() => {}}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
              >
                {/* Меню опций (появляется при hover) */}
                <div className={`absolute -top-3 ${isMe ? '-left-1' : '-right-1'} opacity-50 group-hover:opacity-100 transition-opacity duration-200 z-10`}>
                  <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                        onClick={() => {}}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-gray-800" align={isMe ? "start" : "end"}>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          handleReply();
                        }}
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        Ответить
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(msg.text)}>
                        <File className="h-4 w-4 mr-2" />
                        Копировать текст
                      </DropdownMenuItem>
                      {isMe && onEdit && !msg.media && (
                        <DropdownMenuItem onClick={handleEdit}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(false)}
                            className="text-orange-600 focus:text-orange-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить для себя
                          </DropdownMenuItem>
                          {isMe && (
                            <DropdownMenuItem 
                              onClick={() => handleDelete(true)}
                              className="text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Удалить у всех
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Контент сообщения */}
                <div className="space-y-1 sm:space-y-2">
                  {/* Имя отправителя в группе (только название, без аватара) */}
                  {!isMe && isGroup && msg.sender && (() => {
                    // Простая хэш функция для генерации цвета имени
                    const getHashColor = (str: string) => {
                      let hash = 0;
                      for (let i = 0; i < str.length; i++) {
                        hash = str.charCodeAt(i) + ((hash << 5) - hash);
                      }
                      return Math.abs(hash) % 360;
                    };
                    
                    const senderName = msg.sender.full_name || msg.sender.name || msg.sender.id?.replace('@c.us', '').replace(/^\+/, '') || 'Пользователь';
                    const colorHue = getHashColor(msg.sender.id || senderName);
                    
                    const handleUserClick = () => {
                      if (onUserClick && msg.sender) {
                        onUserClick(msg.sender.id, senderName);
                      }
                    };
                    
                    return (
                      <div className="mb-1">
                        {/* Имя пользователя */}
                        <span 
                          className="text-xs font-semibold cursor-pointer hover:underline" 
                          style={{ color: `hsl(${colorHue}, 65%, 45%)` }}
                          onClick={handleUserClick}
                          title={`Открыть чат с ${senderName}`}
                        >
                          {senderName}
                        </span>
                      </div>
                    );
                  })()}
                  
                  {/* Сообщение, на которое отвечаем */}
                  {renderReply()}
                  {/* Медиа */}
                  {renderMedia()}
                  {/* Текст сообщения */}
                  {msg.text && !isFileNameOnly(msg.text) && (
                    <div 
                      className="text-[14px] sm:text-[15px] leading-relaxed"
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        hyphens: 'auto',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.text.trim()}
                    </div>
                  )}
                  {/* Время и статус */}
                  <div className={`flex items-center gap-1 text-[11px] mt-1 justify-end ${
                    isMe ? "text-gray-600" : "text-gray-500"
                  }`}>
                    <span>{msg.timestamp ? formatMessageTime(msg.timestamp) : msg.time}</span>
                    {isMe && (
                      msg.pending ? (
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : msg.status === "read" ? (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      ) : msg.status === "delivered" ? (
                        <CheckCheck className="h-3 w-3 text-gray-400" />
                      ) : msg.status === "failed" ? (
                        <span className="text-red-500 text-[10px]">⚠️</span>
                      ) : (
                        <Check className="h-3 w-3 text-gray-400" />
                      )
                    )}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-xs bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl z-50 border border-gray-700"
              sideOffset={10}
            >
              <div className="font-mono text-xs leading-relaxed whitespace-pre-line break-words">
                {formatMessageInfo()}
              </div>
            </TooltipContent>
          </Tooltip>
          </MobileContextMenu>
        </ContextMenu>
      </div>
      {/* Диалог подтверждения удаления */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Удалить сообщение
            </DialogTitle>
            <DialogDescription className="text-left">
              {deleteRemote ? (
                <>
                  <strong>Удалить у всех?</strong>
                  <br />
                  Это сообщение будет удалено для всех участников чата. 
                  Это действие нельзя отменить.
                </>
              ) : (
                <>
                  <strong>Удалить для себя?</strong>
                  <br />
                  Сообщение будет удалено только в вашем чате. 
                  Другие участники по-прежнему смогут его видеть.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteRemote ? "Удалить у всех" : "Удалить для себя"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
