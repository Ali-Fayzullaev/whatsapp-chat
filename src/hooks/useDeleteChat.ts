// src/hooks/useDeleteChat.ts
"use client";
import { useState } from "react";
import { ApiClient } from "@/lib/api-client";

export function useDeleteChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteChat = async (chatId: string): Promise<boolean> => {
    if (!chatId) return false;

    setLoading(true);
    setError(null);

    try {
      await ApiClient.deleteChat(chatId);
      console.log(`Chat ${chatId} deleted successfully`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete chat";
      setError(errorMessage);
      console.error("Delete chat error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteChat,
    loading,
    error,
  };
}