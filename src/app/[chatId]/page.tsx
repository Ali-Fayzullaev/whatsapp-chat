// src/app/[chatId]/page.tsx
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Chat, Message } from "@/components/chat/types";
import { Sidebar } from "@/components/chat/Sidebar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Composer } from "@/components/chat/Composer";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { MobileSidebar } from "@/components/chat/MobileSidebar";
import { Menu, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiConfig } from "@/lib/api-config";

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
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 🔹 WebSocket хуки ТОЛЬКО ОДИН РАЗ наверху
  const { isConnected, sendMessage, onMessage, offMessage } = useWebSocket();

  // 🔹 Правильно определяем временный чат
  const isTempChat = !!chatId?.startsWith("temp:");
  const tempPhone = isTempChat ? chatId.replace("temp:", "") : null;

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

        const res = await fetch(
          `/api/whatsapp/chats/${encodeURIComponent(decodedChatId)}/messages`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        // 🔹 УЛУЧШЕННАЯ ОБРАБОТКА ОШИБОК
        if (!res.ok) {
          console.warn(`Messages API error: ${res.status} ${res.statusText}`);

          // Для 404 ошибки - возвращаем пустой массив (чат не найден)
          if (res.status === 404) {
            setMessages([]);
            return;
          }

          // Для других ошибок пробуем получить текст ошибки
          try {
            const errorData = await res.json();
            throw new Error(errorData?.error || `HTTP ${res.status}`);
          } catch {
            throw new Error(`Failed to load messages: ${res.status}`);
          }
        }

        const data = await res.json();
        console.log("Messages API response:", data);

        // 🔹 БЕЗОПАСНОЕ ИЗВЛЕЧЕНИЕ ДАННЫХ
        let messagesArray: any[] = [];

        if (Array.isArray(data)) {
          messagesArray = data;
        } else if (data && Array.isArray(data.items)) {
          messagesArray = data.items;
        } else if (data && typeof data === "object") {
          // Если данные в другом формате, пробуем извлечь сообщения
          messagesArray = Object.values(data).filter(Array.isArray).flat();
        }

        console.log(`Processing ${messagesArray.length} messages`);

        // 🔹 ОБРАБОТКА СООБЩЕНИЙ С ДУБЛИКАТАМИ
        const seenIds = new Set<string>();
        const mapped: Message[] = [];

        messagesArray.forEach((msg: any, index: number) => {
          try {
            // Безопасное извлечение ID
            const baseId =
              msg.id_message ||
              msg.id ||
              msg.message_ref ||
              msg._id ||
              `msg-${index}-${Date.now()}`;

            // Пропускаем дубликаты
            if (seenIds.has(baseId)) {
              console.log(`Skipping duplicate message: ${baseId}`);
              return;
            }
            seenIds.add(baseId);

            // Определяем авторство
            const isOutgoing = Boolean(
              msg.direction === "out" ||
                msg.sender?.id === "me" ||
                msg.fromMe ||
                msg.raw?.typeWebhook === "outgoingAPIMessageReceived"
            );

            // Безопасное извлечение текста
            let text = msg.text || "";
            if (!text && msg.messageData) {
              text =
                msg.messageData?.textMessageData?.textMessage ||
                msg.messageData?.extendedTextMessageData?.text ||
                "";
            }

            // Если текст пустой и есть медиа
            if (!text && msg.media) {
              text = getMediaText(msg.media.type, msg.media.name);
            }

            // Если все еще пустой текст
            if (!text) {
              text = "[Сообщение]";
            }

            // Безопасное извлечение времени
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

            // Определяем статус для исходящих сообщений
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
        setMessages(mapped);
      } catch (error) {
        console.error("Error loading messages:", error);

        // 🔹 НЕ СБРАСЫВАЕМ СООБЩЕНИЯ ПРИ ОШИБКЕ - оставляем предыдущие
        // setMessages([]); // ← ЭТУ СТРОКУ УБИРАЕМ

        if (!silent) {
          setError(
            error instanceof Error ? error.message : "Failed to load messages"
          );
        }
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    []
  ); // ✅ useCallback без зависимостей

  // 🔹 ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ МЕДИА-ТЕКСТА
  const getMediaText = (mediaType: string, fileName?: string) => {
    switch (mediaType?.toLowerCase()) {
      case "image":
        return "📷 Изображение";
      case "video":
        return "🎥 Видео";
      case "audio":
        return "🎵 Аудио";
      case "document":
        return `📄 ${fileName || "Документ"}`;
      default:
        return "📎 Файл";
    }
  };

  // 🔹 УЛУЧШЕННЫЙ WebSocket обработчик с принудительным обновлением
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      console.log("Processing WebSocket message:", message);

      // Обработка нового входящего сообщения
      if (
        message.type === "new_message" ||
        message.event === "message" ||
        message.message
      ) {
        console.log(
          "New message received for chat:",
          message.chat_id || message.from
        );

        const messageChatId = message.chat_id || message.from;

        // Если сообщение для текущего чата
        if (messageChatId === chatId) {
          console.log("Message is for current chat, updating UI immediately");

          setMessages((prev) => {
            const newMessage: Message = {
              id:
                message.id_message ||
                message.id ||
                `ws-${Date.now()}-${Math.random()}`,
              chatId: messageChatId,
              author: "them",
              text:
                message.text ||
                message.body ||
                message.content ||
                message.message ||
                "[Сообщение]",
              time: fmtTime(Date.now()),
              createdAt: Date.now(),
            };

            // Проверяем, нет ли уже такого сообщения
            if (prev.some((m) => m.id === newMessage.id)) {
              console.log("Message already exists, skipping");
              return prev;
            }

            console.log("Adding new message to state:", newMessage);
            const updatedMessages = [...prev, newMessage].sort(
              (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
            );

            // 🔹 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ
            setTimeout(() => {
              scrollToBottom();
            }, 50);

            return updatedMessages;
          });

          // 🔹 СРАЗУ обновляем список чатов для этого сообщения
          setTimeout(() => {
            loadChats(true);
          }, 100);
        } else {
          // 🔹 ВАЖНО: Если сообщение не для текущего чата, все равно обновляем список
          console.log("Message for other chat, refreshing chats list");
          setTimeout(() => {
            loadChats(true);
          }, 200);
        }
      }

      // Обработка статусов сообщений
      if (
        message.type === "message_status" ||
        message.event === "message_ack" ||
        message.ack
      ) {
        console.log("Message status update:", message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id_message ||
            m.id === message.temp_id ||
            m.id === message.id
              ? {
                  ...m,
                  status: getStatusFromAck(message.status || message.ack),
                }
              : m
          )
        );
      }

      // В WebSocket обработчике добавьте:
      if (message.type === "new_message" && message.media) {
        console.log("New media message received:", message);

        if (message.chat_id === chatId) {
          setMessages((prev) => {
            const newMessage: Message = {
              id: message.id_message || `ws-${Date.now()}`,
              chatId: message.chat_id,
              author: "them",
              text: getIncomingMediaText(
                message.media?.type,
                message.media?.name
              ),
              time: fmtTime(Date.now()),
              createdAt: Date.now(),
              media: message.media
                ? {
                    url: message.media.url,
                    type: message.media.type,
                    name: message.media.name,
                    size: message.media.size,
                    mime: message.media.mime,
                  }
                : undefined,
            };

            if (prev.some((m) => m.id === newMessage.id)) return prev;

            return [...prev, newMessage].sort(
              (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
            );
          });

          setTimeout(scrollToBottom, 100);
        }
      }

      // Вспомогательная функция
      const getIncomingMediaText = (mediaType: string, fileName: string) => {
        switch (mediaType) {
          case "image":
            return "📷 Изображение";
          case "video":
            return "🎥 Видео";
          case "audio":
            return "🎵 Аудио";
          case "document":
            return `📄 ${fileName || "Документ"}`;
          default:
            return "📎 Файл";
        }
      };

      // Обработка подтверждения отправки
      if (
        (message.type === "message_sent" || message.event === "message_sent") &&
        message.temp_id
      ) {
        console.log("Message sent confirmation:", message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.temp_id
              ? {
                  ...m,
                  id: message.id_message || m.id,
                  status: "delivered",
                }
              : m
          )
        );
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
  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !chatId) {
      console.log("Cannot send: no text or chatId");
      return;
    }

    const now = Date.now();
    const tempMsgId = crypto.randomUUID();
    const optimistic: Message = {
      id: tempMsgId,
      chatId,
      author: "me",
      text,
      time: fmtTime(now),
      createdAt: now,
      status: "sent",
    };

    const stick = isNearBottom();
    setMessages((prev) =>
      [...prev, optimistic].sort(
        (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
      )
    );
    setDraft("");
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
            headers: { "Content-Type": "application/json" },
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

          // 🔹 ВАЖНО: Обновляем состояние перед навигацией
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

      // 🔹 ПРИОРИТЕТ: Отправка через WebSocket если подключен
      if (isConnected) {
        console.log("Sending via WebSocket");

        // 🔹 ИСПРАВЛЕННЫЙ формат сообщения для WebSocket
        const wsMessage = {
          action: "send_message", // или "sendMessage" - зависит от вашего сервера
          chat_id: realChatId,
          message: text,
          temp_id: tempMsgId,
          type: "text",
        };

        console.log("WebSocket message payload:", wsMessage);

        // Отправляем через WebSocket
        sendMessage(wsMessage);

        // 🔹 НЕ обновляем статус сразу - ждем подтверждения от сервера
        // setMessages((prev) =>
        //   prev.map((m) =>
        //     m.id === tempMsgId ? { ...m, status: "delivered" } : m
        //   )
        // );

        // Резерв: если через 3 секунды нет подтверждения, пробуем HTTP
        const fallbackTimeout = setTimeout(() => {
          console.log("WebSocket timeout, falling back to HTTP");
          sendViaHttp(realChatId, text, tempMsgId);
        }, 3000);

        // Очищаем таймаут при успешном получении подтверждения
        const cleanup = () => clearTimeout(fallbackTimeout);

        // Временная подписка на подтверждение отправки
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

        // Обновляем список чатов
        setTimeout(() => {
          loadChats(true);
        }, 1000);
      } else {
        // 🔹 РЕЗЕРВ: Отправка через HTTP если WebSocket не доступен
        console.log("WebSocket not connected, sending via HTTP");
        sendViaHttp(realChatId, text, tempMsgId);
      }
    } catch (error) {
      console.error("Send message error:", error);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsgId ? { ...m, status: "failed" } : m))
      );
      alert("Ошибка сети при отправке");
    }
  };

  // 🔹 ИСПРАВЛЕННАЯ ФУНКЦИЯ ДЛЯ ВЫБОРА ФАЙЛА
  // Замените функцию handleFileSelect и handleSendMedia в ChatPage

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
      alert("Неподдерживаемый тип файла");
      return;
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

  // 🔹 ИСПРАВЛЕННАЯ функция отправки медиа
  const handleSendMedia = async (file: File) => {
    if (!chatId) {
      console.log("Cannot send media: no chatId");
      return;
    }

    const now = Date.now();
    const tempMsgId = crypto.randomUUID();

    // Определяем тип файла
    const getFileType = (
      mimeType: string
    ): "image" | "video" | "document" | "audio" => {
      if (mimeType.startsWith("image/")) return "image";
      if (mimeType.startsWith("video/")) return "video";
      if (mimeType.startsWith("audio/")) return "audio";
      return "document";
    };

    const fileType = getFileType(file.type);

    // Оптимистичное сообщение
    const optimistic: Message = {
      id: tempMsgId,
      chatId,
      author: "me",
      text: getMediaText(fileType, file.name),
      time: fmtTime(now),
      createdAt: now,
      status: "sent",
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
          headers: { "Content-Type": "application/json" },
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

      // 🔹 СОЗДАЕМ FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caption", file.name);

      console.log("Sending FormData to API...");

      // 🔹 ОТПРАВЛЯЕМ через API
      const sendMediaRes = await fetch(
        `/api/whatsapp/chats/${encodeURIComponent(realChatId)}/send/media`,
        {
          method: "POST",
          body: formData,
          // НЕ указываем Content-Type - браузер сам добавит с boundary
        }
      );

      console.log("Send media response status:", sendMediaRes.status);

      if (!sendMediaRes.ok) {
        const errorText = await sendMediaRes.text();
        console.error("Send media error response:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        throw new Error(errorData?.error || `HTTP ${sendMediaRes.status}`);
      }

      const sendMediaData = await sendMediaRes.json();
      console.log("Media sent successfully:", sendMediaData);

      // Обновляем сообщение
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMsgId
            ? {
                ...m,
                id: sendMediaData?.id_message || tempMsgId,
                status: "delivered",
                media: m.media
                  ? {
                      ...m.media,
                      url:
                        sendMediaData?.media_url ||
                        sendMediaData?.url ||
                        m.media.url,
                    }
                  : m.media,
              }
            : m
        )
      );

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

      alert(
        "Ошибка при отправке медиа: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  // 🔹 Вспомогательная функция для HTTP отправки
  const sendViaHttp = async (
    realChatId: string,
    text: string,
    tempMsgId: string
  ) => {
    try {
      const sendRes = await fetch(
        `/api/whatsapp/chats/${encodeURIComponent(realChatId)}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
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

  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        setIsPolling(true);
        loadChats(true).finally(() => setIsPolling(false));
        if (chatId && !isTempChat) {
          loadMessages(chatId, true);
        }
      }
    }, 300000);

    return () => clearInterval(pollInterval);
  }, [chatId, isTempChat, loadChats, loadMessages]);

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

  // В компоненте ChatPage добавьте
  useEffect(() => {
    console.log("=== WEBSOCKET STATUS ===");
    console.log("WebSocket connected:", isConnected);
    console.log("Current chatId:", chatId);
    console.log("Is temp chat:", isTempChat);
  }, [isConnected, chatId, isTempChat]);
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
      {/* Индикатор WebSocket подключения */}
      <div
        className={`fixed top-0 left-0 right-0 h-1 z-50 transition-all ${
          isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"
        }`}
      />

      {isPolling && (
        <div className="fixed top-1 left-0 right-0 h-0.5 bg-blue-500/20 z-50" />
      )}

      {isLoadingUI && (
        <div className="fixed inset-x-0 top-2 h-[2px] bg-primary/30 animate-pulse z-50" />
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
          router.push(`/${id}`);
        }}
        onCreateChat={handleCreateChat}
      />

      <div className="flex h-[calc(100vh-2rem)] md:h-screen w-full bg-background text-foreground">
        {/* Desktop Sidebar - скрыт на мобилках */}
        <aside className="hidden md:flex md:w-[360px] lg:w-[400px] flex-col border-r">
          {loadingChats ? (
            <div className="p-3 space-y-2">
              <div className="h-9 bg-muted rounded-md animate-pulse" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-muted/60 rounded-xl animate-pulse"
                />
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
                router.push(`/${id}`);
              }}
              onCreateChat={handleCreateChat}
            />
          )}
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col">
          {/* Мобильный хедер */}
          <div className="md:hidden border-b bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between p-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex-1 text-center">
                {selectedChat ? (
                  <div className="flex items-center justify-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {selectedChat.avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {selectedChat.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isConnected ? "online" : "offline"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="font-medium">Выберите чат</div>
                )}
              </div>

              <div className="w-9"> {/* Placeholder for balance */} </div>
            </div>
          </div>

          {/* Баннер про скрытый чат */}
          {(isTempChat ||
            (selectedChat &&
              hiddenPhones.includes(selectedChat.phone || ""))) && (
            <div className="px-3 md:px-6 py-2 text-[12px] bg-muted text-muted-foreground border-b flex items-center gap-2">
              <span>
                Скрытый чат с{" "}
                <b>{isTempChat ? tempPhone : selectedChat?.phone}</b> — не
                показывается в списке слева.
              </span>
              <Button
                variant="link"
                className="h-auto p-0 text-xs"
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
            >
              <div className="px-3 md:px-6 py-4 space-y-3">
                {loadingMessages ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          i % 2 ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className="h-12 w-56 bg-muted rounded-2xl animate-pulse" />
                      </div>
                    ))}
                  </>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {isTempChat
                      ? "Напишите первое сообщение — чат ещё не создан на сервере"
                      : "Нет сообщений"}
                  </div>
                ) : (
                  messages.map((m) => <MessageBubble key={m.id} msg={m} />)
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="text-lg font-semibold mb-2">Выберите чат</div>
                <p className="text-muted-foreground mb-4">
                  Начните общение, выбрав существующий чат или создав новый
                </p>
                <Button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="w-full"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Открыть список чатов
                </Button>
              </div>
            </div>
          )}

          {/* Composer */}
          {chatId && (
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
              <Composer
                draft={draft}
                setDraft={setDraft}
                onSend={handleSend}
                onFileSelect={handleFileSelect} // 🔹 ИЗМЕНЕНО
                disabled={!chatId}
                placeholder={
                  chatId
                    ? "Введите сообщение..."
                    : "Сначала выберите чат или создайте новый"
                }
              />
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
