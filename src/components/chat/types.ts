// src/components/chat/types.ts
// src/components/chat/types.ts
export interface Message {
  id: string;
  chatId: string;
  author: "me" | "them";
  text: string;
  time: string;
  createdAt: number;
  status?: "sent" | "delivered" | "read" | "failed";
  isRead?: boolean; // Флаг прочитанности сообщения
  isEdited?: boolean; // Добавляем флаг редактированного сообщения
  editedAt?: number; // Время последнего редактирования
  pending?: boolean; // Флаг для оптимистических обновлений
  
  // Данные от бэкенда
  sender?: {
    id: string;
    name: string;
    user_id?: string | null;
    full_name?: string | null;
  };
  timestamp?: string; // ISO строка времени
  direction?: "in" | "out";
  platform?: string;
  id_message?: string;
  
  media?: {
    url: string;
    type: "image" | "video" | "document" | "audio";
    name?: string;
    size?: number;
    mime?: string;
    duration?: number; // Длительность в секундах для аудио/видео
  };

  
  replyTo?: {
    id: string;
    author: "me" | "them";
    text: string;
    media?: {
      type: "image" | "video" | "document" | "audio";
      name?: string;
      duration?: number; // Длительность для аудио/видео
    };
  };
}

// Интерфейс для редактирования сообщения
export interface EditMessageRequest {
  text?: string;
  seen?: boolean;
  status?: string;
  media?: {
    [key: string]: any;
  };
}

// Состояние редактирования в компоненте
export interface EditingState {
  messageId: string;
  originalText: string;
  newText: string;
}

export interface ReplyMessage {
  id: string;
  author: "me" | "them";
  text: string;
  media?: {
    type: "image" | "video" | "document" | "audio";
    name?: string;
  };
}
export interface MediaFile {
  file: File;
  type: "image" | "video" | "document" | "audio";
  previewUrl?: string;
}


export interface Chat {
  id: string;
  chat_id: string;
  is_group: boolean;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  avatarFallback?: string;
  lastMessage?: any;
  unread?: number;
  time?: string;
  updatedAt?: number;
  lastSeen?: string; // Добавляем lastSeen для отображения статуса
}