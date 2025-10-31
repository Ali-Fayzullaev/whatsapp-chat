// src/hooks/useMessageSync.ts - Простая система кэширования ответов
"use client";
import { useEffect, useRef, useCallback, useState } from 'react';
import type { Message } from '@/components/chat/types';

interface ReplyCache {
  [messageId: string]: {
    replyTo: {
      id: string;
      author: "me" | "them";
      text: string;
      media?: {
        type: "image" | "video" | "document" | "audio";
        name?: string;
      };
    };
    timestamp: number;
  };
}

interface MessageSyncOptions {
  chatId: string | null;
  messages: Message[];
  isWebSocketConnected: boolean;
  onMessagesUpdate: (messages: Message[]) => void;
  onReloadMessages: () => Promise<void>;
}

export function useMessageSync({
  chatId,
  messages,
  isWebSocketConnected,
  onMessagesUpdate,
  onReloadMessages
}: MessageSyncOptions) {
  // Кэш ответов для восстановления данных
  const replyCache = useRef<ReplyCache>({});
  const lastWebSocketActivity = useRef<number>(Date.now());
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCount = useRef<number>(0);
  const onMessagesUpdateRef = useRef(onMessagesUpdate);
  const onReloadMessagesRef = useRef(onReloadMessages);
  
  // Обновляем refs при изменении функций
  useEffect(() => {
    onMessagesUpdateRef.current = onMessagesUpdate;
  }, [onMessagesUpdate]);
  
  useEffect(() => {
    onReloadMessagesRef.current = onReloadMessages;
  }, [onReloadMessages]);
  
  const [syncStatus, setSyncStatus] = useState<'websocket' | 'polling' | 'offline'>('websocket');
  const [isPolling, setIsPolling] = useState(false);

  // Сохранение информации об ответе в локальный кэш
  const cacheReply = useCallback((messageId: string, replyTo: Message['replyTo']) => {
    if (replyTo && chatId) {
      const cacheKey = `${chatId}-${messageId}`;
      replyCache.current[cacheKey] = {
        replyTo,
        timestamp: Date.now()
      };
      
      // Сохраняем в localStorage для персистентности
      try {
        localStorage.setItem(
          `reply-cache-${chatId}`, 
          JSON.stringify(replyCache.current)
        );
      } catch (error) {
        console.warn('Failed to save reply cache to localStorage:', error);
      }
    }
  }, [chatId]);

  // Восстановление кэша ответов из localStorage
  const loadReplyCache = useCallback(() => {
    if (!chatId) return;
    
    try {
      const cached = localStorage.getItem(`reply-cache-${chatId}`);
      if (cached) {
        replyCache.current = JSON.parse(cached);
        
        // Очищаем старые записи (старше 24 часов)
        const now = Date.now();
        const cleaned: ReplyCache = {};
        
        Object.entries(replyCache.current).forEach(([key, value]) => {
          if (now - value.timestamp < 24 * 60 * 60 * 1000) {
            cleaned[key] = value;
          }
        });
        
        replyCache.current = cleaned;
      }
    } catch (error) {
      console.warn('Failed to load reply cache from localStorage:', error);
      replyCache.current = {};
    }
  }, [chatId]);

  // Обогащение сообщений данными об ответах из кэша
  const enrichMessagesWithReplies = useCallback((msgs: Message[]): Message[] => {
    if (!chatId) return msgs;
    
    return msgs.map(message => {
      // Если у сообщения уже есть replyTo, возвращаем как есть
      if (message.replyTo) return message;
      
      // Ищем в кэше информацию об ответе по разным ключам
      const possibleKeys = [
        `${chatId}-${message.id}`, // временный ID
        `${chatId}-${message.id_message}`, // реальный ID от сервера
      ].filter(Boolean);
      
      for (const cacheKey of possibleKeys) {
        const cachedReply = replyCache.current[cacheKey];
        if (cachedReply) {
          console.log(`🔍 Найден кэш для сообщения ${message.id} по ключу ${cacheKey}:`, cachedReply.replyTo);
          return {
            ...message,
            replyTo: cachedReply.replyTo
          };
        }
      }
      
      return message;
    });
  }, [chatId]);

  // Обнаружение неактивности WebSocket
  const checkWebSocketActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastWebSocketActivity.current;
    const messageCountChanged = messages.length !== lastMessageCount.current;
    
    // Если WebSocket подключен, но нет активности более 5 секунд и есть сообщения
    if (isWebSocketConnected && timeSinceLastActivity > 5000 && messages.length > 0 && !messageCountChanged) {
      if (!isPolling) {
        console.log('🔄 WebSocket неактивен, включаем polling');
        startPolling();
      }
    } else if (messageCountChanged) {
      // Обновляем время последней активности если количество сообщений изменилось
      lastWebSocketActivity.current = now;
      lastMessageCount.current = messages.length;
      
      if (isPolling) {
        console.log('✅ WebSocket активен, отключаем polling');
        stopPolling();
      }
    }
  }, [isWebSocketConnected, messages.length, isPolling]);

  // Запуск polling
  const startPolling = useCallback(() => {
    if (pollingInterval.current || !chatId) return;
    
    setIsPolling(true);
    setSyncStatus('polling');
    
    pollingInterval.current = setInterval(async () => {
      // Проверяем видимость страницы
      if (document.hidden) return;
      
      try {
        console.log('🔄 Выполняем автоматическую перезагрузку сообщений');
        await onReloadMessagesRef.current();
      } catch (error) {
        console.error('Ошибка при автоматической перезагрузке:', error);
      }
    }, 3000); // Каждые 3 секунды
  }, [chatId, onReloadMessages]);

  // Остановка polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    
    setIsPolling(false);
    setSyncStatus(isWebSocketConnected ? 'websocket' : 'offline');
  }, [isWebSocketConnected]);

  // Дедупликация сообщений
  const deduplicateMessages = useCallback((msgs: Message[]): Message[] => {
    const seen = new Set<string>();
    const deduplicated: Message[] = [];
    
    // Сортируем по времени создания
    const sorted = [...msgs].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    
    for (const message of sorted) {
      // Используем id_message как основной идентификатор, fallback на id
      const identifier = message.id_message || message.id;
      
      if (!seen.has(identifier)) {
        seen.add(identifier);
        deduplicated.push(message);
      }
    }
    
    return deduplicated;
  }, []);

  // Загрузка кэша при смене чата
  useEffect(() => {
    loadReplyCache();
  }, [chatId, loadReplyCache]);

  // Мониторинг активности WebSocket
  useEffect(() => {
    const checkInterval = setInterval(checkWebSocketActivity, 2000);
    return () => clearInterval(checkInterval);
  }, [checkWebSocketActivity]);

  // Очистка polling при размонтировании
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Обработка изменения статуса WebSocket
  useEffect(() => {
    if (isWebSocketConnected) {
      lastWebSocketActivity.current = Date.now();
      setSyncStatus('websocket');
    } else {
      setSyncStatus('offline');
      stopPolling();
    }
  }, [isWebSocketConnected, stopPolling]);

  // Обработка изменений в сообщениях
  useEffect(() => {
    if (messages.length === 0) return;
    
    console.log('🔄 useMessageSync: Обрабатываем', messages.length, 'сообщений');
    
    // Дедуплицируем и обогащаем сообщения
    const deduplicated = deduplicateMessages(messages);
    console.log('🔄 useMessageSync: После дедупликации:', deduplicated.length);
    
    const enriched = enrichMessagesWithReplies(deduplicated);
    console.log('🔄 useMessageSync: После обогащения:', enriched.length);
    
    // Проверяем, есть ли реальные изменения (не только JSON)
    const hasChanges = enriched.some((msg, index) => {
      const original = messages[index];
      return !original || 
             msg.id !== original.id ||
             !!msg.replyTo !== !!original.replyTo ||
             (msg.replyTo && original.replyTo && msg.replyTo.id !== original.replyTo.id);
    });
    
    if (hasChanges || enriched.length !== messages.length) {
      console.log('🔄 useMessageSync: Обновляем сообщения, изменения найдены');
      onMessagesUpdateRef.current(enriched);
    }
  }, [messages, deduplicateMessages, enrichMessagesWithReplies]);

  return {
    cacheReply,
    syncStatus,
    isPolling,
    startPolling,
    stopPolling,
    enrichMessagesWithReplies,
    deduplicateMessages
  };
}