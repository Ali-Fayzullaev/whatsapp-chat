// src/hooks/useUnreadMessages.ts
"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export interface UnreadMessage {
  messageId: string;
  chatId: string;
  timestamp: number;
}

const UNREAD_MESSAGES_KEY = "whatsapp_unread_messages";
const LAST_READ_TIMESTAMPS_KEY = "whatsapp_last_read_timestamps";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

let unreadMessagesStore: UnreadMessage[] = [];
let lastReadTimestampsStore: Record<string, number> = {};
let hasLoadedFromStorage = false;

type Snapshot = {
  unreadMessages: UnreadMessage[];
  lastReadTimestamps: Record<string, number>;
};

let snapshotCache: Snapshot = {
  unreadMessages: unreadMessagesStore,
  lastReadTimestamps: lastReadTimestampsStore,
};

const listeners = new Set<() => void>();

const updateSnapshotCache = () => {
  snapshotCache = {
    unreadMessages: unreadMessagesStore,
    lastReadTimestamps: lastReadTimestampsStore,
  };
};

const notifyListeners = () => {
  updateSnapshotCache();
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Unread message listener failed:", error);
    }
  });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => snapshotCache;

const getServerSnapshot = () => ({
  unreadMessages: [] as UnreadMessage[],
  lastReadTimestamps: {} as Record<string, number>,
});

const normalizeUnread = (item: unknown): UnreadMessage | null => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const maybeUnread = item as Partial<Record<keyof UnreadMessage, unknown>>;
  const messageId = maybeUnread.messageId;
  const chatId = maybeUnread.chatId;

  if (typeof messageId !== "string" || typeof chatId !== "string") {
    return null;
  }

  const timestampValue = maybeUnread.timestamp;
  const timestamp = typeof timestampValue === "number" ? timestampValue : Date.now();
  return {
    messageId,
    chatId,
    timestamp,
  };
};

const areUnreadEqual = (a: UnreadMessage[], b: UnreadMessage[]) => {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    const current = a[index];
    const next = b[index];
    if (!next) return false;
    if (
      current.messageId !== next.messageId ||
      current.chatId !== next.chatId ||
      current.timestamp !== next.timestamp
    ) {
      return false;
    }
  }
  return true;
};

const areTimestampsEqual = (a: Record<string, number>, b: Record<string, number>) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

const persistStores = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNREAD_MESSAGES_KEY, JSON.stringify(unreadMessagesStore));
    window.localStorage.setItem(
      LAST_READ_TIMESTAMPS_KEY,
      JSON.stringify(lastReadTimestampsStore),
    );
  } catch (error) {
    console.error("Failed to persist unread message state:", error);
  }
};

const cleanOldDataInternal = () => {
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  const filtered = unreadMessagesStore.filter((msg) => msg.timestamp > cutoff);
  if (filtered.length !== unreadMessagesStore.length) {
    unreadMessagesStore = filtered;
    return true;
  }
  return false;
};

const syncFromStorage = (force = false) => {
  if (!force && hasLoadedFromStorage) return;
  if (typeof window === "undefined") return;

  let nextUnread: UnreadMessage[] = [];
  let nextTimestamps: Record<string, number> = {};

  try {
    const savedUnread = window.localStorage.getItem(UNREAD_MESSAGES_KEY);
    if (savedUnread) {
      const parsed = JSON.parse(savedUnread);
      if (Array.isArray(parsed)) {
        nextUnread = parsed
          .map(normalizeUnread)
          .filter((item): item is UnreadMessage => item !== null);
      }
    }
  } catch (error) {
    console.error("Error parsing unread messages:", error);
  }

  try {
    const savedTimestamps = window.localStorage.getItem(LAST_READ_TIMESTAMPS_KEY);
    if (savedTimestamps) {
      const parsed = JSON.parse(savedTimestamps);
      if (parsed && typeof parsed === "object") {
        nextTimestamps = parsed;
      }
    }
  } catch (error) {
    console.error("Error parsing last read timestamps:", error);
  }

  const unreadChanged = !areUnreadEqual(unreadMessagesStore, nextUnread);
  const timestampsChanged = !areTimestampsEqual(lastReadTimestampsStore, nextTimestamps);

  unreadMessagesStore = nextUnread;
  lastReadTimestampsStore = nextTimestamps;
  hasLoadedFromStorage = true;

  updateSnapshotCache();

  const cleaned = cleanOldDataInternal();
  if (unreadChanged || timestampsChanged || cleaned) {
    persistStores();
    notifyListeners();
  }
};

