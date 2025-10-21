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
  X
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

interface MessageBubbleProps {
  msg: Message;
  onReply?: (message: Message) => void;
  isReplying?: boolean;
  onDelete?: (messageId: string, remote?: boolean) => void;
  onEdit?: (messageId: string, newText: string) => Promise<void>; // Добавляем onEdit
}

export function MessageBubble({ msg, onReply, isReplying, onDelete, onEdit }: MessageBubbleProps) {
  const isMe = msg.author === "me";
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteRemote, setDeleteRemote] = useState(false);
  
  // Состояние для редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const handleReply = () => {
    console.log("🔹 Reply button clicked for message:", msg.id);
    if (onReply) {
      console.log("🔹 Calling onReply function with message:", msg);
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
    console.log(`🗑️ Delete confirmed for message: ${msg.id} (remote: ${deleteRemote})`);
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
    if (!onEdit || editText.trim() === msg.text) {
      setIsEditing(false);
      return;
    }

    setIsEditLoading(true);
    try {
      await onEdit(msg.id, editText.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit message:", error);
      // Можно добавить уведомление об ошибке
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
    
    // 🔹 Добавляем логирование для отладки
    if (msg.media.name?.includes('.mp4') || msg.media.url?.includes('.mp4')) {
      console.log('🎥 Video media detected:', {
        name: msg.media.name,
        url: msg.media.url,
        type: msg.media.type,
        mime: msg.media.mime,
        detectedType: mediaType,
        displayFileName
      });
    }

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
          <div className="mb-3 rounded-lg overflow-hidden bg-black">
            <div className="relative">
              <video 
                controls 
                className="w-full h-auto max-w-md rounded-lg"
                preload="metadata"
                poster="" // Можно добавить постер если есть
                style={{ maxHeight: '400px' }}
              >
                <source src={msg.media.url} type={msg.media.mime || 'video/mp4'} />
                Ваш браузер не поддерживает видео.
              </video>
              
              {/* Показываем название файла если это не обычное имя */}
              {displayFileName && displayFileName !== msg.media.url && (
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
                  🎥 {displayFileName}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'audio':
        return (
          <div className="mb-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-md w-[40vw]">
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
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-4 group relative ${isReplying ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 -m-2' : ''}`}>
      {/* 🔹 Кнопка ответа слева от сообщения (для чужих) или справа (для своих) */}
      <div className={`${isMe ? 'order-2 ml-2' : 'order-1 mr-2'} flex items-start pt-3`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReply}
          className={`h-8 w-8 transition-all duration-200 ${
            isReplying 
              ? 'opacity-100 scale-110' 
              : 'opacity-0 group-hover:opacity-100'
          } ${
            isMe 
              ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
              : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
          } ${
            isReplying ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : ''
          }`}
          title="Ответить на сообщение"
        >
          <Reply className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={[
          "relative max-w-[70%] rounded-2xl px-4 py-3",
          isMe
            ? "bg-blue-500 text-white rounded-br-md order-1"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700 order-2",
        ].join(" ")}
      >
        {/* 🔹 Дополнительное меню с тремя точками */}
        <div className={`absolute top-2 ${isMe ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
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
            <DropdownMenuContent align={isMe ? "start" : "end"}>
              <DropdownMenuItem onClick={handleReply}>
                <Reply className="h-4 w-4 mr-2" />
                Ответить
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(msg.text)}>
                <File className="h-4 w-4 mr-2" />
                Копировать текст
              </DropdownMenuItem>
              {/* Добавляем пункт редактирования только для своих сообщений */}
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

        {/* 🔹 Сообщение, на которое отвечаем */}
        {renderReply()}
        
        {/* 🔹 Медиа */}
        {renderMedia()}
        
        {/* 🔹 Текст сообщения */}
        {msg.text && (
          <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[80px] resize-none"
                  placeholder="Введите сообщение..."
                  disabled={isEditLoading}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isEditLoading}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Отмена
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isEditLoading || editText.trim() === msg.text}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {isEditLoading ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {msg.text}
                {msg.isEdited && (
                  <span className="text-xs text-gray-500 ml-2 italic">
                    изменено
                  </span>
                )}
              </>
            )}
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