// src/components/chat/types.ts
export interface Chat {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;          // человекочитаемое
  unread: number;
  avatarFallback: string;
  avatarUrl: string;
  updatedAt?: number;    // ← ДОБАВИЛ: для сортировки списка чатов
}

export interface Message {
  id: string;
  chatId: string;
  author: "me" | "them";
  text: string;
  time: string;          // человекочитаемое "HH:MM"
  createdAt?: number;    // ← ДОБАВИЛ: реальный timestamp (ms)
  status?: "sent" | "delivered" | "read" | "failed";
}
