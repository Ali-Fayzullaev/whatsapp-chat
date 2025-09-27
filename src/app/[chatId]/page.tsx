//src/app/[chatId]/page.tsx
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
import { CHATS, MESSAGES } from "@/components/chat/fixtures";
import { Input } from "@/components/ui/input";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ chatId: string }>();
  const chatId = params?.chatId
    ? Array.isArray(params.chatId)
      ? params.chatId[0]
      : params.chatId
    : null;

  // ✅ Все хуки — строго в начале, без условий
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

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (!loadingChats) {
      setIsReady(true);
    }
  }, [loadingChats]);

  useEffect(() => {
    scrollToBottom();
  }, [chatId, messages]);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === chatId),
    [chats, chatId]
  );

  useEffect(() => {
    if (!loadingChats && !selectedChat && chats[0]) {
      router.replace("/" + chats[0].id);
    }
  }, [selectedChat, chats, loadingChats, router]);

  useEffect(() => {
    if (!chatId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(
          `/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        // ✅ API возвращает { items: [...] }, а не массив напрямую
        const messagesArray = Array.isArray(data?.items) ? data.items : [];

        const mappedMessages: Message[] = messagesArray.map((msg: any) => ({
          id: msg.message_ref,
          chatId: chatId,
          author: msg.sender === "user" ? "me" : "them",
          text: msg.text || "[Медиа]",
          time: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: msg.sender === "user" ? "delivered" : undefined,
        }));

        setMessages(mappedMessages);
      } catch (err) {
        console.error("Failed to load messages", err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [chatId]);

  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const res = await fetch("/api/whatsapp/chats");
      if (!res.ok) throw new Error("Failed to load chats");
      const data = await res.json();

      // ✅ НОВЫЙ, БЕЗОПАСНЫЙ КОД
      const mappedChats: Chat[] = data.map((chat: any, index: number) => {
        const rawId = chat?.id;
        const id = rawId ? String(rawId) : `temp-${index}`;
        const phone = chat?.phone || '';
        const name = phone || `Чат ${id}`;
      
        return {
          id,
          name,
          lastMessage: "",
          time: new Date(chat?.created_at || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          unread: 0,
          avatarFallback: name.slice(0, 2).toUpperCase(),
          avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
        };
      });

      setChats(mappedChats);
    } catch (err) {
      console.error("Failed to load chats", err);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleCreateChat = async () => {
    if (!newChatPhone.trim()) return;
    setCreatingChat(true);
    try {
      const res = await fetch("/api/whatsapp/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newChatPhone }),
      });
      const data = await res.json();

      if (res.ok && data.chat_id) {
        const newChatId = data.chat_id;

        // 1. Добавим чат в локальное состояние
        const newChat: Chat = {
          id: newChatId,
          name: newChatPhone,
          lastMessage: "Новый чат",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          unread: 0,
          avatarFallback: newChatPhone.slice(-2),
          avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
            newChatPhone
          )}`,
        };

        setChats((prev) => [...prev, newChat]);

        // 2. Перейдём к чату
        router.push(`/${newChatId}`);
        setNewChatPhone(""); // очистим поле
      } else {
        alert("Ошибка: " + (data.error || "Неизвестная ошибка"));
      }
    } catch (err) {
      console.error("Create chat error:", err);
      alert("Не удалось создать чат");
    } finally {
      setCreatingChat(false);
    }
  };

  const filtered = useMemo(
    () =>
      chats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [chats, query]
  );

  // если id не найден — отправим на первый доступный чат

  function handleSelectChat(id: string) {
    router.push("/" + id);
    setSidebarOpen(false);
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || !chatId) return;

    // 1. Добавим сообщение локально (оптимистичный UI)
    const newMsg: Message = {
      id: crypto.randomUUID(),
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

    // 2. Отправим в API
    try {
      const res = await fetch(`/api/whatsapp/chats/${chatId}/sendText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        // 3. Обновим статус на "delivered"
        setMessages((prev) =>
          prev.map((m) =>
            m.id === newMsg.id ? { ...m, status: "delivered" } : m
          )
        );

        // 4. Опционально: перезагрузим все сообщения (чтобы получить точный message_ref)
        // const updatedRes = await fetch(`/api/whatsapp/chats/${chatId}/messages`);
        // const updatedData = await updatedRes.json();
        // ...map again
      } else {
        // Если ошибка — покажем статус "failed"
        setMessages((prev) =>
          prev.map((m) => (m.id === newMsg.id ? { ...m, status: "failed" } : m))
        );
        alert("Не удалось отправить сообщение");
      }
    } catch (err) {
      console.error("Send error:", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsg.id ? { ...m, status: "failed" } : m))
      );
      alert("Ошибка при отправке");
    }

    // Прокрутим вниз
    setTimeout(scrollToBottom, 0);
  }

  // Удали второй useEffect (дублирующий loadChats)

  useEffect(() => {
    loadChats();
  }, []);

  // Вместо if (!selectedChat) return null;
  if (!isReady) {
    return <div className="p-6">Загрузка...</div>;
  }

  if (!selectedChat && chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <h2 className="text-xl font-semibold mb-4">Нет активных чатов</h2>
        <p className="text-muted-foreground mb-4">
          Начните чат, отправив сообщение на WhatsApp-номер.
        </p>
        <div className="flex gap-2 w-full max-w-xs">
          <Input
            placeholder="+77012345678"
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

  // Внутри ChatPage()

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-2rem)] md:h-screen w-full bg-background text-foreground">
        {/* Sidebar (desktop) */}
        <aside
          className="hidden md:flex md:w-[360px] lg:w-[400px] flex-col border-r"
          style={{
            background: "var(--sidebar)",
            color: "var(--sidebar-foreground)",
          }}
        >
          <Sidebar
            query={query}
            setQuery={setQuery}
            chats={filtered}
            selectedId={chatId}
            setSelectedId={handleSelectChat}
            onCreateChat={handleCreateChat} // ← передаём функцию
          />
        </aside>

        {/* Chat area */}
        <main className="flex-1  flex flex-col chat-bg">
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
                  chats={filtered}
                  selectedId={chatId}
                  setSelectedId={handleSelectChat}
                  onCreateChat={handleCreateChat} // ← передаём функцию
                />
              </SheetContent>
            </Sheet>
            {chats.length === 0 && (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-xl font-semibold mb-4">
                  Нет активных чатов
                </h2>
                <p className="text-muted-foreground mb-4">
                  Начните чат, отправив сообщение на WhatsApp-номер.
                </p>
                <div className="flex gap-2 w-full max-w-xs">
                  <Input
                    placeholder="+77012345678"
                    value={newChatPhone}
                    onChange={(e) => setNewChatPhone(e.target.value)}
                    disabled={creatingChat}
                  />
                  <Button onClick={handleCreateChat} disabled={creatingChat}>
                    {creatingChat ? "Создание..." : "Начать"}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {selectedChat?.avatarFallback ?? "Ч"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium leading-none">
                  {selectedChat?.name}
                </div>
                <div className="text-xs text-muted-foreground">в сети</div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <IconButton label="Звонок">
                <Phone className="h-5 w-5" />
              </IconButton>
              <IconButton label="Видео">
                <Video className="h-5 w-5" />
              </IconButton>
              <ChatHeader.Menu />
            </div>
          </div>

          {/* Desktop header */}
          <ChatHeader chat={selectedChat} />

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="px-3 md:px-6 py-4 space-y-2">
              {messages
                .filter((m) => m.chatId === chatId)
                .map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Composer */}
          <Composer draft={draft} setDraft={setDraft} onSend={handleSend} />
        </main>
      </div>
    </TooltipProvider>
  );
}
