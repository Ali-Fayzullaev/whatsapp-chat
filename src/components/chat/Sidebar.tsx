// src/components/chat/Sidebar.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, Menu, Trash2, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Chat } from "./types";
import { HeaderMenu } from "./menus";
import { useState } from "react";

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "вчера";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("ru-RU", { weekday: "short" });
  } else {
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  }
};

const getLastMessageText = (lastMessage: any) => {
  if (!lastMessage) return "Нет сообщений";

  switch (lastMessage.type) {
    case "text":
      return lastMessage.text || "Текстовое сообщение";
    case "image":
      return "🖼️ Изображение";
    case "document":
      return `📎 ${lastMessage.media?.name || "Документ"}`;
    case "video":
      return "🎥 Видео";
    case "audio":
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
  onDeleteChat,
}: {
  query: string;
  setQuery: (v: string) => void;
  chats: Chat[];
  selectedId?: string;
  setSelectedId: (id: string) => void;
  compact?: boolean;
  onCreateChat: (phone: string) => Promise<void>;
  onDeleteChat?: (chatId: string) => Promise<void>;
}) {
  const [newChatPhone, setNewChatPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

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

  const handleDeleteChat = (chatId: string) => {
    setChatToDelete(chatId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteChat = async () => {
    if (chatToDelete && onDeleteChat) {
      try {
        await onDeleteChat(chatToDelete);
        setShowDeleteDialog(false);
        setChatToDelete(null);
      } catch (error) {
        console.error('Failed to delete chat:', error);
        // Диалог остается открытым при ошибке
      }
    }
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.name?.toLowerCase().includes(query.toLowerCase()) || chat.lastMessage
  );

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* 🔹 Telegram Style: Хедер */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-500 text-white">
              <Menu className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Чаты
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-blue-500"
              >
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
                  className="bg-blue-500 hover:bg-blue-600"
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

      {/* 🔹 Telegram Style: Поиск */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск"
            className="pl-10 rounded-2xl bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* 🔹 Telegram Style: Список чатов */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filteredChats.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {query ? "Чаты не найдены" : "Нет чатов"}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const chatId = chat.id || chat.chat_id;
              const chat_name = chat.lastMessage?.sender?.name || chat.name || chatId?.replace('@c.us', '') || 'Неизвестный';
              if (!chatId) return null;

              return (
                <div
                  key={chatId}
                  className={`border-b border-gray-100 dark:border-gray-800 group ${
                    chatId === selectedId
                      ? "bg-green-50 dark:bg-green-900/20 border-r-4 border-r-green-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3 p-3 transition-colors">
                    {/* Аватар и основная информация */}
                    <button 
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      onClick={() => setSelectedId(chatId)}
                    >
                      <Avatar className="h-12 w-12">
                        {chat.avatarUrl ? (
                          <AvatarImage src={chat.avatarUrl} alt={chat.name} />
                        ) : (
                          <AvatarFallback className="bg-green-500 text-white">
                            {chat.avatarFallback ||
                              (typeof chat.name === "string"
                                ? chat.name.charAt(0)
                                : "?")}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {chat_name}
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {chat.lastMessage?.timestamp
                              ? formatTime(chat.lastMessage.timestamp)
                              : ""}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div
                            className={`text-sm truncate flex-1 pr-2 ${
                              chat.unread
                                ? "text-gray-900 dark:text-white font-medium"
                                : "text-gray-500"
                            }`}
                          >
                            {getLastMessageText(chat.lastMessage)}
                          </div>

                          {chat.unread ? (
                            <Badge className="bg-green-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs p-0 ml-2">
                              {chat.unread}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </button>

                    {/* Кнопка удаления чата */}
                    {onDeleteChat && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteChat(chatId);
                            }}
                            className="text-red-600 focus:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить чат
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Диалог подтверждения удаления */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить чат?</DialogTitle>
            <DialogDescription>
              Это действие нельзя будет отменить. Весь чат будет удален навсегда.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteChat}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
