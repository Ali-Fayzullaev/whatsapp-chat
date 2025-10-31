// src/hooks/useChats.ts
"use client";
import { useState, useEffect, useTransition, useCallback } from "react";
import { ApiClient } from "@/lib/api-client";
import { useWebSocketChats } from "./useWebSocketChats";
import { FEATURES } from "@/config/features";
import type { Chat, Message } from "@/components/chat/types";

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // WebSocket обработчики
  const handleChatUpdated = useCallback((updatedChat: Chat) => {
    startTransition(() => {
      setChats(prev => prev.map(chat => 
        chat.id === updatedChat.id ? { ...chat, ...updatedChat } : chat
      ));
    });
  }, []);

  const handleNewMessage = useCallback((chatId: string, message: Message) => {
    startTransition(() => {
      setChats(prev => {
        let updatedChat: Chat | null = null;
        
        // Обновляем чат с новым сообщением
        const updated = prev.map(chat => {
          if (chat.id === chatId || chat.chat_id === chatId) {
            updatedChat = { 
              ...chat, 
              lastMessage: {
                text: message.text || '',
                timestamp: message.timestamp || new Date().toISOString(),
                sender: message.sender,
                direction: message.direction,
                id_message: message.id_message
              },
              time: message.timestamp || new Date().toISOString(),
              unread: message.author === 'them' ? (chat.unread || 0) + 1 : chat.unread,
              updatedAt: message.createdAt || Date.now()
            };
            return updatedChat;
          }
          return chat;
        });
        
        // Если нашли обновленный чат, поднимаем его наверх
        if (updatedChat) {
          const otherChats = updated.filter(chat => 
            chat.id !== chatId && chat.chat_id !== chatId
          );
          return [updatedChat, ...otherChats];
        }
        
        return updated;
      });
    });
  }, []);

  const handleNewChat = useCallback((newChat: Chat) => {
    startTransition(() => {
      setChats(prev => {
        // Проверяем, не существует ли уже такой чат
        const exists = prev.some(chat => chat.id === newChat.id);
        if (exists) return prev;
        return [newChat, ...prev];
      });
    });
  }, []);

  const handleChatDeleted = useCallback((chatId: string) => {
    startTransition(() => {
      setChats(prev => prev.filter(chat => chat.id !== chatId));
    });
  }, []);

  const handleChatsUpdate = useCallback((newChats: Chat[]) => {
    startTransition(() => {
      setChats(newChats);
    });
  }, []);

  // Подключаем WebSocket
  const { isConnected, isRealTime } = useWebSocketChats({
    onChatUpdated: handleChatUpdated,
    onNewMessage: handleNewMessage,
    onNewChat: handleNewChat,
    onChatDeleted: handleChatDeleted,
    onChatsUpdate: handleChatsUpdate,
  });

  const loadChats = async (silent = false, search?: string) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const chatsData = await ApiClient.getChats(search);
      
      startTransition(() => {
        // Сортируем чаты по времени последнего обновления (новые сверху)
        const sortedChats = chatsData.sort((a, b) => {
          const timeA = a.updatedAt || new Date(a.time || 0).getTime() || 0;
          const timeB = b.updatedAt || new Date(b.time || 0).getTime() || 0;
          return timeB - timeA; // Новые сверху
        });
        
        setChats(sortedChats);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load chats";
      setError(errorMessage);
      console.error("Load chats error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Функция поиска с дебаунсом
  const searchChats = useCallback(async (searchQuery: string) => {
    await loadChats(false, searchQuery);
  }, []);

  // Первичная загрузка чатов
  useEffect(() => {
    loadChats();
  }, []);

  // HTTP polling fallback когда WebSocket не подключен
  useEffect(() => {
    if (!FEATURES.WEBSOCKET_ENABLED || !isConnected) {
      console.log("📡 Using HTTP polling for chats");
      
      const interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          loadChats(true); // silent reload
        }
      }, FEATURES.HTTP_POLLING_INTERVAL);

      return () => clearInterval(interval);
    } else {
      console.log("🔌 Using WebSocket for real-time chat updates");
    }
  }, [isConnected]);

  // Обновление конкретного чата
  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    startTransition(() => {
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, ...updates } : chat
      ));
    });
  };

  // Добавление нового чата
  const addChat = (chat: Chat) => {
    startTransition(() => {
      setChats(prev => [chat, ...prev]);
    });
  };

  // Создание нового чата
  const createChat = async (phone: string): Promise<string> => {
    const normalizePhone = (raw: string) => {
      let p = raw.trim().replace(/\D/g, "");
      if (p.length === 11) return p;
      if (p.length === 10) return "7" + p;
      return p;
    };

    const normalizedPhone = normalizePhone(phone);
    const tempChatId = `temp:${normalizedPhone}`;
    
    return tempChatId;
  };

  // Сброс непрочитанных сообщений
  const markChatAsRead = (chatId: string) => {
    startTransition(() => {
      setChats(prev => prev.map(chat => 
        (chat.id === chatId || chat.chat_id === chatId) 
          ? { ...chat, unread: 0 } 
          : chat
      ));
    });
  };

  // Удаление чата
  const deleteChat = async (chatId: string): Promise<boolean> => {
    try {
      await ApiClient.deleteChat(chatId);
      
      startTransition(() => {
        setChats(prev => prev.filter(chat => chat.id !== chatId));
      });
      
      return true;
    } catch (err) {
      console.error("Delete chat error:", err);
      return false;
    }
  };

  return {
    chats,
    loading,
    error,
    isPending,
    loadChats,
    searchChats,
    updateChat,
    addChat,
    createChat,
    deleteChat,
    markChatAsRead,
    // WebSocket статус
    isConnected,
    isRealTime,
  };
}