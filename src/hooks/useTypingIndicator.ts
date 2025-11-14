// src/hooks/useTypingIndicator.ts
"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';

interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

interface TypingEvent {
  type: 'typing.start' | 'typing.stop';
  chat_id: string;
  user_id: string;
  user_name?: string;
}

export function useTypingIndicator(chatId: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const { isConnected, onMessage, offMessage } = useWebSocket();
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Очистка старых пользователей (если не отправили typing.stop в течение 5 секунд)
  const clearExpiredTyping = useCallback(() => {
    const now = Date.now();
    setTypingUsers(prev => prev.filter(user => now - user.timestamp < 5000));
  }, []);

  // Обработчик WebSocket событий печати
  const handleTypingEvent = useCallback((data: any) => {
    if (!data || data.chat_id !== chatId) return;

    const event = data as TypingEvent;
    const rawUserId = event.user_id;

    if (!rawUserId && !event.user_name) {
      console.warn("⚠️ typing event without user identifier", event);
      return;
    }

    const userId = rawUserId || `temp-${event.user_name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`;
    const userName = event.user_name?.trim() || userId.replace('@c.us', '');

    if (event.type === 'typing.start') {
      setTypingUsers(prev => {
        // Удаляем пользователя если он уже есть, затем добавляем с новым timestamp
        const filtered = prev.filter(user => user.id !== userId);
        return [...filtered, {
          id: userId,
          name: userName,
          timestamp: Date.now()
        }];
      });

      // Устанавливаем таймаут для автоматического удаления
      const existingTimeout = typingTimeouts.current.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        setTypingUsers(prev => prev.filter(user => user.id !== userId));
        typingTimeouts.current.delete(userId);
      }, 5000); // 5 секунд

      typingTimeouts.current.set(userId, timeout);

    } else if (event.type === 'typing.stop') {
      setTypingUsers(prev => prev.filter(user => user.id !== userId));
      
      const existingTimeout = typingTimeouts.current.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeouts.current.delete(userId);
      }
    }
  }, [chatId]);

  // Подключение к WebSocket событиям
  useEffect(() => {
    if (isConnected && chatId) {
      onMessage(handleTypingEvent);
      
      // Периодическая очистка старых пользователей
      const cleanupInterval = setInterval(clearExpiredTyping, 2000);
      
      return () => {
        offMessage(handleTypingEvent);
        clearInterval(cleanupInterval);
        
        // Очищаем все таймауты
        typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
        typingTimeouts.current.clear();
      };
    }
  }, [isConnected, chatId, onMessage, offMessage, handleTypingEvent, clearExpiredTyping]);

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
      typingTimeouts.current.clear();
    };
  }, []);

  // Функция для отправки события печати (когда пользователь печатает)
  const sendTypingStart = useCallback(() => {
    // TODO: Отправить WebSocket событие о начале печати
    // Это будет зависеть от API бэкенда
    console.log(`User started typing in chat ${chatId}`);
  }, [chatId]);

  const sendTypingStop = useCallback(() => {
    // TODO: Отправить WebSocket событие об окончании печати
    console.log(`User stopped typing in chat ${chatId}`);
  }, [chatId]);

  return {
    typingUsers,
    sendTypingStart,
    sendTypingStop,
    isConnected
  };
}