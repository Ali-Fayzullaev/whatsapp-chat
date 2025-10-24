// src/components/optimized/OptimizedSidebar.tsx
"use client";
import { useState, useMemo, memo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, MessageCircleMore, MoreVertical, Plus, Search, LogOut, Settings, Archive, Users } from "lucide-react";
import { useChats } from "@/hooks/useChats";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { tokenStorage } from "@/lib/token-storage";
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
        flex items-center gap-3 p-3 cursor-pointer transition-all duration-200
        hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-700/50
        ${isSelected ? 
          "bg-gray-100 dark:bg-gray-800/70" : 
          ""
        }
        border-b border-gray-100/50 dark:border-gray-700/30
      `}
    >
      <div className="relative">
        <Avatar className="h-12 w-12 ring-1 ring-gray-200 dark:ring-gray-700">
          <AvatarImage src={chat.avatarUrl} alt={chat.name} />
          <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-medium text-sm">
            {chat.avatarFallback}
          </AvatarFallback>
        </Avatar>
        {/* Индикатор онлайн статуса */}
        {chat.id !== "temp" && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[15px] truncate text-gray-900 dark:text-gray-100">
            {chat.name}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 font-medium">
            {chat.time}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-gray-600 dark:text-gray-400 truncate flex-1 leading-relaxed">
            {typeof chat.lastMessage === 'string' 
              ? chat.lastMessage 
              : chat.lastMessage?.text || "Нажмите, чтобы начать общение"}
          </p>
          
          {(chat.unread ?? 0) > 0 && (
            <div className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full ml-2 flex-shrink-0 min-w-[20px] text-center">
              {(chat.unread ?? 0) > 99 ? "99+" : chat.unread}
            </div>
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
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState("");
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

  // Обработчик создания нового чата
  const handleCreateNewChat = useCallback(() => {
    if (!newChatPhone.trim()) return;
    
    // Очищаем номер от лишних символов
    const cleanPhone = newChatPhone.trim().replace(/[^\d+]/g, '');
    
    // Создаем временный чат ID
    const tempChatId = `temp:${cleanPhone}`;
    
    // Закрываем диалог и очищаем поле
    setShowNewChatDialog(false);
    setNewChatPhone("");
    
    // Переходим к новому чату через query параметр
    router.push(`/?chat=${encodeURIComponent(tempChatId)}`, { scroll: false });
  }, [newChatPhone, router]);

  // Обработчик выбора чата с оптимизацией
  const handleSelectChat = useCallback((chatId: string) => {
    if (chatId === selectedChatId) return; // Избегаем повторной навигации
    
    // Используем query параметр для переключения чата
    router.push(`/?chat=${encodeURIComponent(chatId)}`, { scroll: false });
  }, [router, selectedChatId]);

  // Создание нового чата
  const handleCreateChat = useCallback((phone: string) => {
    const tempChatId = `temp:${phone}`;
    router.push(`/?chat=${encodeURIComponent(tempChatId)}`, { scroll: false });
  }, [router]);

  // Обработчик выхода из системы
  const handleLogout = useCallback(() => {
    // Очищаем токены
    tokenStorage.removeToken();
    
    // Перенаправляем на страницу авторизации
    window.location.href = '/';
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Загрузка...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="h-[60px] bg-[#00a884] dark:bg-[#008069] text-white flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <MessageCircleMore className="h-5 w-5 text-[#00a884]" />
          </div>
          <h1 className="font-medium text-[19px]">WhatsApp</h1>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewChatDialog(true)}
            className="text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full"
            title="Новый чат"
          >
            <Plus className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full"
                title="Меню"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                <span>Новая группа</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="mr-2 h-4 w-4" />
                <span>Архивированные</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Настройки</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-white dark:bg-gray-900">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск или создание чата"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#00a884]/20 transition-all"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 relative">
        {isPending && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#00a884] to-green-600 animate-pulse z-10" />
        )}
        
        <ScrollArea className="h-full">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <MessageCircleMore className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {query ? "Ничего не найдено" : "Добро пожаловать в WhatsApp"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                {query 
                  ? "Попробуйте изменить поисковый запрос или создать новый чат"
                  : "Отправляйте и получайте сообщения без подключения к интернету. Начните с создания нового чата."
                }
              </p>
              
              {query && /^\d{10,11}$/.test(query.replace(/\D/g, "")) && (
                <Button
                  onClick={() => handleCreateChat(query.replace(/\D/g, ""))}
                  className="bg-[#00a884] hover:bg-[#008069] text-white shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Создать чат с {query.replace(/\D/g, "")}
                </Button>
              )}
              
              {!query && (
                <Button
                  onClick={() => setShowNewChatDialog(true)}
                  className="bg-[#00a884] hover:bg-[#008069] text-white shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Начать чат
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900">
              {filteredChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isSelected={chat.id === selectedChatId}
                  onSelect={handleSelectChat}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>



      {/* Диалог нового чата */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-gray-900 dark:text-gray-100">Новый чат</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Введите номер телефона для начала нового чата
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Input
                placeholder="+7 777 123 4567"
                value={newChatPhone}
                onChange={(e) => setNewChatPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateNewChat();
                  }
                }}
                className="text-base py-3 px-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-[#00a884] focus:ring-[#00a884]/20"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Убедитесь, что номер указан в международном формате
            </p>
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewChatDialog(false);
                setNewChatPhone("");
              }}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button 
              onClick={handleCreateNewChat}
              disabled={!newChatPhone.trim()}
              className="flex-1 bg-[#00a884] hover:bg-[#008069] text-white"
            >
              Начать чат
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}