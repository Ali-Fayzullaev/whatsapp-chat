// src/app/[chatId]/page.tsx (исправленные части)
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Chat, Message } from "@/components/chat/types";
import { Sidebar } from "@/components/chat/Sidebar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Composer } from "@/components/chat/Composer";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ chatId: string }>();

  // 🔹 Правильно декодируем chatId
  const rawChatId = params?.chatId
    ? Array.isArray(params.chatId)
      ? params.chatId[0]
      : params.chatId
    : null;

  const chatId = rawChatId ? decodeURIComponent(rawChatId) : null;

  const [hiddenPhones, setHiddenPhones] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Правильно определяем временный чат
  const isTempChat = !!chatId?.startsWith("temp:");
  const tempPhone = isTempChat ? chatId.slice(5) : null;

  console.log("Current chatId:", chatId);
  console.log("isTempChat:", isTempChat);
  console.log("tempPhone:", tempPhone);

  // Функции для скролла
  const isNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const normalizePhone = (raw: string) => {
    // Удаляем все нецифровые символы
    let p = raw.trim().replace(/\D/g, "");

    console.log("Phone normalization:", {
      input: raw,
      cleaned: p,
      length: p.length,
    });

    // Простая логика: если 11 цифр - оставляем как есть
    if (p.length === 11) {
      return p;
    }

    // Если 10 цифр - добавляем 7
    if (p.length === 10) {
      return "7" + p;
    }

    // Если меньше 10 цифр - это ошибка
    if (p.length < 10) {
      console.error("Phone number too short:", p);
      return p; // или можно выбросить ошибку
    }

    // Если больше 11 цифр - обрезаем до 11
    if (p.length > 11) {
      console.warn("Phone number too long, trimming:", p);
      return p.slice(0, 11);
    }

    return p;
  };

  // ✅ Улучшенная загрузка чатов
  const loadChats = async (silent = false) => {
    if (!silent) setLoadingChats(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/chats", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || "Failed to load chats");
      }
      const data = await res.json();
      const items: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];

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
          name,
          phone,
          lastMessage: last,
          time: fmtTime(ts),
          unread: raw?.unread_count || 0,
          avatarFallback: name.slice(0, 2).toUpperCase(),
          avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
            name
          )}`,
          updatedAt: ts,
        };
      });

      mapped.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      setChats(mapped);
    } catch (e: any) {
      if (!silent) {
        setError(e?.message ?? "Unknown error");
        setChats([]);
      }
    } finally {
      if (!silent) setLoadingChats(false);
    }
  };

  // ✅ Улучшенная загрузка сообщений
  const loadMessages = async (currentChatId: string, silent = false) => {
    if (!currentChatId) return;

    // Декодируем chatId перед использованием
    const decodedChatId = decodeURIComponent(currentChatId);

    if (decodedChatId.startsWith("temp:")) {
      setMessages([]);
      if (!silent) setLoadingMessages(false);
      return;
    }

    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/whatsapp/chats/${encodeURIComponent(decodedChatId)}/messages`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const arr: any[] = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      const seen = new Set<string>();
      const mapped: Message[] = [];

      arr.forEach((msg: any, idx: number) => {
        const baseId = msg.id_message || msg.message_ref || msg._id || `${idx}`;
        if (seen.has(baseId)) return;
        seen.add(baseId);

        const isOutgoing =
          msg.direction === "out" ||
          msg.sender?.id === "me" ||
          msg.raw?.typeWebhook === "outgoingAPIMessageReceived";

        let text = msg.text ?? "";
        if (!text) {
          text =
            msg.messageData?.textMessageData?.textMessage ??
            msg.messageData?.extendedTextMessageData?.text ??
            (msg.media ? "[Медиа]" : "[Сообщение]");
        }

        const createdAt =
          typeof msg.timestamp === "number"
            ? msg.timestamp * 1000
            : msg.timestamp
            ? Date.parse(msg.timestamp)
            : typeof msg.created_at === "number"
            ? msg.created_at * 1000
            : msg.created_at
            ? Date.parse(msg.created_at)
            : Date.now();

        const status = isOutgoing
          ? msg.status === "read"
            ? "read"
            : msg.status === "delivered"
            ? "delivered"
            : "sent"
          : undefined;

        mapped.push({
          id: baseId,
          chatId: decodedChatId,
          author: isOutgoing ? "me" : "them",
          text,
          time: fmtTime(createdAt),
          createdAt,
          status,
        });
      });

      mapped.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      setMessages(mapped);
    } catch {
      if (!silent) setMessages([]);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // ✅ Исправленный быстрый старт чата
  const handleCreateChat = async (rawPhone: string) => {
    const phone = normalizePhone(rawPhone);
    console.log("Creating temp chat with phone:", phone);

    setHiddenPhones((prev) => (prev.includes(phone) ? prev : [...prev, phone]));

    // 🔹 Создаем правильный temp ID без лишнего кодирования
    const tempChatId = `temp:${phone}`;
    console.log("Temp chat ID:", tempChatId);

    // 🔹 Навигация без encodeURIComponent - Next.js сам обработает
    router.push(`/${tempChatId}`);
    setMessages([]);
  };

  // ✅ Исправленная отправка сообщений
  // В src/app/[chatId]/page.tsx обновите handleSend:

// ✅ Исправленная отправка сообщений
const handleSend = async () => {
  const text = draft.trim();
  if (!text || !chatId) {
    console.log("Cannot send: no text or chatId");
    return;
  }

  console.log("=== SENDING MESSAGE ===");
  console.log("Chat ID:", chatId);
  console.log("isTempChat:", isTempChat);
  console.log("tempPhone:", tempPhone);
  console.log("Message text:", text);

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

    // 🔹 Исправленная логика для временных чатов
    if (isTempChat && tempPhone) {
      console.log("=== CREATING REAL CHAT FROM TEMP ===");
      console.log("Temp phone:", tempPhone);
      console.log("Temp phone length:", tempPhone.length);

      // Проверяем длину номера
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

      // Форматируем телефон для API
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
          // Попробуем получить текст ответа
          const textResponse = await start.text();
          startData = { 
            error: "Invalid JSON response", 
            raw: textResponse,
            status: start.status 
          };
        }

        console.log("Start chat response:", {
          status: start.status,
          ok: start.ok,
          data: startData,
        });

        if (!start.ok) {
          let errorMessage = "Не удалось создать чат";
          
          if (startData?.error) {
            errorMessage += `: ${startData.error}`;
          }
          if (startData?.details) {
            errorMessage += ` (${JSON.stringify(startData.details)})`;
          }
          if (start.status === 500) {
            errorMessage += " - внутренняя ошибка сервера";
          }

          console.error("Failed to create chat:", errorMessage);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempMsgId ? { ...m, status: "failed" } : m
            )
          );
          alert(errorMessage);
          return;
        }

        if (!startData?.chat_id) {
          console.error("No chat_id in response:", startData);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempMsgId ? { ...m, status: "failed" } : m
            )
          );
          alert("Не удалось создать чат: отсутствует ID чата в ответе");
          return;
        }

        realChatId = String(startData.chat_id);
        console.log("Real chat created with ID:", realChatId);

        // Обновляем URL
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

    // 🔹 Отправка сообщения
    console.log("=== SENDING MESSAGE TO REAL CHAT ===");
    console.log("Real chat ID:", realChatId);

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

    console.log("Send message response:", {
      status: sendRes.status,
      ok: sendRes.ok,
      data: sendData,
    });

    if (sendRes.ok) {
      console.log("Message sent successfully");
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
      // Обновляем сообщения через 1 секунду
      setTimeout(() => {
        loadMessages(realChatId, true);
        loadChats(true);
      }, 1000);
    } else {
      console.error("Failed to send message - Full details:", {
        status: sendRes.status,
        statusText: sendRes.statusText,
        data: sendData,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsgId ? { ...m, status: "failed" } : m))
      );

      let errorMessage = "Не удалось отправить сообщение";

      if (sendData?.error) {
        errorMessage += `: ${sendData.error}`;
      }
      if (sendData?.details) {
        errorMessage += ` (${JSON.stringify(sendData.details)})`;
      }
      if (sendRes.status === 404) {
        errorMessage = "Чат не найден";
      }
      if (sendRes.status === 500) {
        errorMessage = "Внутренняя ошибка сервера";
      }

      alert(errorMessage);
    }
  } catch (error) {
    console.error("Send message error:", error);
    setMessages((prev) =>
      prev.map((m) => (m.id === tempMsgId ? { ...m, status: "failed" } : m))
    );
    alert("Ошибка сети при отправке");
  }
};

  // Добавьте в useEffect для проверки
  useEffect(() => {
    console.log("=== ENVIRONMENT CHECK ===");
    console.log("Chat ID:", chatId);
    console.log("Is temp chat:", isTempChat);
    console.log("Temp phone:", tempPhone);
    console.log("Available chats count:", chats.length);
    console.log("First chat example:", chats[0]);
  }, [chatId, isTempChat, tempPhone, chats]);

  

  // Добавьте эту функцию в компонент для тестирования
  const testSendMessage = async (testChatId: string, testText: string) => {
    try {
      console.log("=== TESTING SEND MESSAGE ===");

      const response = await fetch(
        `/api/whatsapp/chats/${encodeURIComponent(testChatId)}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: testText }),
        }
      );

      const data = await response.json();

      console.log("Test send result:", {
        status: response.status,
        ok: response.ok,
        data: data,
      });

      return data;
    } catch (error) {
      console.error("Test send error:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // ✅ Улучшенный polling
  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (chatId) {
      console.log("Loading messages for chat:", chatId);
      loadMessages(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        setIsPolling(true);
        loadChats(true).finally(() => setIsPolling(false));
        if (chatId && !isTempChat) {
          loadMessages(chatId, true);
        }
      }
    }, 300000); // 5 минут

    return () => clearInterval(pollInterval);
  }, [chatId, isTempChat]);

  // Авто-скролл при новых сообщениях
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
        (c) => !(hiddenPhones.includes(c.phone) && (c.unread ?? 0) === 0)
      ),
    [chats, hiddenPhones]
  );

  const filteredChats = useMemo(
    () =>
      visibleChats.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.includes(query)
      ),
    [visibleChats, query]
  );

  const unhideCurrent = () => {
    const phone = isTempChat ? tempPhone : selectedChat?.phone;
    if (!phone) return;
    setHiddenPhones((prev) => prev.filter((p) => p !== phone));
  };

  const isLoadingUI = loadingChats || loadingMessages;

  return (
    <TooltipProvider>
      {/* Индикатор polling (незаметный) */}
      {isPolling && (
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-blue-500/20 z-50" />
      )}

      {isLoadingUI && (
        <div className="fixed inset-x-0 top-0 h-[2px] bg-primary/30 animate-pulse z-50" />
      )}

      <div className="flex h-[calc(100vh-2rem)] md:h-screen w-full bg-background text-foreground">
        {/* Sidebar */}
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
          {/* Баннер про скрытый чат */}
          {(isTempChat ||
            (selectedChat && hiddenPhones.includes(selectedChat.phone))) && (
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
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Выберите чат</div>
                <p className="text-muted-foreground">
                  Слева — список ваших контактов
                </p>
              </div>
            </div>
          )}

          {/* Composer */}
          <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
            <Composer
              draft={draft}
              setDraft={setDraft}
              onSend={handleSend}
              disabled={!chatId}
              placeholder={
                chatId
                  ? "Введите сообщение..."
                  : "Сначала выберите чат или создайте новый"
              }
            />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
