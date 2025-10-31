// src/hooks/useMessages.ts
"use client";
import { useState, useEffect, useOptimistic, useTransition, useCallback } from "react";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { useWebSocketChats } from "./useWebSocketChats";
import { useReplyCache } from "./useReplyCache";
import { FEATURES } from "@/config/features";
import type { Message } from "@/components/chat/types";
interface OptimisticMessage extends Message {
  pending?: boolean;
  failed?: boolean;
}
export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  // WebSocket обработчики для сообщений
  const handleNewMessage = useCallback((receivedChatId: string, message: Message) => {
    if (receivedChatId === chatId) {
      startTransition(() => {
        setMessages(prev => {
          // Проверяем, не существует ли уже такое сообщение
          const exists = prev.some(msg => msg.id === message.id || msg.id_message === message.id_message);
          if (exists) {
            return prev;
          }
          const updated = [...prev, message].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
          return updated;
        });
      });
    }
  }, [chatId]);
  const handleMessageUpdated = useCallback((receivedChatId: string, message: Message) => {
    if (receivedChatId === chatId) {
      startTransition(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, ...message } : msg
        ));
      });
    }
  }, [chatId]);
  // Подключаем WebSocket для сообщений
  const { isConnected } = useWebSocketChats({
    onNewMessage: handleNewMessage,
    onMessageUpdated: handleMessageUpdated,
  });
  // Простое кэширование ответов
  const { cacheReply, getReply } = useReplyCache(chatId);
  // Оптимистичные обновления для мгновенного отображения сообщений
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state: OptimisticMessage[], newMessage: OptimisticMessage) => {
      // Проверяем, не дублируется ли сообщение
      if (state.some(msg => msg.id === newMessage.id)) {
        return state;
      }
      return [...state, { ...newMessage, pending: true }].sort(
        (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
      );
    }
  );
  // Загрузка сообщений чата
  const loadMessages = async (targetChatId: string, silent = false) => {
    if (!targetChatId || targetChatId.startsWith("temp:")) {
      setMessages([]);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const messagesData = await ApiClient.getChatMessages(targetChatId);
      startTransition(() => {
        // Убираем pending флаг у всех сообщений при перезагрузке
        const cleanedMessages = messagesData.map(msg => ({ 
          ...msg, 
          pending: false 
        }));
        setMessages(cleanedMessages);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load messages";
      setError(errorMessage);
      console.error("Load messages error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };
  // Отправка медиа-сообщения
  const sendMediaMessage = async (file: File, mediaUrl: string, replyTo?: any) => {
    if (!chatId) return;
    const tempId = crypto.randomUUID();
    const now = Date.now();
    // Определяем тип медиа
    const getMediaType = (file: File) => {
      if (file.type.startsWith('image/')) return 'image';
      if (file.type.startsWith('video/')) return 'video'; 
      if (file.type.startsWith('audio/')) return 'audio';
      return 'document';
    };
    // Создаем оптимистичное медиа-сообщение
    const optimisticMsg: OptimisticMessage = {
      id: tempId,
      chatId,
      author: "me",
      text: "",
      time: new Date(now).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: now,
      status: "sent",
      isRead: true,
      pending: true,
      media: {
        url: mediaUrl,
        type: getMediaType(file),
        name: file.name,
        size: file.size,
        mime: file.type,
      },
      ...(replyTo && { replyTo })
    };
    // Добавляем оптимистично в transition
    startTransition(() => {
      addOptimisticMessage(optimisticMsg);
    });
    try {
      let actualChatId = chatId;
      // Если это временный чат, создаем реальный
      if (chatId.startsWith("temp:")) {
        const phone = chatId.replace("temp:", "");
        const apiPhone = `${phone}@c.us`;
        try {
          const startResult = await ApiClient.startChat(apiPhone);
          if (startResult?.chat_id) {
            actualChatId = String(startResult.chat_id);
          } else {
            throw new Error("Номер телефона не зарегистрирован в WhatsApp");
          }
        } catch (startChatError) {
          console.error("Start chat error for media:", startChatError);
          // Удаляем оптимистичное сообщение
          startTransition(() => {
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
          });
          let errorMessage = "Не удалось создать чат для отправки медиа";
          if (startChatError instanceof Error) {
            if (startChatError.message.includes("422") || startChatError.message.includes("404")) {
              errorMessage = `Номер ${phone} не зарегистрирован в WhatsApp`;
            }
          }
          addToast({
            type: "error",
            title: "Ошибка создания чата",
            description: errorMessage,
            duration: 6000
          });
          return;
        }
      }
      // Отправляем медиа через API
      await ApiClient.sendMediaMessage(actualChatId, mediaUrl, "", replyTo);
      // Перезагружаем сообщения чтобы получить реальное медиа-сообщение
      setTimeout(() => {
        loadMessages(actualChatId, true);
      }, 1000);
    } catch (err) {
      console.error("Send media message error:", err);
      // Помечаем сообщение как неудачное
      startTransition(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: "failed", pending: false }
            : msg
        ));
      });
      let errorMessage = "Не удалось отправить медиафайл";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      addToast({
        type: "error", 
        title: "Ошибка отправки медиа",
        description: errorMessage
      });
    }
  };
  // Отправка сообщения с оптимистичным обновлением
  const sendMessage = async (text: string, replyTo?: any) => {
    if (!chatId || !text.trim()) return;
    const tempId = crypto.randomUUID();
    const now = Date.now();
    // Создаем оптимистичное сообщение с поддержкой ответов
    const optimisticMsg: OptimisticMessage = {
      id: tempId,
      chatId,
      author: "me",
      text: text.trim(),
      time: new Date(now).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: now,
      status: "sent",
      isRead: true,
      pending: true,
      replyTo: replyTo ? {
        id: replyTo.id,
        author: replyTo.author as "me" | "them",
        text: replyTo.text,
        media: replyTo.media
      } : undefined,
    };
    // Кэшируем информацию об ответе если есть
    if (replyTo) {
      cacheReply(tempId, {
        id: replyTo.id,
        author: replyTo.author as "me" | "them",
        text: replyTo.text,
        media: replyTo.media
      });
    }
    // Добавляем оптимистично в transition
    startTransition(() => {
      addOptimisticMessage(optimisticMsg);
    });
    try {
      let actualChatId = chatId;
      // Если это временный чат, создаем реальный
      if (chatId.startsWith("temp:")) {
        const phone = chatId.replace("temp:", "");
        const apiPhone = `${phone}@c.us`;
        try {
          const startResult = await ApiClient.startChat(apiPhone);
          if (startResult?.chat_id) {
            actualChatId = String(startResult.chat_id);
          } else {
            // Если chat_id не получен, значит номер не найден
            throw new Error("Номер телефона не зарегистрирован в WhatsApp");
          }
        } catch (startChatError) {
          // Обрабатываем ошибки создания чата
          console.error("Start chat error:", startChatError);
          // Удаляем оптимистичное сообщение и показываем ошибку
          startTransition(() => {
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
          });
          // Определяем тип ошибки и показываем соответствующее сообщение
          let errorMessage = "Не удалось создать чат";
          if (startChatError instanceof Error) {
            if (startChatError.message.includes("422") || startChatError.message.includes("404")) {
              errorMessage = `Номер ${phone} не зарегистрирован в WhatsApp`;
            } else if (startChatError.message.includes("401")) {
              errorMessage = "Ошибка авторизации. Проверьте подключение к серверу";
            } else if (startChatError.message.includes("500")) {
              errorMessage = "Ошибка сервера. Попробуйте позже";
            } else {
              errorMessage = `Ошибка: ${startChatError.message}`;
            }
          }
          // Показываем уведомление пользователю
          addToast({
            type: "error",
            title: "Ошибка создания чата",
            description: errorMessage,
            duration: 6000
          });
          return;
        }
      }
      // Отправляем сообщение (ответы обрабатываются визуально через UI)
      const sendResult = await ApiClient.sendMessage(actualChatId, text, replyTo?.id);
      // Кэшируем ответ для реального ID сообщения если получили его
      if (sendResult?.id_message && replyTo) {
        cacheReply(sendResult.id_message, {
          id: replyTo.id,
          author: replyTo.author as "me" | "them", 
          text: replyTo.text,
          media: replyTo.media
        });
      }
      // Перезагружаем сообщения чтобы получить реальный ID
      setTimeout(() => {
        loadMessages(actualChatId, true);
      }, 1000);
    } catch (err) {
      console.error("Send message error:", err);
      // Помечаем сообщение как неудачное
      startTransition(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: "failed", pending: false }
            : msg
        ));
      });
      // Показываем ошибку отправки сообщения
      let errorMessage = "Не удалось отправить сообщение";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      addToast({
        type: "error",
        title: "Ошибка отправки",
        description: errorMessage
      });
    }
  };
  // Удаление сообщения
  const deleteMessage = async (messageId: string, remote = false) => {
    if (!chatId) return;
    // Оптимистично удаляем из UI
    const messageToDelete = messages.find(msg => msg.id === messageId);
    if (messageToDelete) {
      startTransition(() => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      });
    }
    try {
      await ApiClient.deleteMessage(chatId, messageId, remote);
    } catch (err) {
      console.error("Delete message error:", err);
      // Возвращаем сообщение если удаление не удалось
      if (messageToDelete) {
        startTransition(() => {
          setMessages(prev => [...prev, messageToDelete].sort(
            (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
          ));
        });
      }
    }
  };
  // Загружаем сообщения при смене чата
  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [chatId]);
  // HTTP polling fallback для сообщений когда WebSocket не подключен
  useEffect(() => {
    if (!chatId || chatId.startsWith("temp:")) return;
    if (!FEATURES.WEBSOCKET_ENABLED || !isConnected) {
      const interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          loadMessages(chatId, true); // silent reload
        }
      }, FEATURES.HTTP_POLLING_INTERVAL);
      return () => clearInterval(interval);
    } else {
    }
  }, [chatId, isConnected]);
  // Обогащаем сообщения данными об ответах из кэша
  const enrichedMessages = optimisticMessages.map(msg => ({
    ...msg,
    replyTo: msg.replyTo || getReply(msg.id) || getReply(msg.id_message || '')
  }));
  return {
    messages: enrichedMessages,
    loading,
    error,
    isPending,
    sendMessage,
    sendMediaMessage,
    deleteMessage,
    loadMessages,
  };
}
