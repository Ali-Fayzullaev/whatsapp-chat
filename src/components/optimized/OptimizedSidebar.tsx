// src/components/optimized/OptimizedSidebar.tsx
"use client";
import { useState, useMemo, memo, useCallback, useEffect } from "react";
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
import { useToast } from "@/components/ui/toast";
import { ApiClient } from "@/lib/api-client";
import { formatChatTime } from "@/utils/dateFormat";
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
        flex items-center gap-3 p-3 cursor-pointer 
        transition-all duration-300 ease-out
        hover:bg-gray-50 dark:hover:bg-gray-800/50 
        active:bg-gray-100 dark:active:bg-gray-700/50
        ${isSelected ? 
          "bg-gray-100 dark:bg-gray-800/70 transform scale-[0.99]" : 
          "hover:transform hover:scale-[0.995]"
        }
        border-b border-gray-100/50 dark:border-gray-700/30
        animate-in slide-in-from-top-2 duration-300
      `}
    >
      <div className="relative">
        <Avatar className="h-12 w-12 ring-1 ring-gray-200 dark:ring-gray-700">
          <AvatarImage src={chat.avatarUrl} alt={chat.name} />
          <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-medium text-sm">
            {chat.avatarFallback}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[15px] truncate text-gray-900 dark:text-gray-100">
            {chat.name}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 font-medium">
            {chat.time ? formatChatTime(chat.time) : ''}
          </span>
        </div>
        
        <div className="flex items-center justify-between w-[300px]">
          <p className="text-[13px] text-gray-600 dark:text-gray-400 truncate flex-1">
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
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { chats, loading, isPending, searchChats, markChatAsRead } = useChats();
  const { addToast } = useToast();
  const router = useRouter();

  // Дебаунс для поиска (2.5 секунды задержки)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchChats(query.trim());
      }
    }, 2500); // 2.5 секунды задержка

    return () => clearTimeout(timer);
  }, [query, searchChats]);

  // Обработчик изменения поискового запроса
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Если очистили поиск, загружаем все чаты
    if (!value.trim()) {
      searchChats('');
    }
  }, [searchChats]);

  // Теперь просто показываем все чаты (фильтрация происходит на сервере)
  const filteredChats = useMemo(() => {
    return chats;
  }, [chats]);

  // Обработчик создания нового чата с проверкой номера
  const handleCreateNewChat = useCallback(async () => {
    if (!newChatPhone.trim()) return;
    
    // Очищаем номер от лишних символов
    const cleanPhone = newChatPhone.trim().replace(/[^\d+]/g, '');
    
    if (!cleanPhone) {
      addToast({
        type: "error",
        title: "Неверный номер",
        description: "Пожалуйста, введите корректный номер телефона"
      });
      return;
    }
    
    setIsCreatingChat(true);
    
    try {
      // Проверяем номер через API
      const apiPhone = cleanPhone.includes('@c.us') ? cleanPhone : `${cleanPhone}@c.us`;
      const result = await ApiClient.startChat(apiPhone);
      
      if (result?.chat_id) {
        // Номер существует, создаем реальный чат
        const realChatId = String(result.chat_id);
        
        // Закрываем диалог и очищаем поле
        setShowNewChatDialog(false);
        setNewChatPhone("");
        
        addToast({
          type: "success",
          title: "Чат создан",
          description: `Чат с номером ${cleanPhone} успешно создан`
        });
        
        // Переходим к реальному чату
        router.push(`/?chat=${encodeURIComponent(realChatId)}`, { scroll: false });
      } else {
        throw new Error("Номер телефона не зарегистрирован в WhatsApp");
      }
    } catch (error) {
      console.error("Ошибка создания чата:", error);
      
      let errorMessage = "Не удалось создать чат";
      if (error instanceof Error) {
        if (error.message.includes("422") || error.message.includes("404") || 
            error.message.includes("не зарегистрирован")) {
          errorMessage = `Номер ${cleanPhone} не зарегистрирован в WhatsApp`;
        } else {
          errorMessage = error.message;
        }
      }
      
      addToast({
        type: "error",
        title: "Ошибка создания чата",
        description: errorMessage
      });
    } finally {
      setIsCreatingChat(false);
    }
  }, [newChatPhone, router, addToast]);

  // Обработчик выбора чата с оптимизацией
  const handleSelectChat = useCallback((chatId: string) => {
    if (chatId === selectedChatId) return; // Избегаем повторной навигации
    
    // Сбрасываем непрочитанные сообщения
    markChatAsRead(chatId);
    
    // Используем query параметр для переключения чата
    router.push(`/?chat=${encodeURIComponent(chatId)}`, { scroll: false });
  }, [router, selectedChatId, markChatAsRead]);

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
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        <div className="h-[60px] bg-[#00a884] dark:bg-[#008069]"></div>
        <div className="flex items-center justify-center h-full">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header - фиксированная высота */}
      <div className="h-[60px] bg-[#00a884] dark:bg-[#008069] text-white flex items-center justify-between px-4 shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <MessageCircleMore className="h-5 w-5 text-[#00a884]" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-medium text-[19px]">WhatsApp</h1>
            {/* <WebSocketConnectionStatus /> */}
          </div>
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
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-muted">
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

      {/* 🔹 Telegram Style: Поиск */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={handleSearchChange}
            placeholder="Поиск"
            className="pl-10 rounded-2xl bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Chat List - растягиваемая область со скроллом */}
      <div className="flex-1 min-h-0 relative"> {/* Важно: min-h-0 для правильного flexbox */}
        {isPending && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#00a884] to-green-600 animate-pulse z-10" />
        )}
        
        <ScrollArea className="h-full"> {/* Теперь высота будет корректной */}
          <div className="bg-white dark:bg-gray-900">
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
              <>
                {filteredChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isSelected={chat.id === selectedChatId}
                    onSelect={handleSelectChat}
                  />
                ))}
              </>
            )}
          </div>
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
                  if (e.key === 'Enter' && !isCreatingChat) {
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
              disabled={!newChatPhone.trim() || isCreatingChat}
              className="flex-1 bg-[#00a884] hover:bg-[#008069] text-white"
            >
              {isCreatingChat ? "Проверяем номер..." : "Начать чат"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}