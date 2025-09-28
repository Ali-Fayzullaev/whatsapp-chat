//src/app/components/chat/Sidebar.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Chat } from "./types";
import { HeaderMenu } from "./menus";
import { useState } from "react";

export function Sidebar({
  query,
  setQuery,
  chats,
  selectedId,
  setSelectedId,
  compact,
  onCreateChat,
}: {
  query: string;
  setQuery: (v: string) => void;
  chats: Chat[];
  selectedId?: string;
  setSelectedId: (id: string) => void;
  compact?: boolean;
  onCreateChat: (phone: string) => Promise<void>;
}) {
  const [newChatPhone, setNewChatPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newChatPhone.trim()) return;
    setIsCreating(true);
    await onCreateChat(newChatPhone);
    setNewChatPhone("");
    setIsCreating(false);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback>Я</AvatarFallback>
          </Avatar>
          {!compact && <div className="text-sm font-medium">Мой профиль</div>}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Новый чат">
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Новый чат</TooltipContent>
          </Tooltip>
          <HeaderMenu />
        </div>
      </div>
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск или новый чат"
            className="pl-9 rounded-2xl"
          />
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 chat-background">
        <div className="p-2">
          {chats.map((c) => {
            if (!c.id) {
              console.warn("Chat без id:", c);
              return null;
            }
            return (
              <button
                key={c.id}
                onClick={() => {
                  console.log("Sidebar: selecting chat:", c.id);
                  setSelectedId(c.id);
                }}
                className={[
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                  c.id === selectedId ? "bg-accent" : "hover:bg-accent/60",
                ].join(" ")}
              >
                <Avatar className="h-11 w-11">
                  {c.avatarUrl ? (
                    <AvatarImage src={c.avatarUrl} alt={c.name} />
                  ) : (
                    <AvatarFallback>
                      {c.avatarFallback ??
                        (typeof c.name === "string" ? c.name.at(0) : "?")}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {c.time}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {c.lastMessage}
                  </div>
                </div>
                {c.unread ? (
                  <Badge
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    variant="default"
                  >
                    {c.unread}
                  </Badge>
                ) : null}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Диалог для создания нового чата */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="p-3">
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Новый чат
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый чат</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input
              placeholder="77751101800"
              value={newChatPhone}
              onChange={(e) => setNewChatPhone(e.target.value)}
              autoFocus
            />
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newChatPhone.trim()}
            >
              {isCreating ? "Создание..." : "Начать чат"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
