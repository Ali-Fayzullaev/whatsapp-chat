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

// Функция для форматирования времени
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

// Функция для получения текста последнего сообщения
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
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback>Я</AvatarFallback>
          </Avatar>
          {!compact && <div className="text-sm font-medium">Мой профиль</div>}
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Новый чат">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
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

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск чатов"
            className="pl-9 rounded-2xl"
          />
        </div>
      </div>
      <Separator />

      {/* Список чатов */}
      <ScrollArea className="flex-1 chat-background">
        <div className="p-2">
          {filteredChats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {query ? "Чаты не найдены" : "Нет чатов"}
            </div>
          ) : (
            filteredChats.map((chat) => {
              // Используем chat_id как идентификатор
              const chatId = chat.id || chat.chat_id;
              
              if (!chatId) {
                console.warn("Chat без id:", chat);
                return null;
              }

              return (
                <button
                  key={chatId}
                  onClick={() => {
                    console.log("Sidebar: selecting chat:", chatId);
                    setSelectedId(chatId);
                  }}
                  className={[
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                    chatId === selectedId ? "bg-accent" : "hover:bg-accent/60",
                  ].join(" ")}
                >
                  <Avatar className="h-11 w-11">
                    {chat.avatarUrl ? (
                      <AvatarImage src={chat.avatarUrl} alt={chat.name} />
                    ) : (
                      <AvatarFallback>
                        {chat.avatarFallback || 
                         (typeof chat.name === 'string' ? chat.name.charAt(0) : '?')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">
                        {chat.name || chatId.replace('@c.us', '')}
                      </div>
                      <div className="ml-auto text-xs text-muted-foreground">
                        {chat.lastMessage?.timestamp ? 
                         formatTime(chat.lastMessage.timestamp) : ''}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {getLastMessageText(chat.lastMessage)}
                    </div>
                  </div>
                  
                  {chat.unread ? (
                    <Badge
                      className="rounded-full px-2 py-0.5 text-[10px]"
                      variant="default"
                    >
                      {chat.unread}
                    </Badge>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}