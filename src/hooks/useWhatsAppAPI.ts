// src/hooks/useWhatsAppAPI.ts
import { Chat, Message } from '@/components/chat/types';
import { useState, useEffect } from 'react';

type ChatFromAPI = {
  id: string;
  phone: string;
  created_at: string;
  // добавь другие поля, если есть
};

type MessageFromAPI = {
  message_ref: string;
  text?: string;
  sender: 'user' | 'bot'; // ← предположим, что так
  timestamp: string; // ISO
};

// Преобразуем API-данные в наш UI-формат
const mapChat = (apiChat: ChatFromAPI): Chat => ({
  id: apiChat.id,
  name: apiChat.phone,
  lastMessage: '', // можно получить из последнего сообщения
  time: new Date(apiChat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  unread: 0,
  avatarFallback: apiChat.phone.slice(-2),
  avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(apiChat.phone)}`,
});

const mapMessage = (apiMsg: MessageFromAPI, chatId: string): Message => ({
  id: apiMsg.message_ref,
  chatId,
  author: apiMsg.sender === 'user' ? 'me' : 'them',
  text: apiMsg.text || '[Медиа]',
  time: new Date(apiMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  status: apiMsg.sender === 'user' ? 'delivered' : undefined,
});

export const useWhatsAppAPI = (chatId?: string) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка чатов
  const loadChats = async () => {
    try {
      const res = await fetch('/api/whatsapp/chats');
      const data: ChatFromAPI[] = await res.json();
      setChats(data.map(mapChat));
    } catch (err) {
      console.error('Failed to load chats', err);
    }
  };

  // Загрузка сообщений чата
  const loadMessages = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/chats/${id}/messages`);
      const data: MessageFromAPI[] = await res.json();
      setMessages(data.map(msg => mapMessage(msg, id)));
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  };

  // Отправка сообщения
  const sendMessage = async (id: string, text: string) => {
    try {
      await fetch(`/api/whatsapp/chats/${id}/sendText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      // После отправки — перезагрузи сообщения
      await loadMessages(id);
    } catch (err) {
      console.error('Send failed', err);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
    }
  }, [chatId]);

  return {
    chats,
    messages,
    loading,
    sendMessage,
    reloadChats: loadChats,
  };
};