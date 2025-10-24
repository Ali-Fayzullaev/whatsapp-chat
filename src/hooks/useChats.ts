// src/hooks/useChats.ts
"use client";
import { useState, useEffect, useTransition } from "react";
import { ApiClient } from "@/lib/api-client";
import type { Chat } from "@/components/chat/types";

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadChats = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const chatsData = await ApiClient.getChats();
      
      startTransition(() => {
        setChats(chatsData);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load chats";
      setError(errorMessage);
      console.error("Load chats error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Автоматическое обновление чатов каждые 30 секунд
  useEffect(() => {
    loadChats();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadChats(true); // silent reload
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Обновление конкретного чата
  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    startTransition(() => {
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, ...updates } : chat
      ));
    });
  };

  // Добавление нового чата
  const addChat = (chat: Chat) => {
    startTransition(() => {
      setChats(prev => [chat, ...prev]);
    });
  };

  return {
    chats,
    loading,
    error,
    isPending,
    loadChats,
    updateChat,
    addChat,
  };
}