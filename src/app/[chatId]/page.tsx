// src/app/[chatId]/page.tsx
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
  const chatId = params?.chatId
    ? Array.isArray(params.chatId)
      ? params.chatId[0]
      : params.chatId
    : null;

  // 🔹 набор телефонов, которые нужно скрыть в левом списке
  const [hiddenPhones, setHiddenPhones] = useState<string[]>([]);

  const [query, setQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const isTempChat = !!chatId?.startsWith("temp:");
  const tempPhone = isTempChat ? decodeURIComponent(chatId!).slice(5) : null;

  const isNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };
  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  const normalizePhone = (raw: string) => {
    let p = raw.trim().replace(/\D/g, "");
    if (!p.startsWith("7")) p = "7" + p.slice(-10);
    return "+" + p; // +7XXXXXXXXXX
  };

  // ✅ Загрузка чатов
  const loadChats = async () => {
    setLoadingChats(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/chats", { cache: "no-store" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || "Failed to load chats");
      }
      const data = await res.json();
      const items: any[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const mapped: Chat[] = items.map((raw: any, i: number) => {
        const rawId = raw?.chat_id || raw?.id;
        const id = rawId ? String(rawId) : `temp-${i}`;
        let phone = raw?.phone || raw?.id || raw?.chat_id || "";
        phone = String(phone).replace("@c.us", "");
        const name = phone || `Чат ${id}`;
        const ts =
          typeof raw?.updated_at === "number" ? raw.updated_at * 1000 :
          raw?.updated_at ? Date.parse(raw.updated_at) :
          typeof raw?.timestamp === "number" ? raw.timestamp * 1000 :
          raw?.timestamp ? Date.parse(raw.timestamp) :
          Date.now();
        const last = raw?.last_message || raw?.text || "";
        return {
          id,
          name,
          phone,
          lastMessage: last,
          time: fmtTime(ts),
          unread: raw?.unread_count || 0,
          avatarFallback: name.slice(0, 2).toUpperCase(),
          avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
          updatedAt: ts,
        };
      });
      mapped.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      setChats(mapped);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  // ✅ Загрузка сообщений
  const loadMessages = async (currentChatId: string) => {
    if (!currentChatId) return;

    // для temp-чата сообщений на сервере ещё нет — просто очищаем
    if (currentChatId.startsWith("temp:")) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/whatsapp/chats/${encodeURIComponent(currentChatId)}/messages`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const arr: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

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
          typeof msg.timestamp === "number" ? msg.timestamp * 1000 :
          msg.timestamp ? Date.parse(msg.timestamp) :
          typeof msg.created_at === "number" ? msg.created_at * 1000 :
          msg.created_at ? Date.parse(msg.created_at) :
          Date.now();

        const status = isOutgoing
          ? msg.status === "read"
            ? "read"
            : msg.status === "delivered"
            ? "delivered"
            : "sent"
          : undefined;

        mapped.push({
          id: baseId,
          chatId: currentChatId,
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
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // авто-выбор первого чата (но не мешаем temp-чату)
  useEffect(() => {
    if (!loadingChats && chats.length > 0 && !chatId) {
      router.push(`/${encodeURIComponent(chats[0].id)}`);
    }
  }, [chats, loadingChats, chatId, router]);

  // 🔹 Быстрый скрытый старт: открываем temp-чат без добавления в список
  const handleCreateChat = async (rawPhone: string) => {
    const phone = normalizePhone(rawPhone);
    setHiddenPhones((prev) => (prev.includes(phone) ? prev : [...prev, phone]));
    router.push(`/${encodeURIComponent(`temp:${phone}`)}`);
    setMessages([]); // чистим ленту
  };

  // ✅ Отправка (умеет из temp-чата)
  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !chatId) return;

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
    setMessages((prev) => [...prev, optimistic].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)));
    setDraft("");
    if (stick) setTimeout(scrollToBottom, 40);

    try {
      let realChatId = chatId;

      // если это temp-чат — сначала создаём реальный
      if (isTempChat) {
        const apiPhone = tempPhone!.endsWith("@c.us") ? tempPhone! : `${tempPhone}@c.us`;
        const start = await fetch("/api/whatsapp/chats/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: apiPhone }),
        });
        const startData = await start.json();
        if (!start.ok || !startData?.chat_id) {
          // помечаем fail
          setMessages((prev) => prev.map((m) => (m.id === tempMsgId ? { ...m, status: "failed" } : m)));
          alert("Не удалось создать чат: " + (startData?.error || startData?.details || "Unknown"));
          return;
        }
        realChatId = String(startData.chat_id);

        // остаёмся скрытыми: телефон уже в hiddenPhones
        router.replace(`/${encodeURIComponent(realChatId)}`);
      }

      // отправка текста в реальный чат
      const sendRes = await fetch(`/api/whatsapp/chats/${encodeURIComponent(realChatId)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const sendData = await sendRes.json();
      if (sendRes.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempMsgId ? { ...m, id: sendData?.id_message || tempMsgId, status: "delivered" } : m
          )
        );
        setTimeout(() => loadMessages(realChatId), 500);
      } else {
        setMessages((prev) => prev.map((m) => (m.id === tempMsgId ? { ...m, status: "failed" } : m)));
        alert("Не удалось отправить: " + (sendData?.error || sendData?.details || "Unknown"));
      }
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === tempMsgId ? { ...m, status: "failed" } : m)));
      alert("Ошибка сети при отправке");
    }
  };

  // Polling (не дёргаем сообщения для temp-чата)
  useEffect(() => {
    loadChats();
  }, []);
  useEffect(() => {
    if (chatId) loadMessages(chatId);
  }, [chatId]);
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadChats();
        if (chatId && !isTempChat) loadMessages(chatId);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [chatId, isTempChat]);

  useEffect(() => {
    if (isNearBottom()) scrollToBottom();
  }, [messages]);

  const selectedChat = useMemo(() => chats.find((c) => c.id === chatId), [chats, chatId]);

  // 🔹 Чаты для отображения: скрываем те, чей phone в hiddenPhones.
  // Если по ним пришло входящее (unread>0) — всё же показываем.
  const visibleChats = useMemo(
    () => chats.filter((c) => !(hiddenPhones.includes(c.phone) && (c.unread ?? 0) === 0)),
    [chats, hiddenPhones]
  );

  const filteredChats = useMemo(
    () =>
      visibleChats.filter(
        (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query)
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
                <div key={i} className="h-14 bg-muted/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <Sidebar
              query={query}
              setQuery={setQuery}
              chats={filteredChats}
              selectedId={chatId ?? undefined}
              setSelectedId={(id) => {
                router.push("/" + encodeURIComponent(id));
              }}
              onCreateChat={handleCreateChat} // ← теперь скрытый быстрый старт
            />
          )}
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col">
          {/* Баннер про скрытый чат */}
          {(isTempChat || (selectedChat && hiddenPhones.includes(selectedChat.phone))) && (
            <div className="px-3 md:px-6 py-2 text-[12px] bg-muted text-muted-foreground border-b flex items-center gap-2">
              <span>
                Скрытый чат с{" "}
                <b>{isTempChat ? tempPhone : selectedChat?.phone}</b> — не показывается в списке слева.
              </span>
              <Button variant="link" className="h-auto p-0 text-xs" onClick={unhideCurrent}>
                Показать в списке
              </Button>
            </div>
          )}

          {/* Messages */}
          {chatId ? (
            <ScrollArea
              className="flex-1"
              ref={(el) => {
                const vp = el?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null;
                scrollContainerRef.current = vp ?? null;
              }}
            >
              <div className="px-3 md:px-6 py-4 space-y-2">
                {loadingMessages ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
                        <div className="h-12 w-56 bg-muted rounded-2xl animate-pulse" />
                      </div>
                    ))}
                  </>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    {isTempChat ? "Напишите первое сообщение — чат ещё не создан на сервере" : "Нет сообщений"}
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
                <p className="text-muted-foreground">Слева — список ваших контактов</p>
              </div>
            </div>
          )}

          {/* Composer всегда виден */}
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
