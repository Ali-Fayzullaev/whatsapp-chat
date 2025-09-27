export type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  avatarUrl?: string;
  avatarFallback?: string;
};

// src/components/chat/types.ts
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export type Message = {
  id: string;
  chatId: string;
  author: 'me' | 'them';
  text: string;
  time: string;
  status?: MessageStatus; // ← теперь "failed" разрешён
};