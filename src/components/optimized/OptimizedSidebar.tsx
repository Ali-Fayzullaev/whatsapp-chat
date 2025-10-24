// src/components/optimized/OptimizedSidebar.tsx
"use client";
import { useState, useMemo, memo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, MessageCircleMore, MoreVertical, Plus, Search } from "lucide-react";
import { useChats } from "@/hooks/useChats";

import { DevDiagnostic } from "@/components/DevDiagnostic";
import type { Chat } from "@/components/chat/types";

// Мемоизированный компонент чата
const ChatItem = memo(({ 
  chat, 
  isSelected, 
  onSelect 
}: { 
  chat: Chat; 
  isSelected: boolean; 
  onSelect: (id: string) => void;
}) => {
  const handleClick = useCallback(() => {
    onSelect(chat.id);
  }, [chat.id, onSelect]);

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center gap-3 p-4 cursor-pointer transition-colors duration-200
        hover:bg-gray-50 dark:hover:bg-gray-800/50
        ${isSelected ? 
          "bg-green-50 dark:bg-green-900/20 border-r-2 border-green-500" : 
          ""
        }
      `}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={chat.avatarUrl} alt={chat.name} />
        <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
          {chat.avatarFallback}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
            {chat.name}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
            {chat.time}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
            {typeof chat.lastMessage === 'string' 
              ? chat.lastMessage 
              : chat.lastMessage?.text || "Нет сообщений"}
          </p>
          
          {(chat.unread ?? 0) > 0 && (
            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs ml-2 flex-shrink-0">
              {(chat.unread ?? 0) > 99 ? "99+" : chat.unread}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});

ChatItem.displayName = "ChatItem";

interface OptimizedSidebarProps {
  selectedChatId?: string;
}

export function OptimizedSidebar({ selectedChatId }: OptimizedSidebarProps) {
  const [query, setQuery] = useState("");
  const { chats, loading, isPending } = useChats();
  const router = useRouter();

  // Фильтрация чатов с мемоизацией
  const filteredChats = useMemo(() => {
    if (!query.trim()) return chats;
    
    const searchTerm = query.toLowerCase();
    return chats.filter(chat => {
      const lastMessageText = typeof chat.lastMessage === 'string' 
        ? chat.lastMessage 
        : chat.lastMessage?.text || "";
      
      return (
        (chat.name ?? "").toLowerCase().includes(searchTerm) ||
        (chat.phone ?? "").includes(searchTerm) ||
        lastMessageText.toLowerCase().includes(searchTerm)
      );
    });
  }, [chats, query]);

  // Обработчик выбора чата с оптимизацией
  const handleSelectChat = useCallback((chatId: string) => {
    if (chatId === selectedChatId) return; // Избегаем повторной навигации
    
    // Используем router.replace для мгновенного переключения без истории
    router.replace(`/${encodeURIComponent(chatId)}`, { scroll: false });
  }, [router, selectedChatId]);

  // Создание нового чата
  const handleCreateChat = useCallback((phone: string) => {
    const tempChatId = `temp:${phone}`;
    router.push(`/${encodeURIComponent(tempChatId)}`, { scroll: false });
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Загрузка...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="h-14 bg-green-600 dark:bg-green-700 text-white flex items-center justify-between px-4">
        <h1 className="font-semibold text-lg">WhatsApp</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-green-700 dark:hover:bg-green-600"
          >
            <MessageCircleMore className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-green-700 dark:hover:bg-green-600"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 bg-gray-50 dark:bg-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск или создание чата"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {isPending && (
          <div className="absolute inset-x-0 top-0 h-1 bg-green-500/20 animate-pulse z-10" />
        )}
        
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageCircleMore className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {query ? "Ничего не найдено" : "Нет чатов"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {query 
                  ? "Попробуйте изменить поисковый запрос"
                  : "Начните общение, создав новый чат"
                }
              </p>
              
              {query && /^\d{10,11}$/.test(query.replace(/\D/g, "")) && (
                <Button
                  onClick={() => handleCreateChat(query.replace(/\D/g, ""))}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Создать чат с {query.replace(/\D/g, "")}
                </Button>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={chat.id === selectedChatId}
                onSelect={handleSelectChat}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Debug Panel */}
      <div className="p-2 border-t space-y-2">

        <DevDiagnostic />
      </div>
    </div>
  );
}