// src/hooks/useMessagePolling.ts
import { useCallback, useEffect, useRef } from 'react';
import { FEATURES } from '@/config/features';

interface UseMessagePollingProps {
  chatId?: string;
  onNewMessage?: (message: any) => void;
  enabled?: boolean;
  interval?: number;
}

export function useMessagePolling({ 
  chatId, 
  onNewMessage, 
  enabled = true,
  interval = FEATURES.HTTP_POLLING_INTERVAL 
}: UseMessagePollingProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimestamp = useRef<number>(Date.now());

  const checkForNewMessages = useCallback(async () => {
    if (!chatId || !onNewMessage) return;

    try {
      // Получаем новые сообщения с момента последней проверки
      const response = await fetch(`/api/whatsapp/chats/${chatId}/messages?since=${lastMessageTimestamp.current}`);
      
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        console.log(`📨 Polling: Found ${data.messages.length} new messages`);
        
        data.messages.forEach((message: any) => {
          onNewMessage(message);
        });
        
        // Обновляем timestamp последнего сообщения
        lastMessageTimestamp.current = Date.now();
      }
    } catch (error) {
      console.error('❌ Polling error:', error);
    }
  }, [chatId, onNewMessage]);

  useEffect(() => {
    if (!enabled || !chatId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log(`🔄 Starting message polling for chat ${chatId} every ${interval}ms`);
    
    // Сразу проверяем новые сообщения
    checkForNewMessages();
    
    // Устанавливаем интервал
    intervalRef.current = setInterval(checkForNewMessages, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [chatId, enabled, interval, checkForNewMessages]);

  // Метод для принудительной проверки
  const checkNow = useCallback(() => {
    checkForNewMessages();
  }, [checkForNewMessages]);

  return { checkNow };
}