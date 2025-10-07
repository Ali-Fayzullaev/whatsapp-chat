// src/components/chat/types.ts
export interface Message {
  id: string;
  chatId: string;
  author: "me" | "them";
  text: string;
  time: string;
  createdAt?: number;
  status?: "sent" | "delivered" | "read" | "failed";
  media?: {
    url: string;
    type: "image" | "video" | "document" | "audio";
    name?: string;
    size?: number;
    mime?: string;
  };
}

export interface MediaFile {
  file: File;
  type: "image" | "video" | "document" | "audio";
  previewUrl?: string;
}