const ensureInitialized = () => {
  if (!hasLoadedFromStorage) {
    syncFromStorage(true);
  }
};

const addUnreadMessageInternal = (messageId: string, chatId: string) => {
  ensureInitialized();
  if (!messageId || !chatId) return;

  const exists = unreadMessagesStore.some((msg) => msg.messageId === messageId);
  if (exists) return;

  unreadMessagesStore = [
    ...unreadMessagesStore,
    { messageId, chatId, timestamp: Date.now() },
  ];

  cleanOldDataInternal();
  persistStores();
  notifyListeners();
};

const markChatAsReadInternal = (chatId: string) => {
  ensureInitialized();
  if (!chatId) return;

  const nextUnread = unreadMessagesStore.filter((msg) => msg.chatId !== chatId);
  const unreadChanged = nextUnread.length !== unreadMessagesStore.length;
  unreadMessagesStore = nextUnread;

  const timestamp = Date.now();
  const nextTimestamps = { ...lastReadTimestampsStore, [chatId]: timestamp };
  const timestampsChanged = nextTimestamps[chatId] !== lastReadTimestampsStore[chatId];
  lastReadTimestampsStore = nextTimestamps;

  const cleaned = cleanOldDataInternal();
  if (unreadChanged || timestampsChanged || cleaned) {
    persistStores();
    notifyListeners();
  }
};

const isMessageReadInternal = (messageId: string, chatId: string, messageTimestamp: number) => {
  ensureInitialized();
  if (!messageId) return false;

  if (unreadMessagesStore.some((msg) => msg.messageId === messageId)) {
    return false;
  }

  const lastReadTime = lastReadTimestampsStore[chatId];
  if (lastReadTime && messageTimestamp <= lastReadTime) {
    return true;
  }

  return false;
};

const getUnreadChatsInternal = () => {
  ensureInitialized();
  return unreadMessagesStore.reduce<Record<string, number>>((acc, msg) => {
    acc[msg.chatId] = (acc[msg.chatId] || 0) + 1;
    return acc;
  }, {});
};

export function useUnreadMessages() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { unreadMessages, lastReadTimestamps } = snapshot;

  useEffect(() => {
    syncFromStorage(true);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === UNREAD_MESSAGES_KEY || event.key === LAST_READ_TIMESTAMPS_KEY) {
        syncFromStorage(true);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addUnreadMessage = useCallback((messageId: string, chatId: string) => {
    addUnreadMessageInternal(messageId, chatId);
  }, []);

  const markChatAsRead = useCallback((chatId: string) => {
    markChatAsReadInternal(chatId);
  }, []);

  const getUnreadCount = useCallback((chatId: string) => {
    ensureInitialized();
    return unreadMessagesStore.filter((msg) => msg.chatId === chatId).length;
  }, []);

  const isMessageRead = useCallback((messageId: string, chatId: string, messageTimestamp: number) => {
    return isMessageReadInternal(messageId, chatId, messageTimestamp);
  }, []);

  const getUnreadChats = useCallback(() => {
    return getUnreadChatsInternal();
  }, []);

  const cleanOldData = useCallback(() => {
    ensureInitialized();
    const cleaned = cleanOldDataInternal();
    if (cleaned) {
      persistStores();
      notifyListeners();
    }
  }, []);

  useEffect(() => {
    cleanOldData();
  }, [cleanOldData]);

  return {
    addUnreadMessage,
    markChatAsRead,
    getUnreadCount,
    isMessageRead,
    getUnreadChats,
    cleanOldData,
    unreadMessages,
    lastReadTimestamps,
  };
}