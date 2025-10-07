// src/components/chat/types.ts
export interface Chat {
  id: string;
  chat_id: string;
  is_group: boolean;
  name?: string;
  phone?: string; // Добавляем phone
  avatarUrl?: string;
  avatarFallback?: string;
  lastMessage?: any; // Обновляем тип
  unread?: number;
  time?: string;
  updatedAt?: number; // Добавляем updatedAt
}

export interface Message {
  id: string;
  chatId: string;
  author: "me" | "them";
  text: string;
  time: string;
  createdAt?: number;
  status?: "sent" | "delivered" | "read" | "failed";
}