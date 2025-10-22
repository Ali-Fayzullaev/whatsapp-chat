// src/hooks/useUnreadMessages.ts
"use client";

import { useState, useEffect, useCallback } from 'react';

export interface UnreadMessage {
  messageId: string;
  chatId: string;
  timestamp: number;
}

// Ключи для localStorage
const UNREAD_MESSAGES_KEY = 'whatsapp_unread_messages';
const LAST_READ_TIMESTAMPS_KEY = 'whatsapp_last_read_timestamps';

export function useUnreadMessages() {
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, number>>({});

  // Загрузка данных из localStorage при инициализации
  useEffect(() => {
    const savedUnread = localStorage.getItem(UNREAD_MESSAGES_KEY);
    const savedTimestamps = localStorage.getItem(LAST_READ_TIMESTAMPS_KEY);
    
    if (savedUnread) {
      try {
        setUnreadMessages(JSON.parse(savedUnread));
      } catch (e) {
        console.error('Error parsing unread messages:', e);
      }
    }
    
    if (savedTimestamps) {
      try {
        setLastReadTimestamps(JSON.parse(savedTimestamps));
      } catch (e) {
        console.error('Error parsing last read timestamps:', e);
      }
    }
  }, []);

  // Сохранение данных в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(UNREAD_MESSAGES_KEY, JSON.stringify(unreadMessages));
  }, [unreadMessages]);

  useEffect(() => {
    localStorage.setItem(LAST_READ_TIMESTAMPS_KEY, JSON.stringify(lastReadTimestamps));
  }, [lastReadTimestamps]);

  // Добавление непрочитанного сообщения
  const addUnreadMessage = useCallback((messageId: string, chatId: string) => {
    const timestamp = Date.now();
    setUnreadMessages(prev => {
      // Проверяем, не добавлено ли уже это сообщение
      if (prev.some(msg => msg.messageId === messageId)) {
        return prev;
      }
      return [...prev, { messageId, chatId, timestamp }];
    });
  }, []);

  // Пометка чата как прочитанного (удаляет все непрочитанные сообщения из чата)
  const markChatAsRead = useCallback((chatId: string) => {
    const timestamp = Date.now();
    setUnreadMessages(prev => prev.filter(msg => msg.chatId !== chatId));
    setLastReadTimestamps(prev => ({ ...prev, [chatId]: timestamp }));
  }, []);

  // Получение количества непрочитанных сообщений для чата
  const getUnreadCount = useCallback((chatId: string) => {
    return unreadMessages.filter(msg => msg.chatId === chatId).length;
  }, [unreadMessages]);

  // Проверка, прочитано ли сообщение
  const isMessageRead = useCallback((messageId: string, chatId: string, messageTimestamp: number) => {
    // Если есть непрочитанное сообщение с таким ID, значит не прочитано
    if (unreadMessages.some(msg => msg.messageId === messageId)) {
      return false;
    }
    
    // Проверяем по времени последнего прочтения чата
    const lastReadTime = lastReadTimestamps[chatId];
    if (lastReadTime && messageTimestamp <= lastReadTime) {
      return true;
    }
    
    return false;
  }, [unreadMessages, lastReadTimestamps]);

  // Получение всех непрочитанных чатов с их количеством
  const getUnreadChats = useCallback(() => {
    const chatCounts: Record<string, number> = {};
    unreadMessages.forEach(msg => {
      chatCounts[msg.chatId] = (chatCounts[msg.chatId] || 0) + 1;
    });
    return chatCounts;
  }, [unreadMessages]);

  // Очистка старых данных (старше 30 дней)
  const cleanOldData = useCallback(() => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    setUnreadMessages(prev => prev.filter(msg => msg.timestamp > thirtyDaysAgo));
  }, []);

  // Очистка при каждой загрузке
  useEffect(() => {
    cleanOldData();
  }, [cleanOldData]);

  return {
    addUnreadMessage,
    markChatAsRead,
    getUnreadCount,
    isMessageRead,
    getUnreadChats,
    unreadMessages,
    lastReadTimestamps
  };
}