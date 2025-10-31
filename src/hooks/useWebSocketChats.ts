// src/hooks/useWebSocketChats.ts
"use client";
import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { formatMessageTime } from '@/utils/dateFormat';
import type { Chat, Message } from '@/components/chat/types';
interface WebSocketChatEvent {
  type: 'chat_updated' | 'new_message' | 'message_updated' | 'chat_deleted' | 'new_chat';
  data: {
    chatId?: string;
    chat?: Chat;
    message?: Message;
    [key: string]: any;
  };
}
interface UseWebSocketChatsProps {
  onChatUpdated?: (chat: Chat) => void;
  onNewMessage?: (chatId: string, message: Message) => void;
  onMessageUpdated?: (chatId: string, message: Message) => void;
  onChatDeleted?: (chatId: string) => void;
  onNewChat?: (chat: Chat) => void;
  onChatsUpdate?: (chats: Chat[]) => void;
}
export function useWebSocketChats({
  onChatUpdated,
  onNewMessage,
  onMessageUpdated,
  onChatDeleted,
  onNewChat,
  onChatsUpdate
}: UseWebSocketChatsProps) {
  const { isConnected, onMessage, offMessage } = useWebSocket();
  
  // Создаем стабильную ссылку на handleWebSocketMessage
  const handleWebSocketMessageRef = useRef<((data: any) => void) | null>(null);
  const handleWebSocketMessage = useCallback((data: any) => {
    try {
      // Определяем тип события по структуре данных
      const eventType = data?.type;
      const chatId = data?.chat_id;
      const messageItem = data?.data?.item; // Правильная структура для сообщений
      // Обработка событий от сервера
      switch (eventType) {
        case 'ws.ready':
          break;
        case 'message.created':
        case 'message.updated':
          // Если есть messageItem, обрабатываем как новое сообщение
          if (chatId && messageItem && onNewMessage) {
            console.log("📦 Ищем данные ответа в:", {
              reply_to: messageItem.reply_to,
              replyTo: messageItem.replyTo, 
              quoted: messageItem.quoted,
              contextInfo: messageItem.contextInfo,
              quotedMessage: messageItem.quotedMessage
            });
            // Расширенная обработка ответов - проверяем разные возможные поля
            let replyTo: Message['replyTo'] = undefined;
            if (messageItem.reply_to || messageItem.replyTo || messageItem.quoted || 
                messageItem.contextInfo?.quotedMessage || messageItem.quotedMessage) {
              const quotedData = messageItem.quoted || messageItem.contextInfo?.quotedMessage || messageItem.quotedMessage;
              const replyId = messageItem.reply_to || messageItem.replyTo || quotedData?.id || quotedData?.id_message;
              if (replyId) {
                replyTo = {
                  id: replyId,
                  author: quotedData?.direction === 'out' || quotedData?.author === 'me' ? 'me' : 'them',
                  text: quotedData?.text || quotedData?.body || quotedData?.message || 'Сообщение',
                  media: quotedData?.media ? {
                    type: quotedData.media.type || 'document',
                    name: quotedData.media.name
                  } : undefined
                };
              }
            }
            // Преобразуем messageItem в формат Message
            const message: Message = {
              id: messageItem.id_message || Date.now().toString(),
              chatId: chatId,
              author: messageItem.direction === 'out' ? 'me' : 'them',
              text: messageItem.text || '',
              time: formatMessageTime(messageItem.timestamp),
              createdAt: new Date(messageItem.timestamp).getTime(),
              status: messageItem.status === 'read' ? 'read' : 
                     messageItem.status === 'delivered' ? 'delivered' : 
                     messageItem.status === 'sent' ? 'sent' : undefined,
              isRead: messageItem.seen,
              direction: messageItem.direction,
              timestamp: messageItem.timestamp,
              id_message: messageItem.id_message,
              media: messageItem.media,
              sender: messageItem.sender,
              replyTo
            };
            onNewMessage(chatId, message);
          }
          // Также обновляем чат, если есть колбэк
          if (onChatUpdated && chatId && messageItem) {
            const chatUpdate = {
              id: chatId,
              chatId: chatId,
              isGroup: data.is_group,
              lastMessage: messageItem,
              // Добавляем другие поля из data, если необходимо
            };
            onChatUpdated(chatUpdate as any);
          }
          break;
        case 'message.deleted':
          // Можно добавить обработку удаления сообщений
          break;
        case 'chat.deleted':
          if (chatId && onChatDeleted) {
            onChatDeleted(chatId);
          }
          break;
        // Обработка других форматов событий
        case 'chat_updated':
          if (data.data?.chat && onChatUpdated) {
            onChatUpdated(data.data.chat);
          }
          break;
        case 'new_message':
          if (data.data?.chatId && data.data?.message && onNewMessage) {
            onNewMessage(data.data.chatId, data.data.message);
          }
          break;
        case 'chats_update':
          if (data.data?.chats && onChatsUpdate) {
            onChatsUpdate(data.data.chats);
          }
          break;
        default:
          // Fallback: проверяем разные структуры данных
          const lastMessage = data?.last_message; // Старый формат
          const fallbackMessageItem = messageItem || lastMessage; // Пробуем оба формата
          if (chatId && fallbackMessageItem && onNewMessage) {
            const message: Message = {
              id: fallbackMessageItem.id_message || Date.now().toString(),
              chatId: chatId,
              author: fallbackMessageItem.direction === 'out' ? 'me' : 'them',
              text: fallbackMessageItem.text || '',
              time: formatMessageTime(fallbackMessageItem.timestamp),
              createdAt: new Date(fallbackMessageItem.timestamp).getTime(),
              status: fallbackMessageItem.status === 'read' ? 'read' : 
                     fallbackMessageItem.status === 'delivered' ? 'delivered' : 
                     fallbackMessageItem.status === 'sent' ? 'sent' : undefined,
              isRead: fallbackMessageItem.seen,
              direction: fallbackMessageItem.direction,
              timestamp: fallbackMessageItem.timestamp,
              id_message: fallbackMessageItem.id_message,
              media: fallbackMessageItem.media,
              sender: fallbackMessageItem.sender
            };
            onNewMessage(chatId, message);
          }
          break;
      }
    } catch (error) {
      // Тихо обрабатываем ошибки в production
    }
  }, [onChatUpdated, onNewMessage, onMessageUpdated, onChatDeleted, onNewChat, onChatsUpdate]);

  // Создаем стабильную ссылку на обработчик
  if (!handleWebSocketMessageRef.current) {
    handleWebSocketMessageRef.current = handleWebSocketMessage;
  } else {
    // Обновляем ссылку на текущий обработчик
    handleWebSocketMessageRef.current = handleWebSocketMessage;
  }

  useEffect(() => {
    const stableHandler = handleWebSocketMessageRef.current;
    if (isConnected && stableHandler) {
      onMessage(stableHandler);
      return () => {
        if (stableHandler) {
          offMessage(stableHandler);
        }
      };
    }
  }, [isConnected, onMessage, offMessage]);
  return {
    isConnected,
    isRealTime: isConnected
  };
}
