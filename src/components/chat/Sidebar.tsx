"use client";
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

export function Sidebar({
  query,
  setQuery,
  chats,
  selectedId,
  setSelectedId,
  compact,
}: {
  query: string;
  setQuery: (v: string) => void;
  chats: Chat[];
  selectedId?: string;
  setSelectedId: (id: string) => void;
  compact?: boolean;
}) {
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
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
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
                    {c.avatarFallback ?? c.name.at(0)}
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
