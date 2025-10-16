// src/components/chat/Sidebar.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chat } from "./types";
import { HeaderMenu } from "./menus";
import { useState } from "react";
import Link from "next/link";

// Функция для форматирования времени (оставляем без изменений)
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'вчера';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
};

// Функция для получения текста последнего сообщения (оставляем без изменений)
const getLastMessageText = (lastMessage: any) => {
  if (!lastMessage) return "Нет сообщений";
  
  switch (lastMessage.type) {
    case 'text':
      return lastMessage.text || "Текстовое сообщение";
    case 'image':
      return "📷 Изображение";
    case 'document':
      return `📄 ${lastMessage.media?.name || 'Документ'}`;
    case 'video':
      return "🎥 Видео";
    case 'audio':
      return "🎵 Аудио";
    default:
      return "Сообщение";
  }
};

export function Sidebar({
  query,
  setQuery,
  chats,
  selectedId,
  setSelectedId,
  compact,
  onCreateChat,
}: {
  query: string;
  setQuery: (v: string) => void;
  chats: Chat[];
  selectedId?: string;
  setSelectedId: (id: string) => void;
  compact?: boolean;
  onCreateChat: (phone: string) => Promise<void>;
}) {
  const [newChatPhone, setNewChatPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreate = async () => {
    const raw = newChatPhone.trim();
    if (!raw) return;
    setIsCreating(true);
    try {
      await onCreateChat(raw);
      setNewChatPhone("");
      setIsDialogOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    }
  };

  // Фильтрация чатов по поисковому запросу
  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(query.toLowerCase()) ||
    chat.lastMessage
  );

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900">
      {/* 💬 WhatsApp Style: Хедер (верхняя полоса) */}
      <div 
        // В веб-версии это может быть светло-серый фон, а акценты зеленые.
        // Используем светло-серый фон (bg-gray-50) с зелеными акцентами для кнопок.
        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3">
          {/* Аватар пользователя - делаем больше */}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-green-500 text-white">Я</AvatarFallback>
            <AvatarImage src="/your-profile-pic.jpg" alt="Мой профиль" />
          </Avatar>
          {/* Убираем "Мой профиль" для чистоты, как в WhatsApp Web */}
        </div>
        <div className="flex items-center gap-1">
          {/* Кнопка нового чата */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              {/* Зеленый акцент на иконках в шапке */}
              <Button variant="ghost" size="icon" aria-label="Новый чат" className="text-gray-500 hover:text-green-600">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              {/* Диалоговое окно оставляем как есть, оно универсально */}
              <DialogHeader>
                <DialogTitle>Новый чат</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-2">
                <Input
                  placeholder="Введите номер телефона (77751101800)"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  onKeyDown={handleKeyPress}
                  autoFocus
                />
                <Button
                  // Зеленая кнопка для акцента
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handleCreate}
                  disabled={isCreating || !newChatPhone.trim()}
                >
                  {isCreating ? "Создание..." : "Начать чат"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <HeaderMenu />
        </div>
      </div>
      
      {/* 💬 WhatsApp Style: Поиск (светло-серый, скругленный) */}
      <div className="p-2 border-r border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60 text-gray-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск чатов"
            // Стилизуем Input в стиле WhatsApp: скругление, светло-серый фон, нет рамки
            className="pl-9 rounded-lg bg-gray-100 dark:bg-gray-800 border-none focus-visible:ring-0"
          />
        </div>
      </div>
      {/* Убираем <Separator />, так как боковая панель уже имеет границы */}

      {/* Список чатов */}
      {/* Удаляем класс chat-background, чтобы не было конфликтов со стилями */}
      <ScrollArea className="flex-1 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"> 
        <div className="flex flex-col">
          {filteredChats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {query ? "Чаты не найдены" : "Нет чатов"}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const chatId = chat.id || chat.chat_id;
              
              if (!chatId) {
                return null;
              }

              return (
                <Link 
                  key={chatId} 
                  href={`/${encodeURIComponent(chatId)}`}
                  className={[
                    "w-full block",
                    chatId === selectedId ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-800/70",
                  ].join(" ")}
                  onClick={() => {
                    setSelectedId(chatId);
                  }}
                >
                  <button
                    className="w-full flex items-center gap-3 py-2 px-4 transition-colors border-b border-gray-100 dark:border-gray-800"
                  >
                    {/* Аватар - делаем больше */}
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      {chat.avatarUrl ? (
                        <AvatarImage src={chat.avatarUrl} alt={chat.name} />
                      ) : (
                        <AvatarFallback>
                          {chat.avatarFallback || 
                            (typeof chat.name === 'string' ? chat.name.charAt(0) : '?')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className="min-w-0 flex-1 text-left flex flex-col justify-center h-full">
                      {/* Верхняя строка */}
                      <div className="flex items-baseline justify-between">
                        <div className="truncate font-semibold text-gray-900 dark:text-gray-100 text-base">
                          {chat.name || chatId.replace('@c.us', '')}
                        </div>
                        <div className="ml-auto text-xs text-muted-foreground">
                          {chat.lastMessage?.timestamp ? 
                            formatTime(chat.lastMessage.timestamp) : ''}
                        </div>
                      </div>
                      
                      {/* Нижняя строка */}
                      <div className="flex items-center justify-between pt-0.5">
                        <div 
                          className={`text-sm truncate flex-1 pr-2 ${chat.unread ? 'text-gray-900 dark:text-gray-200' : 'text-muted-foreground'}`}
                        >
                          {getLastMessageText(chat.lastMessage)}
                        </div>

                        {/* 💬 WhatsApp Style: Зеленый значок непрочитанных сообщений */}
                        {chat.unread ? (
                          <Badge
                            // Используем зеленый цвет для бэджа
                            className="rounded-full h-5 w-5 flex items-center justify-center text-[10px] bg-green-500 hover:bg-green-600 text-white p-0"
                          >
                            {chat.unread}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </Link>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}