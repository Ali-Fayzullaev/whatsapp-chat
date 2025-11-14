// src/components/optimized/OptimizedSidebar.tsx
"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useChatContext } from "@/providers/ChatProvider";
import type { Chat } from "@/components/chat/types";
import { DEFAULT_GROUP_AVATAR, DEFAULT_USER_AVATAR } from "@/lib/avatar-assets";
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Users,
  Wifi,
  WifiOff,
  MessageCircleMore,
} from "lucide-react";

interface OptimizedSidebarProps {
  selectedChatId?: string;
}

const getDisplayName = (chat: Chat): string => {
  if (chat.name && chat.name.trim().length > 0) {
    return chat.name;
  }
  if (chat.phone && chat.phone.trim().length > 0) {
    return chat.phone;
  }
  const chatId = chat.id || chat.chat_id;
  if (!chatId) return "Неизвестный чат";
  return chatId.replace("@c.us", "").replace("@g.us", "");
};

const getLastMessagePreview = (chat: Chat): string => {
  const last = chat.lastMessage;
  if (!last) return "Нет сообщений";
  if (typeof last === "string") return last;

  if (typeof last === "object" && last !== null) {
    if (last.text && last.text.trim().length > 0) return last.text;

    if (last.type) {
      switch (last.type) {
        case "image":
          return "🖼️ Изображение";
        case "video":
          return "🎬 Видео";
        case "audio":
          return "🎵 Аудио";
        case "document":
          return last.media?.name ? `📎 ${last.media.name}` : "📎 Документ";
        default:
          break;
      }
    }

    if (last.media) {
      if (last.media.type === "image") return "🖼️ Изображение";
      if (last.media.type === "video") return "🎬 Видео";
      if (last.media.type === "audio") return "🎵 Аудио";
      return last.media.name ? `📎 ${last.media.name}` : "📎 Медиа";
    }
  }

  return "Сообщение";
};

const getAvatarSource = (chat: Chat): string | undefined => {
  if (chat.avatarUrl && chat.avatarUrl.trim().length > 0) {
    return chat.avatarUrl;
  }
  const chatId = chat.id || chat.chat_id || "";
  const isGroup = chat.is_group || chatId.endsWith("@g.us");
  return isGroup ? DEFAULT_GROUP_AVATAR : DEFAULT_USER_AVATAR;
};

const getAvatarFallback = (chat: Chat): string => {
  if (chat.avatarFallback && chat.avatarFallback.trim().length > 0) {
    return chat.avatarFallback.toUpperCase().slice(0, 2);
  }
  const name = getDisplayName(chat);
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
};

