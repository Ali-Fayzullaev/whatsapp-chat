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

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ chatId: string }>();
  const chatId = Array.isArray(params.chatId)
    ? params.chatId[0]
    : params.chatId;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chats] = useState<Chat[]>(CHATS);
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [draft, setDraft] = useState("");

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === chatId),
    [chats, chatId]
  );
  const filtered = useMemo(
    () =>
      chats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [chats, query]
  );
  // авто‑скролл вниз по последнему элементу
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  useEffect(() => {
    scrollToBottom();
  }, [chatId]);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // если id не найден — отправим на первый доступный чат
  useEffect(() => {
    if (!selectedChat && chats[0]) router.replace("/" + chats[0].id);
  }, [selectedChat, chats, router]);

  function handleSelectChat(id: string) {
    router.push("/" + id);
    setSidebarOpen(false);
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !chatId) return;
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
    setMessages((p) => [...p, newMsg]);
    setDraft("");
    // доставлено через 600мс
    setTimeout(() => {
      setMessages((p) =>
        p.map((m) => (m.id === newMsg.id ? { ...m, status: "delivered" } : m))
      );
    }, 600);
    // гарантировано в самый низ после рендера
    setTimeout(scrollToBottom, 0);
  }

  if (!selectedChat) return null;

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
          />
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col chat-bg">
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
                  setSelectedId={(id) => {
                    handleSelectChat(id);
                  }}
                  compact
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
