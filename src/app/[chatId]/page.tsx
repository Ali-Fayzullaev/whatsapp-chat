// src/app/[chatId]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Phone, Video } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Chat, Message } from "@/components/chat/types";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Composer } from "@/components/chat/Composer";
import { IconButton } from "@/components/chat/_parts";
import { Input } from "@/components/ui/input";
import { TestApi } from "@/components/TestApi";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ chatId: string }>();
  const chatId = params?.chatId
    ? Array.isArray(params.chatId)
      ? params.chatId[0]
      : params.chatId
    : null;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [draft, setDraft] = useState("");
  const [newChatPhone, setNewChatPhone] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  // Загрузка чатов
  const loadChats = async () => {
    setLoadingChats(true);
    setError(null);
    try {
      console.log("Loading chats...");
      const res = await fetch("/api/whatsapp/chats");

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load chats");
      }

      const data = await res.json();
      console.log("Loaded chats data:", data);

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: expected array");
      }

      const mappedChats: Chat[] = data.map((chat: any, index: number) => {
        // ✅ Извлекаем ID из chat_id или id
        const rawId = chat?.chat_id || chat?.id;
        const id = rawId ? String(rawId) : `temp-${index}`;

        // ✅ Извлекаем телефон из разных возможных полей
        let phone = chat?.phone || chat?.id || chat?.chat_id || "";
        // Убираем @c.us если есть
        phone = phone.replace("@c.us", "");

        const name = phone || `Чат ${id}`;

        return {
          id,
          name,
          phone,
          lastMessage: chat?.last_message || chat?.text || "",
          time: new Date(
            chat?.created_at || chat?.timestamp || Date.now()
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          unread: chat?.unread_count || 0,
          avatarFallback: name.slice(0, 2).toUpperCase(),
          avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
            name
          )}`,
        };
      });

      console.log("Mapped chats:", mappedChats);
      setChats(mappedChats);
    } catch (err) {
      console.error("Failed to load chats", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (currentChatId: string) => {
    if (!currentChatId) return;

    setLoadingMessages(true);
    try {
      console.log("Loading messages for chat:", currentChatId);

      // Убедимся, что chatId правильно закодирован
      const encodedChatId = encodeURIComponent(currentChatId);
      const res = await fetch(`/api/whatsapp/chats/${encodedChatId}/messages`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `HTTP ${res.status}: ${res.statusText}`
        );
      }

      const data = await res.json();
      console.log("Raw messages data from API:", data);

      // ✅ API возвращает { items: [...] }
      const messagesArray = Array.isArray(data?.items) ? data.items : [];
      console.log("Messages array:", messagesArray);

      // Создаем mappedMessages без сортировки внутри map
      const mappedMessages: Message[] = messagesArray
        .filter((msg: any, index: number, array: any[]) => {
          // Убираем дубликаты - оставляем только первое вхождение каждого id_message
          const firstIndex = array.findIndex(
            (m) => m.id_message === msg.id_message
          );
          return firstIndex === index;
        })
        .map((msg: any, index: number) => {
          console.log(`Processing message ${index}:`, msg);

          // ✅ Определяем автора на основе направления или sender
          const isOutgoing =
            msg.direction === "out" ||
            msg.sender?.id === "me" ||
            msg.sender?.id === "77002104444@c.us" ||
            (msg.raw && msg.raw.typeWebhook === "outgoingAPIMessageReceived");

          const author = isOutgoing ? "me" : "them";

          // ✅ Извлекаем текст из разных возможных полей
          let text = msg.text || "[Медиа]";

          // Если есть вложенные структуры, извлекаем текст оттуда
          if (msg.messageData?.textMessageData?.textMessage) {
            text = msg.messageData.textMessageData.textMessage;
          } else if (msg.messageData?.extendedTextMessageData?.text) {
            text = msg.messageData.extendedTextMessageData.text;
          }

          // Форматируем время
          let messageTime;
          try {
            messageTime = new Date(
              msg.timestamp || msg.created_at || Date.now()
            );
          } catch (e) {
            messageTime = new Date();
          }

          const timeString = messageTime.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          });

          // ✅ Создаем уникальный ID с учетом типа сообщения
          const uniqueId = `${msg.id_message || msg._id}-${
            msg.direction || "unknown"
          }-${index}`;

          return {
            id: uniqueId,
            chatId: currentChatId,
            author,
            text,
            time: timeString,
            status:
              author === "me"
                ? msg.status === "read"
                  ? "read"
                  : msg.status === "delivered"
                  ? "delivered"
                  : "sent"
                : undefined,
          };
        });

      console.log("Filtered mapped messages before sort:", mappedMessages);

      // ✅ Теперь сортируем mappedMessages ПОСЛЕ создания всего массива
      mappedMessages.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();

        // Если время некорректное, используем индекс
        if (isNaN(timeA) || isNaN(timeB)) {
          return a.id.localeCompare(b.id);
        }

        return timeA - timeB; // Старые сообщения первыми
      });

      console.log("Sorted messages:", mappedMessages);
      setMessages(mappedMessages);
    } catch (err) {
      console.error("Failed to load messages", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };
  useEffect(() => {
    if (!loadingChats && chats.length > 0 && !chatId) {
      // Автоматически выбираем первый чат, если нет выбранного
      const firstChat = chats[0];
      if (firstChat) {
        router.push(`/${encodeURIComponent(firstChat.id)}`);
      }
    }
  }, [chats, loadingChats, chatId, router]);

  // Создание нового чата
  const handleCreateChat = async () => {
    if (!newChatPhone.trim()) return;

    // ✅ Форматируем номер телефона
    let phone = newChatPhone.trim();
    // Убедимся, что номер в правильном формате
    if (!phone.startsWith("+")) {
      phone = "+7" + phone.replace(/\D/g, "").slice(-10);
    }
    if (!phone.includes("@")) {
      phone = phone.endsWith("@c.us") ? phone : `${phone}@c.us`;
    }

    setCreatingChat(true);
    try {
      console.log("Creating chat with phone:", phone);
      const res = await fetch("/api/whatsapp/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      console.log("Create chat response:", data);

      if (res.ok && data.chat_id) {
        const newChatId = data.chat_id;

        // Добавляем чат в локальное состояние
        const newChat: Chat = {
          id: newChatId,
          name: phone.replace("@c.us", ""),
          phone: phone.replace("@c.us", ""),
          lastMessage: "Новый чат",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          unread: 0,
          avatarFallback: phone.slice(-2),
          avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
            phone
          )}`,
        };

        setChats((prev) => [...prev, newChat]);
        setNewChatPhone("");

        // ✅ Сразу переходим к новому чату и загружаем сообщения
        console.log("Navigating to new chat:", newChatId);
        router.push(`/${encodeURIComponent(newChatId)}`);

        // ✅ Ждем немного и загружаем сообщения
        setTimeout(() => {
          loadMessages(newChatId);
        }, 500);
      } else {
        alert(
          "Ошибка: " + (data.error || data.details || "Неизвестная ошибка")
        );
      }
    } catch (err) {
      console.error("Create chat error:", err);
      alert("Не удалось создать чат");
    } finally {
      setCreatingChat(false);
    }
  };

  // В функции handleSend замените отправку на:
  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !chatId) return;

    // Оптимистичное обновление
    const tempId = crypto.randomUUID();
    const newMsg: Message = {
      id: tempId,
      chatId,
      author: "me",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent",
    };

    setMessages((prev) => [...prev, newMsg]);
    setDraft("");

    // Прокручиваем сразу после добавления сообщения
    setTimeout(scrollToBottom, 100);

    try {
      console.log("Sending message to chat:", chatId, "text:", text);

      const res = await fetch(
        `/api/whatsapp/chats/${encodeURIComponent(chatId)}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      );

      const result = await res.json();
      console.log("Send message API response:", result);

      if (res.ok) {
        // Сообщение отправлено успешно
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, status: "delivered", id: result.id_message || tempId }
              : m
          )
        );

        // Перезагружаем сообщения через 1 секунду, чтобы API успел обновиться
        setTimeout(() => {
          loadMessages(chatId);
        }, 1000);
      } else {
        // Ошибка отправки
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
        );
        alert(
          "Не удалось отправить сообщение: " +
            (result.error || result.details || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Send error:", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
      alert("Ошибка сети при отправке");
    }
  };

  // Эффекты
  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loadingChats) {
      setIsReady(true);
    }
  }, [loadingChats]);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === chatId),
    [chats, chatId]
  );

  const filteredChats = useMemo(
    () =>
      chats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [chats, query]
  );

  function handleSelectChat(id: string) {
    console.log("Selecting chat:", id);
    router.push("/" + id);
    setSidebarOpen(false);
  }
  // В ChatPage компоненте, добавьте этот useEffect после существующих эффектов:
  useEffect(() => {
    // Автоматически выбираем первый чат при загрузке, если нет выбранного
    if (!loadingChats && chats.length > 0 && !selectedChat) {
      const firstChat = chats[0];
      if (firstChat) {
        console.log("Auto-selecting first chat:", firstChat.id);
        router.push(`/${encodeURIComponent(firstChat.id)}`);
      }
    }
  }, [chats, loadingChats, selectedChat, router]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div>Загрузка чатов...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-600">
          Ошибка загрузки
        </h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadChats}>Попробовать снова</Button>
      </div>
    );
  }

  if (chats.length === 0 && !loadingChats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <h2 className="text-xl font-semibold mb-4">Нет активных чатов</h2>
        <p className="text-muted-foreground mb-4">
          Начните чат, отправив сообщение на WhatsApp-номер.
        </p>
        <div className="flex gap-2 w-full max-w-xs">
          <Input
            placeholder="77751101800"
            value={newChatPhone}
            onChange={(e) => setNewChatPhone(e.target.value)}
            disabled={creatingChat}
          />
          <Button onClick={handleCreateChat} disabled={creatingChat}>
            {creatingChat ? "Создание..." : "Начать"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Composer для случая когда нет chatId но есть чаты */}
      {!chatId && chats.length > 0 && (
        <Composer
          draft={draft}
          setDraft={setDraft}
          onSend={() => {
            // Если пытаются отправить сообщение без выбранного чата
            alert("Сначала выберите чат");
          }}
        />
      )}
      <div className="flex h-[calc(100vh-2rem)] md:h-screen w-full bg-background text-foreground">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex md:w-[360px] lg:w-[400px] flex-col border-r">
          <Sidebar
            query={query}
            setQuery={setQuery}
            chats={filteredChats}
            selectedId={chatId}
            setSelectedId={handleSelectChat}
            onCreateChat={handleCreateChat}
          />
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center gap-2 p-2 border-b">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Меню">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[92vw] sm:w-[420px]">
                <SheetHeader className="p-3">
                  <SheetTitle>Чаты</SheetTitle>
                </SheetHeader>
                <Sidebar
                  query={query}
                  setQuery={setQuery}
                  chats={filteredChats}
                  selectedId={chatId}
                  setSelectedId={handleSelectChat}
                  onCreateChat={handleCreateChat}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {selectedChat?.avatarFallback ?? "Ч"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium leading-none">
                  {selectedChat?.name || "Выберите чат"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedChat ? "в сети" : "нет активного чата"}
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <IconButton label="Звонок">
                <Phone className="h-5 w-5" />
              </IconButton>
              <IconButton label="Видео">
                <Video className="h-5 w-5" />
              </IconButton>
            </div>
          </div>
          {/* Если есть chatId - показываем чат, иначе показываем подсказку */}
          {chatId ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1">
                <div className="px-3 md:px-6 py-4 space-y-2">
                  {loadingMessages ? (
                    <div className="text-center text-muted-foreground">
                      Загрузка сообщений...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      Нет сообщений
                    </div>
                  ) : (
                    messages.map((m) => <MessageBubble key={m.id} msg={m} />)
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
            </>
          ) : (
            /* Если нет chatId, но есть чаты - показываем подсказку */
            chats.length > 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">Выберите чат</div>
                  <p className="text-muted-foreground">
                    Выберите чат из списка слева чтобы начать общение
                  </p>
                </div>
              </div>
            )
          )}

          {/* Composer - показываем если есть выбранный чат ИЛИ есть чаты */}
          {(selectedChat || chats.length > 0) && (
            <Composer draft={draft} setDraft={setDraft} onSend={handleSend} />
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
