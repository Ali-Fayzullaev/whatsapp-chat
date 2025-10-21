// src/app/[chatId]/page.tsx
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Chat, Message, ReplyMessage } from "@/components/chat/types";
import { Sidebar } from "@/components/chat/Sidebar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Composer } from "@/components/chat/Composer";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { MobileSidebar } from "@/components/chat/MobileSidebar";
import { Menu, MessageCircleMore, MoreVertical, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FEATURES } from "@/config/features";
import { apiConfig } from "@/lib/api-config";
import { tokenStorage } from "@/lib/token-storage";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();

  // 🔹 Безопасное получение chatId
  const rawChatId = params?.chatId
    ? Array.isArray(params.chatId)
      ? params.chatId[0]
      : params.chatId
    : null;

  const chatId = rawChatId ? decodeURIComponent(rawChatId) : null;

  if (!chatId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Чат не найден</div>
          <p className="text-muted-foreground mb-4">
            Неверный идентификатор чата
          </p>
          <Button onClick={() => router.push("/")}>
            Вернуться к списку чатов
          </Button>
        </div>
      </div>
    );
  }

  const [hiddenPhones, setHiddenPhones] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isSwitchingChat, setIsSwitchingChat] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // 🔹 WebSocket хуки ТОЛЬКО ОДИН РАЗ наверху
  const { isConnected, connectionState, sendMessage, onMessage, offMessage, reconnect } = useWebSocket();
  const [messageReplies, setMessageReplies] = useState<
    Map<string, ReplyMessage>
  >(new Map());
  // 🔹 Правильно определяем временный чат
  const isTempChat = !!chatId?.startsWith("temp:");
  const tempPhone = isTempChat ? chatId.replace("temp:", "") : null;

  const [replyingTo, setReplyingTo] = useState<ReplyMessage | null>(null);
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // 🔹 Функция для ответа на сообщение
  const handleReplyToMessage = (message: Message) => {
    console.log("🔹 REPLY: Setting reply to message:", message);
    console.log("🔹 REPLY: Message details:", {
      id: message.id,
      author: message.author,
      text: message.text,
      hasMedia: !!message.media
    });
    
    const replyData = {
      id: message.id,
      author: message.author,
      text: message.text,
      media: message.media
        ? {
            type: message.media.type,
            name: message.media.name,
          }
        : undefined,
    };
    
    console.log("🔹 REPLY: Setting replyingTo to:", replyData);
    setReplyingTo(replyData);
    
    // Небольшая задержка для проверки что состояние обновилось
    setTimeout(() => {
      console.log("🔹 REPLY: State after 100ms:", replyingTo);
    }, 100);
  };

  // В рендере добавьте проверку:
  console.log("🔹 RENDER: Current replyingTo state:", replyingTo);

  // 🗑️ Функция для удаления сообщений
  const handleDeleteMessage = async (messageId: string, remote: boolean = false) => {
    if (!chatId) {
      console.log("Cannot delete: no chatId");
      return;
    }

    console.log("=== DELETE MESSAGE ===");
    console.log("Message ID:", messageId);
    console.log("Chat ID:", chatId);
    console.log("Remote delete:", remote);

    try {
      // Получаем токен через tokenStorage
      console.log("🔍 Getting auth token for message deletion...");
      const authToken = tokenStorage.getToken();
      
      if (!authToken) {
        console.error("❌ No auth token found for message deletion");
        alert("Ошибка авторизации: токен не найден");
        return;
      }

      console.log("🔑 Token found for message deletion:", authToken.substring(0, 10) + "...");

      // Сохраняем оригинальное сообщение для возможного восстановления
      const messageToDelete = messages.find(m => m.id === messageId);
      if (!messageToDelete) {
        console.error("❌ Message not found in current messages");
        alert("Сообщение не найдено");
        return;
      }

      console.log("💾 Saved message for potential rollback:", messageToDelete.id);

      const deleteUrl = `/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}`;
      const params = new URLSearchParams();
      
      if (remote) {
        params.set('remote', 'true');
      }

      const finalUrl = params.toString() ? `${deleteUrl}?${params}` : deleteUrl;

      console.log("Sending DELETE request to:", finalUrl);

      const response = await fetch(finalUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("📡 Message delete API Response status:", response.status);

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        console.log("✅ Message deleted successfully:", responseData);
        
        // ТОЛЬКО ТЕПЕРЬ удаляем из UI после успешного API ответа
        setMessages(prev => prev.filter(m => m.id !== messageId));
        
        // Обновляем чаты через небольшую задержку
        setTimeout(() => {
          loadChats(true);
        }, 500);
        
      } else {
        console.error("❌ Failed to delete message:", response.status, responseData);
        
        // Проверяем специфические ошибки
        if (response.status === 400 || response.status === 502) {
          // Возможно сообщение уже удалено - проверим это
          console.log("🔍 Message might be already deleted, refreshing messages...");
          
          // Перезагружаем сообщения чтобы синхронизировать состояние
          if (chatId) {
            loadMessages(chatId, true);
          }
          
          // Не показываем ошибку если сообщение уже удалено
          alert("Сообщение могло быть уже удалено. Обновляем список сообщений...");
        } else {
          alert(
            responseData.error || 
            `Не удалось удалить сообщение (${response.status})`
          );
        }
      }

    } catch (error) {
      console.error("Delete message error:", error);
      
      alert(
        "Ошибка при удалении сообщения: " + 
        (error instanceof Error ? error.message : "Неизвестная ошибка")
      );

      // Перезагружаем сообщения в случае ошибки
      if (chatId) {
        loadMessages(chatId, true);
      }
    }
  };

  // 🗑️ Функция для удаления чата
  const handleDeleteChat = async (chatIdToDelete: string) => {
    console.log("=== DELETE CHAT ===");
    console.log("Chat ID to delete:", chatIdToDelete);

    try {
      console.log("🔍 Getting auth token...");
      const authToken = tokenStorage.getToken();
      
      if (!authToken) {
        console.error("❌ No auth token found");
        // Проверим все ключи в localStorage для отладки
        console.log("🔍 Checking all localStorage keys:");
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('token') || key.includes('auth'))) {
            console.log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 20)}...`);
          }
        }
        throw new Error("Нет токена авторизации");
      }

      console.log("🔑 Token found:", authToken.substring(0, 10) + "...");

      const response = await fetch(`/api/whatsapp/chats/${encodeURIComponent(chatIdToDelete)}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 API Response status:", response.status);

      if (response.ok) {
        console.log("✅ Chat deleted successfully");
        
        // Удаляем чат из локального состояния
        setChats(prevChats => prevChats.filter(chat => chat.id !== chatIdToDelete));
        
        // Если удалили текущий чат, перенаправляем на главную
        if (chatId === chatIdToDelete) {
          router.push("/");
        }
        
        // Обновляем список чатов
        setTimeout(() => {
          loadChats(true);
        }, 500);
        
      } else {
        const responseData = await response.json();
        console.error("❌ Failed to delete chat:", response.status, responseData);
        
        alert(
          responseData.error || 
          `Не удалось удалить чат (${response.status})`
        );
      }

    } catch (error) {
      console.error("Delete chat error:", error);
      
      alert(
        "Ошибка при удалении чата: " + 
        (error instanceof Error ? error.message : "Неизвестная ошибка")
      );
    }
  };

  // Функции для скролла
  const isNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const fmtTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "00:00";
    }
  };

  const normalizePhone = (raw: string) => {
    let p = raw.trim().replace(/\D/g, "");

    if (p.length === 11) {
      return p;
    }

    if (p.length === 10) {
      return "7" + p;
    }

    if (p.length < 10) {
      console.error("Phone number too short:", p);
      return p;
    }

    if (p.length > 11) {
      console.warn("Phone number too long, trimming:", p);
      return p.slice(0, 11);
    }

    return p;
  };

  // ✅ loadChats с useCallback
  const loadChats = useCallback(async (silent = false) => {
    if (!silent) setLoadingChats(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/chats", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Authorization": `Bearer ${apiConfig.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      let data;
      if (!res.ok) {
        console.warn("Chats API returned error:", res.status);
        data = []; // Используем пустой массив при ошибке
      } else {
        data = await res.json();
      }

      const items: any[] = Array.isArray(data) ? data : [];

      const mapped: Chat[] = items.map((raw: any, i: number) => {
        const rawId = raw?.chat_id || raw?.id;
        const id = rawId ? String(rawId) : `temp-${i}`;
        let phone = raw?.phone || raw?.id || raw?.chat_id || "";
        phone = String(phone).replace("@c.us", "");
        const name = phone || `Чат ${id}`;
        const ts =
          typeof raw?.updated_at === "number"
            ? raw.updated_at * 1000
            : raw?.updated_at
            ? Date.parse(raw.updated_at)
            : typeof raw?.timestamp === "number"
            ? raw.timestamp * 1000
            : raw?.timestamp
            ? Date.parse(raw.timestamp)
            : Date.now();
        const last = raw?.last_message || raw?.text || "";

        return {
          id,
          chat_id: raw?.chat_id || id,
          is_group: raw?.is_group || false,
          name,
          phone,
          lastMessage: last,
          time: fmtTime(ts),
          unread: raw?.unread_count || 0,
          avatarFallback: name?.slice(0, 2).toUpperCase() || "?",
          avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
            name
          )}`,
          updatedAt: ts,
        };
      });

      mapped.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      setChats(mapped);
    } catch (e: any) {
      console.error("Failed to load chats:", e);
      setChats([]); // Устанавливаем пустой массив при ошибке
      if (!silent) {
        setError(e?.message ?? "Failed to load chats");
      }
    } finally {
      if (!silent) setLoadingChats(false);
    }
  }, []);

 const loadMessages = useCallback(
  async (currentChatId: string, silent = false) => {
    if (!currentChatId) {
      if (!silent) setLoadingMessages(false);
      return;
    }

    const decodedChatId = decodeURIComponent(currentChatId);

    // Обработка временных чатов
    if (decodedChatId.startsWith("temp:")) {
      setMessages([]);
      if (!silent) setLoadingMessages(false);
      return;
    }

    if (!silent) setLoadingMessages(true);

    try {
      console.log(`Loading messages for chat: ${decodedChatId}`);

      // Получаем токен через tokenStorage
      const authToken = tokenStorage.getToken();
      
      const headers: Record<string, string> = {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(
        `/api/whatsapp/chats/${encodeURIComponent(decodedChatId)}/messages`,
        {
          cache: "no-store",
          headers,
        }
      );

      if (!res.ok) {
        console.warn(`Messages API error: ${res.status} ${res.statusText}`);
        if (res.status === 404) {
          setMessages([]);
          return;
        }
        try {
          const errorData = await res.json();
          throw new Error(errorData?.error || `HTTP ${res.status}`);
        } catch {
          throw new Error(`Failed to load messages: ${res.status}`);
        }
      }

      const data = await res.json();
      console.log("Messages API response:", data);

      let messagesArray: any[] = [];

      if (Array.isArray(data)) {
        messagesArray = data;
      } else if (data && Array.isArray(data.items)) {
        messagesArray = data.items;
      } else if (data && typeof data === "object") {
        messagesArray = Object.values(data).filter(Array.isArray).flat();
      }

      console.log(`Processing ${messagesArray.length} messages`);

      const seenIds = new Set<string>();
      const mapped: Message[] = [];

      messagesArray.forEach((msg: any, index: number) => {
        try {
          const baseId =
            msg.id_message ||
            msg.id ||
            msg.message_ref ||
            msg._id ||
            `msg-${index}-${Date.now()}`;

          if (seenIds.has(baseId)) {
            console.log(`Skipping duplicate message: ${baseId}`);
            return;
          }
          seenIds.add(baseId);

          const isOutgoing = Boolean(
            msg.direction === "out" ||
              msg.sender?.id === "me" ||
              msg.fromMe ||
              msg.raw?.typeWebhook === "outgoingAPIMessageReceived"
          );

          let text = msg.text || "";
          if (!text && msg.messageData) {
            text =
              msg.messageData?.textMessageData?.textMessage ||
              msg.messageData?.extendedTextMessageData?.text ||
              "";
          }

          if (!text && msg.media) {
            text = getMediaText(msg.media.type, msg.media.name);
          }

          if (!text) {
            text = "[Сообщение]";
          }

          let createdAt = Date.now();
          if (typeof msg.timestamp === "number") {
            createdAt = msg.timestamp * 1000;
          } else if (msg.timestamp) {
            const parsed = Date.parse(msg.timestamp);
            createdAt = isNaN(parsed) ? Date.now() : parsed;
          } else if (typeof msg.created_at === "number") {
            createdAt = msg.created_at * 1000;
          } else if (msg.created_at) {
            const parsed = Date.parse(msg.created_at);
            createdAt = isNaN(parsed) ? Date.now() : parsed;
          }

          const status = isOutgoing
            ? msg.status === "read"
              ? "read"
              : msg.status === "delivered"
              ? "delivered"
              : msg.status === "sent"
              ? "sent"
              : "sent"
            : undefined;

          // Создаем объект сообщения
          const message: Message = {
            id: baseId,
            chatId: decodedChatId,
            author: isOutgoing ? "me" : "them",
            text: text.trim(),
            time: fmtTime(createdAt),
            createdAt,
            status,
          };

          // 🔹 ВОССТАНАВЛИВАЕМ REPLYTo ИЗ ЛОКАЛЬНОГО ХРАНИЛИЩА
          if (messageReplies.has(baseId)) {
            message.replyTo = messageReplies.get(baseId);
            console.log(`🔹 RESTORED replyTo for message ${baseId}:`, message.replyTo);
          }

          // Добавляем медиа информацию если есть
          if (msg.media) {
            message.media = {
              url: msg.media.url || "",
              type: (msg.media.type || "document") as
                | "image"
                | "video"
                | "document"
                | "audio",
              name: msg.media.name,
              size: msg.media.size,
              mime: msg.media.mime,
            };
          }

          mapped.push(message);
        } catch (msgError) {
          console.error("Error processing message:", msgError, msg);
        }
      });

      // Сортируем по времени создания
      mapped.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

      console.log(`Successfully loaded ${mapped.length} messages`);
      console.log(`🔹 Messages with replyTo:`, mapped.filter(m => m.replyTo).length);
      setMessages(mapped);
    } catch (error) {
      console.error("Error loading messages:", error);
      if (!silent) {
        setError(
          error instanceof Error ? error.message : "Failed to load messages"
        );
      }
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  },
  [messageReplies] // 🔹 ДОБАВЬТЕ messageReplies в зависимости
);
  const saveMessageReply = (messageId: string, replyTo: ReplyMessage) => {
    setMessageReplies((prev) => new Map(prev).set(messageId, replyTo));
  };

  const getMediaText = (mediaType: string, fileName?: string) => {
    switch (mediaType?.toLowerCase()) {
      case "image":
        return "📷 Изображение";
      case "video":
        return "🎥 Видео";
      case "audio":
        return "🎵 Аудио";
      case "document":
        // Если это изображение, но пришло как документ
        if (fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return "📷 Изображение";
        }
        return `📄 ${fileName || "Документ"}`;
      default:
        return "📎 Файл";
    }
  };

  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      console.log("Processing WebSocket message:", message);

      // Обработка входящих медиа-сообщений
      if (
        (message.type === "new_message" || message.event === "message") &&
        message.media
      ) {
        console.log("New media message received:", message);

        const messageChatId = message.chat_id || message.from;

        if (messageChatId === chatId) {
          setMessages((prev) => {
            const newMessage: Message = {
              id: message.id_message || `ws-${Date.now()}`,
              chatId: messageChatId,
              author: "them",
              text: getIncomingMediaText(message.media),
              time: fmtTime(Date.now()),
              createdAt: Date.now(),
              media: {
                url: message.media.url,
                type: detectMediaTypeFromData(message.media), // 🔹 УЛУЧШЕННОЕ ОПРЕДЕЛЕНИЕ
                name: message.media.name,
                size: message.media.size,
                mime: message.media.mime,
              },
            };

            if (prev.some((m) => m.id === newMessage.id)) return prev;

            return [...prev, newMessage].sort(
              (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
            );
          });

          setTimeout(scrollToBottom, 100);
        }
      }
    };

    // 🔹 УЛУЧШЕННАЯ функция определения типа медиа из данных
    const detectMediaTypeFromData = (
      mediaData: any
    ): "image" | "video" | "audio" | "document" => {
      console.log("🔍 Detecting media type:", mediaData);
      
      // Если тип явно указан в данных
      if (mediaData.type && mediaData.type !== "document") {
        console.log("✅ Using explicit type:", mediaData.type);
        return mediaData.type;
      }

      // Определяем по MIME типу
      if (mediaData.mime) {
        if (mediaData.mime.startsWith("image/")) {
          console.log("✅ Detected image by MIME:", mediaData.mime);
          return "image";
        }
        if (mediaData.mime.startsWith("video/")) {
          console.log("✅ Detected video by MIME:", mediaData.mime);
          return "video";
        }
        if (mediaData.mime.startsWith("audio/")) {
          console.log("✅ Detected audio by MIME:", mediaData.mime);
          return "audio";
        }
      }

      // Определяем по имени файла
      if (mediaData.name || mediaData.url) {
        const fileName = mediaData.name || mediaData.url;
        const ext = fileName.split(".").pop()?.toLowerCase();
        const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
        const videoExts = ["mp4", "avi", "mov", "mkv", "webm", "3gp", "ogv"];
        const audioExts = ["mp3", "wav", "ogg", "aac", "m4a", "flac"];

        if (imageExts.includes(ext)) {
          console.log("✅ Detected image by extension:", ext);
          return "image";
        }
        if (videoExts.includes(ext)) {
          console.log("✅ Detected video by extension:", ext);
          return "video";
        }
        if (audioExts.includes(ext)) {
          console.log("✅ Detected audio by extension:", ext);
          return "audio";
        }
      }

      console.log("⚠️ Defaulting to document type");
      return "document";
    };

    // 🔹 УЛУЧШЕННАЯ функция для текста медиа-сообщений
    const getIncomingMediaText = (mediaData: any) => {
      const mediaType = detectMediaTypeFromData(mediaData);

      switch (mediaType) {
        case "image":
          return "📷 Изображение";
        case "video":
          return "🎥 Видео";
        case "audio":
          return "🎵 Аудио";
        case "document":
          // Если это изображение, но пришло как документ
          if (
            mediaData.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
            mediaData.mime?.startsWith("image/")
          ) {
            return "📷 Изображение";
          }
          return `📄 ${mediaData.name || "Документ"}`;
        default:
          return "📎 Файл";
      }
    };

    // Вспомогательная функция для преобразования статусов
    const getStatusFromAck = (ack: number) => {
      switch (ack) {
        case 1:
          return "sent";
        case 2:
          return "delivered";
        case 3:
          return "read";
        default:
          return "sent";
      }
    };

    // Подписываемся на сообщения
    onMessage(handleWebSocketMessage);

    // Отписываемся при размонтировании
    return () => {
      offMessage(handleWebSocketMessage);
    };
  }, [chatId, onMessage, offMessage, loadChats]);

  // ✅ Исправленный быстрый старт чата
  const handleCreateChat = async (rawPhone: string) => {
    const phone = normalizePhone(rawPhone);
    console.log("Creating temp chat with phone:", phone);

    setHiddenPhones((prev) => (prev.includes(phone) ? prev : [...prev, phone]));

    const tempChatId = `temp:${phone}`;
    console.log("Temp chat ID:", tempChatId);

    router.push(`/${tempChatId}`);
    setMessages([]);
  };

  // ✅ ИСПРАВЛЕННАЯ отправка сообщений
  // 🔹 ИСПРАВЛЕННАЯ функция отправки сообщений
  const handleSend = async (text: string, replyTo?: ReplyMessage) => {
    if (!text || !chatId) {
      console.log("Cannot send: no text or chatId");
      return;
    }

    const now = Date.now();
    const tempMsgId = crypto.randomUUID();
    // 🔹 СОХРАНЯЕМ replyTo ДО создания optimistic сообщения
    const currentReplyTo = replyTo;

    const optimistic: Message = {
      id: tempMsgId,
      chatId,
      author: "me",
      text,
      time: fmtTime(now),
      createdAt: now,
      status: "sent",
      replyTo: currentReplyTo
        ? {
            id: currentReplyTo.id,
            author: currentReplyTo.author,
            text: currentReplyTo.text,
            media: currentReplyTo.media,
          }
        : undefined,
    };

    // 🔹 СОХРАНЯЕМ ИНФОРМАЦИЮ О REPLYTo
    if (currentReplyTo) {
      saveMessageReply(tempMsgId, {
        id: currentReplyTo.id,
        author: currentReplyTo.author,
        text: currentReplyTo.text,
        media: currentReplyTo.media,
      });
    }

    console.log("🔹 OPTIMISTIC MESSAGE:", {
      id: tempMsgId,
      text: text,
      hasReplyTo: !!currentReplyTo,
      replyTo: currentReplyTo,
    });

    const stick = isNearBottom();
    setMessages((prev) =>
      [...prev, optimistic].sort(
        (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
      )
    );
    setDraft("");

    // 🔹 СБРАСЫВАЕМ СОСТОЯНИЕ ОТВЕТА СРАЗУ ПОСЛЕ СОЗДАНИЯ ОПТИМИСТИЧНОГО СООБЩЕНИЯ
    setReplyingTo(null);

    if (stick) setTimeout(scrollToBottom, 40);

    try {
      let realChatId = chatId;

      // Если это временный чат, создаем реальный
      if (isTempChat && tempPhone) {
        console.log("=== CREATING REAL CHAT FROM TEMP ===");

        if (tempPhone.length !== 11) {
          const errorMsg = `Неверная длина номера: ${tempPhone.length} цифр. Должно быть 11.`;
          console.error(errorMsg);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempMsgId ? { ...m, status: "failed" } : m
            )
          );
          alert(errorMsg);
          return;
        }

        const apiPhone = `${tempPhone}@c.us`;
        console.log("API phone:", apiPhone);

        console.log("Calling start chat API...");

        try {
          const start = await fetch("/api/whatsapp/chats/start", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiConfig.getAccessToken()}`
            },
            body: JSON.stringify({ phone: apiPhone }),
          });

          console.log("Start chat API response status:", start.status);

          let startData;
          try {
            startData = await start.json();
          } catch (parseError) {
            console.error("Failed to parse start chat response:", parseError);
            const textResponse = await start.text();
            startData = {
              error: "Invalid JSON response",
              raw: textResponse,
              status: start.status,
            };
          }

          if (!start.ok || !startData?.chat_id) {
            let errorMessage = "Не удалось создать чат";
            if (startData?.error) errorMessage += `: ${startData.error}`;

            console.error("Failed to create chat:", errorMessage);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempMsgId ? { ...m, status: "failed" } : m
              )
            );
            alert(errorMessage);
            return;
          }

          realChatId = String(startData.chat_id);
          console.log("Real chat created with ID:", realChatId);

          setChats((prev) => [
            ...prev,
            {
              id: realChatId,
              chat_id: realChatId,
              is_group: false,
              name: tempPhone,
              phone: tempPhone,
              lastMessage: text,
              time: fmtTime(now),
              unread: 0,
              avatarFallback: tempPhone.slice(0, 2),
              avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                tempPhone
              )}`,
              updatedAt: now,
            },
          ]);

          router.replace(`/${realChatId}`);
        } catch (networkError) {
          console.error("Network error creating chat:", networkError);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempMsgId ? { ...m, status: "failed" } : m
            )
          );
          alert("Ошибка сети при создании чата");
          return;
        }
      }

      console.log("=== SENDING MESSAGE TO REAL CHAT ===");
      console.log("Real chat ID:", realChatId);
      console.log("WebSocket connected:", isConnected);
      console.log("Replying to:", currentReplyTo); // 🔹 Логируем информацию об ответе

      // 🔹 ПРИОРИТЕТ: Отправка через WebSocket если подключен
      if (isConnected) {
        console.log("Sending via WebSocket");

        const wsMessage = {
          action: "send_message",
          chat_id: realChatId,
          message: text,
          temp_id: tempMsgId,
          type: "text",
          // 🔹 Используем сохраненное значение
          reply_to: currentReplyTo
            ? {
                message_id: currentReplyTo.id,
                chat_id: realChatId,
              }
            : undefined,
        };

        console.log("WebSocket message payload:", wsMessage);

        sendMessage(wsMessage);

        const fallbackTimeout = setTimeout(() => {
          console.log("WebSocket timeout, falling back to HTTP");
          sendViaHttp(realChatId, text, tempMsgId, currentReplyTo);
        }, 3000);

        const cleanup = () => clearTimeout(fallbackTimeout);

        const handleSentConfirmation = (message: any) => {
          if (message.temp_id === tempMsgId || message.id_message) {
            console.log("Message sent confirmation received:", message);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempMsgId
                  ? {
                      ...m,
                      id: message.id_message || m.id,
                      status: "delivered",
                    }
                  : m
              )
            );
            cleanup();
            offMessage(handleSentConfirmation);
          }
        };

        onMessage(handleSentConfirmation);

        setTimeout(() => {
          loadChats(true);
        }, 1000);
      } else {
        // 🔹 РЕЗЕРВ: Отправка через HTTP если WebSocket не доступен
        console.log("WebSocket not connected, sending via HTTP");
        sendViaHttp(realChatId, text, tempMsgId, currentReplyTo);
      }
    } catch (error) {
      console.error("Send message error:", error);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsgId ? { ...m, status: "failed" } : m))
      );
      alert("Ошибка сети при отправке");
    }
    // 🔹 УБИРАЕМ setReplyingTo(null) отсюда - уже сбросили выше
  };

  // 🔹 УПРОЩЕННАЯ функция для выбора файла
  const handleFileSelect = async (file: File) => {
    console.log("=== FILE SELECTED ===");
    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Проверка размера
    if (file.size > 50 * 1024 * 1024) {
      alert("Файл слишком большой (максимум 50MB)");
      return;
    }

    // Проверка типа
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/avi",
      "video/mov",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Неподдерживаемый тип файла: ${file.type}`);
    }

    try {
      await handleSendMedia(file);
    } catch (error) {
      console.error("Failed to send media:", error);
      alert(
        "Ошибка при отправке файла: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  // 🔹 ОБНОВЛЕННАЯ функция отправки медиа с поддержкой ответов
  const handleSendMedia = async (file: File) => {
    if (!chatId) {
      console.log("Cannot send media: no chatId");
      return;
    }

    const now = Date.now();
    const tempMsgId = crypto.randomUUID();

    // Определяем тип файла
    const getFileType = (
      mimeType: string,
      fileName: string
    ): "image" | "video" | "document" | "audio" => {
      console.log("🔍 Determining file type for:", { mimeType, fileName });
      
      if (mimeType.startsWith("image/")) return "image";
      if (mimeType.startsWith("video/")) return "video";
      if (mimeType.startsWith("audio/")) return "audio";
      
      // Дополнительная проверка по расширению для случаев когда MIME неточный
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext || '')) return "video";
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return "image";
      if (['mp3', 'wav', 'ogg', 'aac'].includes(ext || '')) return "audio";
      
      return "document";
    };

    const fileType = getFileType(file.type, file.name);
    console.log("📁 File type determined:", fileType, "for file:", file.name);

    // Оптимистичное сообщение
    const optimistic: Message = {
      id: tempMsgId,
      chatId,
      author: "me",
      text: getMediaText(fileType, file.name),
      time: fmtTime(now),
      createdAt: now,
      status: "sent",
      // 🔹 ДОБАВЛЕНО: информация об ответе для медиа
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            author: replyingTo.author,
            text: replyingTo.text,
            media: replyingTo.media,
          }
        : undefined,
      media: {
        url: URL.createObjectURL(file),
        type: fileType,
        name: file.name,
        size: file.size,
        mime: file.type,
      },
    };

    const stick = isNearBottom();
    setMessages((prev) =>
      [...prev, optimistic].sort(
        (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
      )
    );
    if (stick) setTimeout(scrollToBottom, 40);

    try {
      let realChatId = chatId;

      // 🔹 Обработка временного чата
      if (isTempChat && tempPhone) {
        console.log("=== CREATING REAL CHAT FROM TEMP FOR MEDIA ===");

        if (tempPhone.length !== 11) {
          throw new Error(
            `Неверная длина номера: ${tempPhone.length} цифр. Должно быть 11.`
          );
        }

        const apiPhone = `${tempPhone}@c.us`;
        console.log("API phone for media:", apiPhone);

        const start = await fetch("/api/whatsapp/chats/start", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiConfig.getAccessToken()}`
          },
          body: JSON.stringify({ phone: apiPhone }),
        });

        if (!start.ok) {
          const errorData = await start
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData?.error || "Не удалось создать чат");
        }

        const startData = await start.json();

        if (!startData?.chat_id) {
          throw new Error("Сервер не вернул chat_id");
        }

        realChatId = String(startData.chat_id);
        console.log("Real chat created for media with ID:", realChatId);

        // Обновляем состояние
        setChats((prev) => [
          {
            id: realChatId,
            chat_id: realChatId,
            is_group: false,
            name: tempPhone,
            phone: tempPhone,
            lastMessage: "📎 Медиа",
            time: fmtTime(now),
            unread: 0,
            avatarFallback: tempPhone.slice(0, 2),
            avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
              tempPhone
            )}`,
            updatedAt: now,
          },
          ...prev,
        ]);

        router.replace(`/${realChatId}`);
      }

      console.log("=== SENDING FILE TO CHAT ===");
      console.log("Real chat ID:", realChatId);
      console.log("File:", file.name, file.type, file.size);
      console.log("Replying to:", replyingTo); // 🔹 Логируем информацию об ответе

      // 🔹 СОЗДАЕМ FormData с правильной структурой
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caption", file.name);

      // 🔹 ДОБАВЛЯЕМ информацию об ответе если есть
      if (replyingTo) {
        formData.append("reply_to_message_id", replyingTo.id);
      }

      console.log("Sending FormData to API...");

      // 🔹 ОТПРАВЛЯЕМ через API
      const sendMediaRes = await fetch(
        `/api/whatsapp/chats/${encodeURIComponent(realChatId)}/send/media`,
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("Send media response status:", sendMediaRes.status);

      // 🔹 УЛУЧШЕННАЯ ОБРАБОТКА ОТВЕТА
      let responseData;
      try {
        const responseText = await sendMediaRes.text();
        console.log("Send media response text:", responseText);

        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse send media response:", parseError);
        throw new Error("Неверный формат ответа от сервера");
      }

      if (!sendMediaRes.ok) {
        console.error("Send media API error:", responseData);

        // 🔹 ДЕТАЛЬНАЯ ИНФОРМАЦИЯ ОБ ОШИБКЕ 422
        if (sendMediaRes.status === 422) {
          const errorDetails =
            responseData.details ||
            responseData.error ||
            "Неизвестная ошибка валидации";
          throw new Error(`Ошибка валидации: ${JSON.stringify(errorDetails)}`);
        }

        throw new Error(responseData.error || `HTTP ${sendMediaRes.status}`);
      }

      console.log("Media sent successfully:", responseData);

      // Обновляем сообщение
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMsgId
            ? {
                ...m,
                id: responseData?.id_message || tempMsgId,
                status: "delivered",
                media: m.media
                  ? {
                      ...m.media,
                      url:
                        responseData?.media_url ||
                        responseData?.url ||
                        m.media.url,
                    }
                  : m.media,
              }
            : m
        )
      );

      // 🔹 Сбрасываем состояние ответа после успешной отправки
      setReplyingTo(null);

      // Обновляем чаты и сообщения
      setTimeout(() => {
        loadMessages(realChatId, true);
        loadChats(true);
      }, 1000);
    } catch (error) {
      console.error("Send media error:", error);

      // Отмечаем сообщение как failed
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsgId ? { ...m, status: "failed" } : m))
      );

      // 🔹 БОЛЕЕ ИНФОРМАТИВНОЕ СООБЩЕНИЕ ОБ ОШИБКЕ
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      alert(`Ошибка при отправке файла "${file.name}": ${errorMessage}`);
    }
  };

  const sendViaHttp = async (
    realChatId: string,
    text: string,
    tempMsgId: string,
    replyTo?: ReplyMessage
  ) => {
    try {
      console.log("🔹 Sending HTTP request with replyTo:", replyTo);

      // 🔹 ПРАВИЛЬНАЯ СТРУКТУРА ДЛЯ ВАШЕГО API
      const requestBody: any = {
        text: text,
      };

      if (replyTo) {
        requestBody.reply_to = {
          message_id: replyTo.id,
        };
      }

      console.log("🔹 HTTP Request body:", requestBody);

      const sendRes = await fetch(
        `/api/whatsapp/chats/${encodeURIComponent(realChatId)}/send`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiConfig.getAccessToken()}`
          },
          body: JSON.stringify(requestBody),
        }
      );

      let sendData;
      try {
        sendData = await sendRes.json();
      } catch (parseError) {
        console.error("Failed to parse send message response:", parseError);
        sendData = { error: "Invalid response" };
      }

      if (sendRes.ok) {
        console.log("Message sent successfully via HTTP");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempMsgId
              ? {
                  ...m,
                  id: sendData?.id_message || tempMsgId,
                  status: "delivered",
                }
              : m
          )
        );
        setTimeout(() => {
          loadMessages(realChatId, true);
          loadChats(true);
        }, 1000);
      } else {
        console.error("Failed to send message via HTTP:", sendData);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsgId ? { ...m, status: "failed" } : m))
        );
        alert(sendData?.error || "Не удалось отправить сообщение");
      }
    } catch (error) {
      console.error("HTTP send error:", error);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsgId ? { ...m, status: "failed" } : m))
      );
    }
  };
  // Effects
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (chatId) {
      console.log("Loading messages for chat:", chatId);
      loadMessages(chatId);
    }
  }, [chatId, loadMessages]);

  // HTTP Polling для обновления данных когда WebSocket недоступен
  useEffect(() => {
    // Определяем нужен ли polling
    const shouldPoll = !FEATURES.WEBSOCKET_ENABLED || 
                      connectionState === 'error' || 
                      connectionState === 'disconnected';

    if (!shouldPoll) {
      console.log("📡 WebSocket активен - polling отключен");
      return;
    }

    console.log("🔄 HTTP polling активен (WebSocket недоступен)");
    
    // Более частое обновление в HTTP режиме
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        setIsPolling(true);
        
        // Обновляем чаты
        loadChats(true).finally(() => setIsPolling(false));
        
        // Обновляем сообщения текущего чата
        if (chatId && !isTempChat) {
          loadMessages(chatId, true);
        }
      }
    }, FEATURES.HTTP_POLLING_INTERVAL);

    return () => {
      console.log("🔄 HTTP polling остановлен");
      clearInterval(pollInterval);
    };
  }, [chatId, isTempChat, connectionState, loadChats, loadMessages]);

  useEffect(() => {
    if (isNearBottom()) scrollToBottom();
  }, [messages]);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === chatId),
    [chats, chatId]
  );

  const visibleChats = useMemo(
    () =>
      chats.filter(
        (c) => !(hiddenPhones.includes(c.phone || "") && (c.unread ?? 0) === 0)
      ),
    [chats, hiddenPhones]
  );

  const filteredChats = useMemo(
    () =>
      visibleChats.filter(
        (c) =>
          c.name?.toLowerCase().includes(query.toLowerCase()) ||
          c.phone?.includes(query)
      ),
    [visibleChats, query]
  );

  const unhideCurrent = () => {
    const phone = isTempChat ? tempPhone : selectedChat?.phone;
    if (!phone) return;
    setHiddenPhones((prev) => prev.filter((p) => p !== phone));
  };

  // Добавьте эту функцию для тестирования
  const testWebSocketConnection = () => {
    console.log("=== WEBSOCKET TEST ===");
    console.log("Connected:", isConnected);

    // Тестовая отправка сообщения
    if (isConnected && chatId && !isTempChat) {
      sendMessage({
        action: "ping",
        timestamp: Date.now(),
      });
    }
  };
  // Добавьте кнопку для тестирования в UI (временно)
  <Button
    variant="outline"
    size="sm"
    onClick={testWebSocketConnection}
    className="absolute top-2 right-2 z-50"
  >
    Test WS
  </Button>;

  // Мониторинг состояния WebSocket
  useEffect(() => {
    console.log("=== WEBSOCKET STATUS ===");
    console.log("Connected:", isConnected);
    console.log("State:", connectionState);
    console.log("Chat ID:", chatId);
    console.log("Is temp chat:", isTempChat);
    
    // Дополнительная информация при изменении состояния
    if (connectionState === 'connected' && !isTempChat && chatId) {
      console.log(`✅ Ready to send messages for chat: ${chatId}`);
    } else if (connectionState === 'error') {
      console.log("❌ WebSocket connection failed - messages will be sent via HTTP");
    }
  }, [isConnected, connectionState, chatId, isTempChat]);
  const isLoadingUI = loadingChats || loadingMessages;

  // Улучшенная функция скролла
  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, []);

  // Авто-скролл при изменении сообщений
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isNearBottom()) {
        scrollToBottom();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Функция для принудительного обновления
  const forceRefresh = useCallback(() => {
    console.log("Force refreshing chats and messages");
    loadChats();
    if (chatId) {
      loadMessages(chatId);
    }
  }, [loadChats, loadMessages, chatId]);

  // Добавьте кнопку обновления в мобильный хедер
  <Button
    variant="ghost"
    size="icon"
    onClick={forceRefresh}
    disabled={loadingChats}
  >
    <RefreshCw className={`h-4 w-4 ${loadingChats ? "animate-spin" : ""}`} />
  </Button>;

  return (
    <TooltipProvider>
      {/* Улучшенный индикатор WebSocket подключения */}
      <div
        className={`fixed top-0 left-0 right-0 h-1 z-50 transition-all ${
          connectionState === 'connected' ? "bg-green-500" : 
          connectionState === 'connecting' ? "bg-yellow-500 animate-pulse" :
          connectionState === 'error' ? "bg-red-600 animate-pulse" :
          "bg-red-500 animate-pulse"
        }`}
        title={
          connectionState === 'connected' ? "WebSocket подключен" :
          connectionState === 'connecting' ? "Подключение..." :
          connectionState === 'error' ? "Ошибка подключения" :
          "WebSocket отключен"
        }
      />
      
      {/* Информация о режиме и переподключение */}
      {FEATURES.SHOW_CONNECTION_STATUS && (
        <>
          
          {FEATURES.WEBSOCKET_ENABLED && (connectionState === 'error' || connectionState === 'disconnected') && (
            <div className="fixed top-2 right-2 z-50 flex gap-2">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-1 rounded-md text-xs">
                📡 HTTP-режим (WebSocket недоступен)
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={reconnect}
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                🔄 Переподключить
              </Button>
            </div>
          )}
          
          {FEATURES.WEBSOCKET_ENABLED && connectionState === 'connecting' && (
            <div className="fixed top-2 right-2 z-50">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-md text-xs">
                🔄 Подключение к WebSocket...
              </div>
            </div>
          )}
        </>
      )}

      {isPolling && (
        <div className="fixed top-1 left-0 right-0 h-0.5 bg-green-500/20 z-50" />
      )}

      {(isLoadingUI || isSwitchingChat) && (
        <div className="fixed inset-x-0 top-2 h-[2px] bg-green-500/30 animate-pulse z-50" />
      )}

      {/* Мобильный Sidebar */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        query={query}
        setQuery={setQuery}
        chats={filteredChats}
        selectedId={chatId ?? undefined}
        setSelectedId={(id) => {
          console.log("Setting selected chat:", id);
          // Показываем состояние переключения
          setIsSwitchingChat(true);
          // Плавный переход без перезагрузки страницы
          router.push(`/${encodeURIComponent(id)}`, { scroll: false });
          // Убираем состояние переключения через небольшую задержку
          setTimeout(() => setIsSwitchingChat(false), 300);
        }}
        onCreateChat={handleCreateChat}
        onDeleteChat={handleDeleteChat}
      />

      <div className="flex h-[calc(100vh-2rem)] md:h-screen w-full bg-background text-foreground">
        {/* Desktop Sidebar - Стилизован под WhatsApp в Sidebar.tsx */}
        <aside className="hidden md:flex md:w-[360px] lg:w-[400px] flex-col border-r border-gray-200 dark:border-gray-800">
          {loadingChats ? (
            // Скелетон загрузки
            <div className="p-2 space-y-1">
              {/* Скелетон хедер */}
              <div className="h-14 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800" />
              {/* Скелетон поиска */}
              <div className="h-10 mx-2 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              {/* Скелетоны чатов */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Sidebar
              query={query}
              setQuery={setQuery}
              chats={filteredChats}
              selectedId={chatId ?? undefined}
              setSelectedId={(id) => {
                console.log("Setting selected chat:", id);
                // Показываем состояние переключения
                setIsSwitchingChat(true);
                // Плавный переход без перезагрузки страницы
                router.push(`/${encodeURIComponent(id)}`, { scroll: false });
                // Убираем состояние переключения через небольшую задержку
                setTimeout(() => setIsSwitchingChat(false), 300);
              }}
              onCreateChat={handleCreateChat}
              onDeleteChat={handleDeleteChat}
            />
          )}
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col">
          {/* 💬 WhatsApp Style: Мобильный хедер чата */}
          <div
            // 📌 Изменение: Фон и цвет текста как в WhatsApp
            className="md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
          >
            <div className="flex items-center justify-between p-3">
              {/* Кнопка открытия Sidebar (Назад) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden flex-shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex-1 text-center min-w-0">
                {selectedChat ? (
                  <div className="flex items-center gap-3 w-full pl-2">
                    {/* Аватар собеседника */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage
                        src={selectedChat.avatarUrl}
                        alt={selectedChat.name}
                      />
                      <AvatarFallback className="bg-green-500 text-white">
                        {selectedChat.avatarFallback}
                      </AvatarFallback>
                    </Avatar>

                    {/* Имя и статус */}
                    <div className="text-left truncate">
                      <div className="font-semibold text-base truncate">
                        {selectedChat.name || selectedChat.phone}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {isConnected ? "онлайн" : "был(а) недавно"}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Сообщение при отсутствии выбранного чата
                  <div className="font-medium text-gray-500 dark:text-gray-400">
                    Выберите чат
                  </div>
                )}
              </div>

              {/* Правая часть хедера: Кнопка обновления + Меню чата */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* 📌 Добавлено: Кнопка принудительного обновления */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={forceRefresh}
                  disabled={loadingChats}
                >
                  <RefreshCw
                    className={`h-5 w-5 ${
                      loadingChats
                        ? "animate-spin text-green-500"
                        : "text-gray-500"
                    }`}
                  />
                </Button>

                {/* Меню чата */}
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>

          {/* Баннер про скрытый чат (оставляем без изменений) */}
          {(isTempChat ||
            (selectedChat &&
              hiddenPhones.includes(selectedChat.phone || ""))) && (
            <div className="px-3 md:px-6 py-2 text-[12px] bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-b border-yellow-200 dark:border-yellow-800 flex items-center gap-2">
              <span>
                Скрытый чат с{" "}
                <b>{isTempChat ? tempPhone : selectedChat?.phone}</b> — не
                показывается в списке слева.
              </span>
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-600 dark:hover:text-yellow-200"
                onClick={unhideCurrent}
              >
                Показать в списке
              </Button>
            </div>
          )}

          {/* Messages */}
          {chatId ? (
            <ScrollArea
              className="flex-1"
              ref={(el) => {
                const vp = el?.querySelector(
                  "[data-radix-scroll-area-viewport]"
                ) as HTMLDivElement | null;
                scrollContainerRef.current = vp ?? null;
              }}
              style={{
                backgroundImage: `url('/telegramm-bg-tile.png')`,
                backgroundAttachment: "fixed",
                backgroundRepeat: "no-repeat",
                // 🚀 ГЛАВНОЕ ИЗМЕНЕНИЕ: Установка размера фона
                backgroundSize: "cover", // или '100% 100%', если нужно точное заполнение
                backgroundColor: "#ECE5DD",
              }}
            >
                           {" "}
              <div className="px-3 md:px-6 py-4 space-y-3">
                               {" "}
                {loadingMessages ? (
                  <>
                                       {" "}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          i % 2 ? "justify-end" : "justify-start"
                        }`}
                      >
                                               {" "}
                        <div className="h-12 w-56 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                                             {" "}
                      </div>
                    ))}
                                     {" "}
                  </>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                                       {" "}
                    {isTempChat
                      ? "Напишите первое сообщение — чат ещё не создан на сервере"
                      : "Нет сообщений"}
                                     {" "}
                  </div>
                ) : (
                  messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      msg={m}
                      onReply={handleReplyToMessage}
                      isReplying={replyingTo?.id === m.id}
                      onDelete={handleDeleteMessage}
                    />
                  ))
                )}
                                <div ref={bottomRef} />             {" "}
              </div>
                         {" "}
            </ScrollArea>
          ) : (
            // Экран выбора чата (уже стилизован)
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="text-2xl font-semibold mb-2 text-green-500">
                  <MessageCircleMore className="inline h-6 w-6 mb-1" /> WhatsApp
                  Web
                </div>
                <p className="text-muted-foreground mb-4">
                  Начните общение, выбрав существующий чат или нажав на меню
                  <MoreVertical className="inline h-4 w-4 mx-1" />
                </p>
                <Button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Открыть список чатов
                </Button>
              </div>
            </div>
          )}

          {/* Composer */}
          {chatId && (
            <div className="sticky bottom-0 z-10 bg-transparent">
              {/* Composer уже стилизован под WhatsApp */}
              <Composer
                draft={draft}
                setDraft={setDraft}
                onSend={handleSend}
                onFileSelect={handleFileSelect}
                disabled={!chatId}
                placeholder={"Введите сообщение..."}
                replyingTo={replyingTo}
                onCancelReply={handleCancelReply}
              />
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
