// src/hooks/useChats.ts
"use client";
import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { ApiClient } from "@/lib/api-client";
import { useWebSocketChats } from "./useWebSocketChats";
import { useUnreadMessages } from "./useUnreadMessages";
import { FEATURES } from "@/config/features";
import type { Chat, Message } from "@/components/chat/types";

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  
  // Интеграция с системой непрочитанных сообщений
  const { 
    addUnreadMessage, 
    markChatAsRead: markUnreadChatAsRead, 
    getUnreadCount 
  } = useUnreadMessages();
  
  // Флаг для предотвращения циклических обновлений
  const updatingUnreadRef = useRef(false);

  // WebSocket обработчики
  const handleChatUpdated = useCallback((updatedChat: Chat) => {
    startTransition(() => {
      setChats(prev => prev.map(chat => 
        chat.id === updatedChat.id ? { ...chat, ...updatedChat } : chat
      ));
    });
  }, []);

  const handleNewMessage = useCallback((chatId: string, message: Message) => {
    // Добавляем в систему непрочитанных сообщений, если сообщение от собеседника
    let isNewUnread = false;
    if (message.author === 'them' && message.id) {
      addUnreadMessage(message.id, chatId);
      isNewUnread = true;
    }
    
    startTransition(() => {
      setChats(prev => {
        let updatedChat: Chat | null = null;
        
        // Обновляем чат с новым сообщением
        const updated = prev.map(chat => {
          if (chat.id === chatId || chat.chat_id === chatId) {
            // Получаем количество непрочитанных сообщений, учитывая новое
            const currentUnread = chat.unread || 0;
            const newUnreadCount = isNewUnread ? currentUnread + 1 : currentUnread;
            
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
              unread: newUnreadCount,
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
        
        // ВАЖНО: Если чат не найден, создаем новый чат для входящего сообщения
        if (message.author === 'them') {
          console.log(`🆕 Creating new chat for incoming message from ${chatId}`);
          
          // Извлекаем имя отправителя
          const senderName = typeof message.sender === 'string' 
            ? message.sender 
            : typeof message.sender === 'object' && message.sender?.name
            ? message.sender.name
            : chatId.replace('@c.us', '');
          
          const newChat: Chat = {
            id: chatId,
            chat_id: chatId,
            name: senderName,
            avatarFallback: senderName.charAt(0).toUpperCase(),
            lastMessage: {
              text: message.text || '',
              timestamp: message.timestamp || new Date().toISOString(),
              sender: message.sender,
              direction: message.direction,
              id_message: message.id_message
            },
            time: message.timestamp || new Date().toISOString(),
            unread: isNewUnread ? 1 : 0,
            updatedAt: message.createdAt || Date.now(),
            is_group: false
          };
          
          return [newChat, ...prev];
        }
        
        return updated;
      });
    });
  }, [addUnreadMessage, getUnreadCount]);

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

  const loadChats = useCallback(async (silent = false, search?: string) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const chatsData = await ApiClient.getChats(search);
      
      startTransition(() => {
        // Добавляем счетчики непрочитанных сообщений к чатам
        const chatsWithUnread = chatsData.map(chat => ({
          ...chat,
          unread: getUnreadCount(chat.id || chat.chat_id)
        }));
        
        // Сортируем чаты: сначала по непрочитанным, затем по времени последнего обновления
        const sortedChats = chatsWithUnread.sort((a, b) => {
          // Приоритет: чаты с непрочитанными сообщениями идут первыми
          const aHasUnread = (a.unread ?? 0) > 0;
          const bHasUnread = (b.unread ?? 0) > 0;
          
          if (aHasUnread !== bHasUnread) {
            return bHasUnread ? 1 : -1; // Чаты с непрочитанными сначала
          }
          
          // Если оба прочитаны или оба непрочитаны, сортируем по времени
          const timeA = a.updatedAt || new Date(a.time || 0).getTime() || 0;
          const timeB = b.updatedAt || new Date(b.time || 0).getTime() || 0;
          return timeB - timeA; // Новые сверху
        });
        
        setChats(sortedChats);
        setIsInitialLoaded(true); // Помечаем что данные загружены
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load chats";
      setError(errorMessage);
      console.error("Load chats error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [getUnreadCount]);

  // Функция поиска с дебаунсом
  const searchChats = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      const chatsData = await ApiClient.getChats(searchQuery);
      
      startTransition(() => {
        // Добавляем счетчики непрочитанных сообщений к чатам
        const chatsWithUnread = chatsData.map(chat => ({
          ...chat,
          unread: getUnreadCount(chat.id || chat.chat_id)
        }));
        
        // Сортируем чаты: сначала по непрочитанным, затем по времени последнего обновления
        const sortedChats = chatsWithUnread.sort((a, b) => {
          // Приоритет: чаты с непрочитанными сообщениями идут первыми
          const aHasUnread = (a.unread ?? 0) > 0;
          const bHasUnread = (b.unread ?? 0) > 0;
          
          if (aHasUnread !== bHasUnread) {
            return bHasUnread ? 1 : -1; // Чаты с непрочитанными сначала
          }
          
          // Если оба прочитаны или оба непрочитаны, сортируем по времени
          const timeA = a.updatedAt || new Date(a.time || 0).getTime() || 0;
          const timeB = b.updatedAt || new Date(b.time || 0).getTime() || 0;
          return timeB - timeA; // Новые сверху
        });
        
        setChats(sortedChats);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to search chats";
      setError(errorMessage);
      console.error("Search chats error:", err);
    } finally {
      setLoading(false);
    }
  }, [getUnreadCount]);

  // Первичная загрузка чатов (только один раз при монтировании)
  useEffect(() => {
    loadChats();
  }, []); // Убираем loadChats из зависимостей

  // HTTP polling fallback только когда WebSocket отключен или не работает
  useEffect(() => {
    // Не запускаем polling если данные еще не загружены первый раз
    if (!isInitialLoaded) return;
    
    // HTTP polling используется только если:
    // 1. WebSocket полностью отключен в конфигурации ИЛИ
    // 2. WebSocket включен, но не подключен
    const shouldUsePolling = !FEATURES.WEBSOCKET_ENABLED || (FEATURES.WEBSOCKET_ENABLED && !isConnected);
    
    if (shouldUsePolling) {
      console.log("📡 Using HTTP polling for chats - WebSocket not connected");
      
      const interval = setInterval(async () => {
        if (document.visibilityState === "visible") {
          try {
            const chatsData = await ApiClient.getChats();
            
            startTransition(() => {
              // Добавляем счетчики непрочитанных сообщений к чатам
              const chatsWithUnread = chatsData.map(chat => ({
                ...chat,
                unread: getUnreadCount(chat.id || chat.chat_id)
              }));
              
              // Сортируем чаты: сначала по непрочитанным, затем по времени последнего обновления
              const sortedChats = chatsWithUnread.sort((a, b) => {
                // Приоритет: чаты с непрочитанными сообщениями идут первыми
                const aHasUnread = (a.unread ?? 0) > 0;
                const bHasUnread = (b.unread ?? 0) > 0;
                
                if (aHasUnread !== bHasUnread) {
                  return bHasUnread ? 1 : -1; // Чаты с непрочитанными сначала
                }
                
                // Если оба прочитаны или оба непрочитаны, сортируем по времени
                const timeA = a.updatedAt || new Date(a.time || 0).getTime() || 0;
                const timeB = b.updatedAt || new Date(b.time || 0).getTime() || 0;
                return timeB - timeA; // Новые сверху
              });
              
              setChats(sortedChats);
            });
          } catch (err) {
            console.error("HTTP polling error:", err);
          }
        }
      }, FEATURES.HTTP_POLLING_INTERVAL);

      return () => clearInterval(interval);
    } else {
      console.log("🔌 Using WebSocket for real-time chat updates - HTTP polling disabled");
    }
  }, [isConnected, isInitialLoaded, getUnreadCount]);

  // TODO: Добавить обновление счетчиков непрочитанных сообщений
  // после исправления циклических зависимостей

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
  const markChatAsRead = useCallback((chatId: string) => {
    // Помечаем чат как прочитанный в системе непрочитанных сообщений
    markUnreadChatAsRead(chatId);
    
    startTransition(() => {
      setChats(prev => prev.map(chat => 
        (chat.id === chatId || chat.chat_id === chatId) 
          ? { ...chat, unread: 0 } 
          : chat
      ));
    });
  }, [markUnreadChatAsRead]);

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