const formatTime = (timestamp?: string, updatedAt?: number): string => {
  const reference = updatedAt ? new Date(updatedAt) : timestamp ? new Date(timestamp) : null;
  if (!reference) return "";

  const now = new Date();
  const diffMs = now.getTime() - reference.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "сейчас";
  if (diffMinutes < 60) return `${diffMinutes} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) {
    return reference.toLocaleDateString("ru-RU", { weekday: "short" });
  }

  return reference.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
};

export default function OptimizedSidebar({ selectedChatId }: OptimizedSidebarProps) {
  const {
    chats,
    loading,
    error,
    isPending,
    loadChats,
    createChat,
    deleteChat,
    markChatAsRead,
    isConnected,
    isRealTime,
  } = useChatContext();
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Нормализуем выбранный чат (из query приходит закодированная строка)
  const normalizedSelectedId = useMemo(() => {
    if (!selectedChatId) return undefined;
    try {
      return decodeURIComponent(selectedChatId);
    } catch {
      return selectedChatId;
    }
  }, [selectedChatId]);

  const filteredChats = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter((chat) => {
      const name = getDisplayName(chat).toLowerCase();
      const lastMessage = getLastMessagePreview(chat).toLowerCase();
      const chatId = (chat.id || chat.chat_id || "").toLowerCase();
      return (
        name.includes(term) ||
        lastMessage.includes(term) ||
        chatId.includes(term)
      );
    });
  }, [chats, searchTerm]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      const target = chatId || "";
      router.push(`${pathname}?chat=${encodeURIComponent(target)}`);
      markChatAsRead(target);
    },
    [router, pathname, markChatAsRead]
  );

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadChats(false);
      addToast({
        type: "success",
        title: "Чаты обновлены",
        description: "Список чатов успешно обновлен",
      });
    } catch (err) {
      console.error("Failed to refresh chats", err);
      addToast({
        type: "error",
        title: "Не удалось обновить",
        description: err instanceof Error ? err.message : "Попробуйте снова позже",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [loadChats, addToast]);

  const handleCreateChat = useCallback(async () => {
    const phone = window.prompt("Введите номер телефона для нового чата");
    if (!phone) return;

    try {
      const tempChatId = await createChat(phone);
      addToast({
        type: "info",
        title: "Чат создается",
        description: "После отправки первого сообщения чат появится в списке",
      });
      router.push(`${pathname}?chat=${encodeURIComponent(tempChatId)}`);
    } catch (err) {
      console.error("Failed to create chat", err);
      addToast({
        type: "error",
        title: "Не удалось создать чат",
        description: err instanceof Error ? err.message : "Попробуйте снова",
      });
    }
  }, [createChat, addToast, router, pathname]);

  useEffect(() => {
    if (error) {
      addToast({
        type: "error",
        title: "Ошибка загрузки чатов",
        description: error,
      });
    }
  }, [error, addToast]);

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Чаты</span>
              {isRealTime && (
                <Badge className="bg-emerald-500 text-white">real-time</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isConnected ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Wifi className="h-3 w-3" />
                  Онлайн
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500">
                  <WifiOff className="h-3 w-3" />
                  Ожидание соединения
                </span>
              )}
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 dark:text-gray-400">{chats.length} чатов</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-500 hover:text-blue-600"
              onClick={handleRefresh}
              disabled={isRefreshing || loading || isPending}
              title="Обновить чаты"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-500 hover:text-emerald-600"
              onClick={handleCreateChat}
              title="Создать новый чат"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Поиск по чатам"
            className="pl-9 pr-3 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/60 focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {loading && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Загрузка чатов...</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3 px-6 text-center">
              <MessageCircleMore className="h-6 w-6" />
              <span className="text-sm">
                {searchTerm ? "Чаты не найдены. Попробуйте изменить запрос." : "Чатов пока нет. Создайте новый, чтобы начать общение."}
              </span>
            </div>
          ) : (
            <ul className="space-y-1 px-2">
              {filteredChats.map((chat) => {
                const chatId = chat.id || chat.chat_id;
                if (!chatId) return null;
                const isGroup = chat.is_group || chatId.endsWith("@g.us");
                const isSelected = normalizedSelectedId === chatId;
                const unread = chat.unread ?? 0;

                return (
                  <li key={chatId}>
                    <button
                      type="button"
                      onClick={() => handleSelectChat(chatId)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-200 text-left
                        ${isSelected ? "bg-emerald-50 dark:bg-emerald-900/30 shadow-sm" : "hover:bg-gray-100 dark:hover:bg-gray-800/60"}
                        ${unread > 0 ? "border border-emerald-200 dark:border-emerald-800" : "border border-transparent"}
                      `}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12 ring-1 ring-gray-200/60 dark:ring-gray-700/60">
                          <AvatarImage src={getAvatarSource(chat)} alt={getDisplayName(chat)} />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-semibold">
                            {getAvatarFallback(chat)}
                          </AvatarFallback>
                        </Avatar>
                        {isGroup && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 shadow-md">
                            <Users className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm ${unread > 0 ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-800 dark:text-gray-100"}`}>
                            {getDisplayName(chat)}
                          </span>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">
                            {formatTime(chat.time, chat.updatedAt)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <p className={`flex-1 truncate text-xs ${unread > 0 ? "text-gray-700 dark:text-gray-200" : "text-gray-500 dark:text-gray-400"}`}>
                            {getLastMessagePreview(chat)}
                          </p>
                          {unread > 0 && (
                            <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>Подключение: {isConnected ? "активно" : "ожидание"}</span>
          <span>Непрочитанных: {chats.reduce((acc, chat) => acc + (chat.unread ?? 0), 0)}</span>
        </div>
      </div>
    </div>
  );
}
