"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Phone, Video, Send, Paperclip, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Chat, Message } from "@/components/chat/types";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Composer } from "@/components/chat/Composer";
import { IconButton } from "@/components/chat/_parts";

const DEMO_CHATS: Chat[] = [
  {
    id: "1",
    name: "Марина",
    lastMessage: "Ок, жду! 🚀",
    time: "10:55",
    unread: 2,
    avatarFallback: "М",
  },
  {
    id: "2",
    name: "Рабочий чат",
    lastMessage: "Файл залил в диск",
    time: "09:12",
    avatarFallback: "R",
  },
  {
    id: "3",
    name: "Доставка",
    lastMessage: "Курьер у подъезда",
    time: "Вчера",
    avatarFallback: "Д",
  },
];

const DEMO_MESSAGES: Message[] = [
  {
    id: "m1",
    chatId: "1",
    author: "them",
    text: "Привет! Ты здесь?",
    time: "10:40",
  },
  {
    id: "m2",
    chatId: "1",
    author: "me",
    text: "Тут. Проверяю макет.",
    time: "10:41",
    status: "delivered",
  },
  { id: "m3", chatId: "1", author: "them", text: "Ок, жду! 🚀", time: "10:55" },
];

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>(DEMO_CHATS);
  const [selectedId, setSelectedId] = useState<string>(DEMO_CHATS[0]?.id ?? "");
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [draft, setDraft] = useState("");

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedId),
    [chats, selectedId]
  );
  const filtered = useMemo(
    () =>
      chats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [chats, query]
  );

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, selectedId]);

  function handleSend() {
    const text = draft.trim();
    if (!text || !selectedId) return;
    const newMsg: Message = {
      id: crypto.randomUUID(),
      chatId: selectedId,
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
    setTimeout(() => {
      setMessages((p) =>
        p.map((m) => (m.id === newMsg.id ? { ...m, status: "delivered" } : m))
      );
    }, 600);
  }
  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-2rem)] md:h-screen w-full bg-background text-foreground">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex md:w-[360px] lg:w-[400px] flex-col border-r">
          <Sidebar
            query={query}
            setQuery={setQuery}
            chats={filtered}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col bg-muted/20">
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
                  selectedId={selectedId}
                  setSelectedId={(id) => {
                    setSelectedId(id);
                    setSidebarOpen(false);
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
          <ScrollArea ref={listRef as any} className="flex-1">
            <div className="px-3 md:px-6 py-4 space-y-2">
              {messages
                .filter((m) => m.chatId === selectedId)
                .map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
            </div>
          </ScrollArea>

          {/* Composer */}
          <Composer draft={draft} setDraft={setDraft} onSend={handleSend} />
        </main>
      </div>
    </TooltipProvider>
  );
}
