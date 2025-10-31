// src/hooks/useReplyCache.ts - Простое кэширование ответов
"use client";
import { useRef, useCallback, useEffect } from 'react';
import type { Message } from '@/components/chat/types';

interface ReplyCache {
  [messageId: string]: {
    replyTo: Message['replyTo'];
    timestamp: number;
  };
}

export function useReplyCache(chatId: string | null) {
  const replyCache = useRef<ReplyCache>({});

  // Сохранение информации об ответе
  const cacheReply = useCallback((messageId: string, replyTo: Message['replyTo']) => {
    if (!replyTo || !chatId) return;
    
    const cacheKey = `${chatId}-${messageId}`;
    replyCache.current[cacheKey] = {
      replyTo,
      timestamp: Date.now()
    };
    
    // Сохраняем в localStorage
    try {
      localStorage.setItem(`reply-cache-${chatId}`, JSON.stringify(replyCache.current));
    } catch (error) {
      console.warn('Failed to save reply cache:', error);
    }
  }, [chatId]);

  // Восстановление данных об ответе
  const getReply = useCallback((messageId: string): Message['replyTo'] => {
    if (!chatId) return undefined;
    
    const cacheKey = `${chatId}-${messageId}`;
    const cached = replyCache.current[cacheKey];
    return cached?.replyTo;
  }, [chatId]);

  // Загрузка кэша из localStorage при смене чата
  const loadCache = useCallback(() => {
    if (!chatId) return;
    
    try {
      const cached = localStorage.getItem(`reply-cache-${chatId}`);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        
        // Очищаем старые записи (старше 24 часов)
        const now = Date.now();
        const cleaned: ReplyCache = {};
        
        Object.entries(parsedCache).forEach(([key, value]: [string, any]) => {
          if (now - value.timestamp < 24 * 60 * 60 * 1000) {
            cleaned[key] = value;
          }
        });
        
        replyCache.current = cleaned;
      }
    } catch (error) {
      console.warn('Failed to load reply cache:', error);
      replyCache.current = {};
    }
  }, [chatId]);

  // Загружаем кэш при смене чата
  useEffect(() => {
    loadCache();
  }, [loadCache]);

  return { cacheReply, getReply };
}