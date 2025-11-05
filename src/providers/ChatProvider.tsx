// src/providers/ChatProvider.tsx
"use client";
import React, { createContext, useContext, ReactNode, useRef } from "react";
import { useChats } from "@/hooks/useChats";
import type { Chat } from "@/components/chat/types";

interface ChatContextType {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  isPending: boolean;
  loadChats: (silent?: boolean, search?: string) => Promise<void>;
  searchChats: (searchQuery: string) => Promise<void>;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  addChat: (chat: Chat) => void;
  createChat: (phone: string) => Promise<string>;
  deleteChat: (chatId: string) => Promise<boolean>;
  markChatAsRead: (chatId: string) => void;
  isConnected: boolean;
  isRealTime: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Глобальный счетчик для предотвращения множественных провайдеров
let chatProviderInstanceCount = 0;

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const instanceRef = useRef<number>(0);
  
  // Инициализируем только первый экземпляр
  if (instanceRef.current === 0) {
    chatProviderInstanceCount++;
    instanceRef.current = chatProviderInstanceCount;
    console.log(`🏁 Initializing ChatProvider instance #${instanceRef.current}`);
  }

  const chatHookData = useChats();

  console.log(`🔄 ChatProvider #${instanceRef.current} rendering with ${chatHookData.chats.length} chats`);

  return (
    <ChatContext.Provider value={chatHookData}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}