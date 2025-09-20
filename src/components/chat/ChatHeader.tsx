"use client";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Phone, Video, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { Chat } from "./types";

export function ChatHeader({ chat }: { chat?: Chat }) {
  return (
    <div className="hidden md:flex items-center gap-3 px-4 py-2 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{chat?.avatarFallback ?? "Ч"}</AvatarFallback>
        </Avatar>
        <div className="leading-tight">
          <div className="text-sm font-medium">{chat?.name}</div>
          <div className="text-xs text-muted-foreground">в сети</div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Звонок">
              <Phone className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Звонок</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Видео">
              <Video className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Видео</TooltipContent>
        </Tooltip>
        <Menu />
      </div>
    </div>
  );
}

ChatHeader.Menu = Menu;

function Menu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Меню">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>Новая группа</DropdownMenuItem>
        <DropdownMenuItem>Настройки</DropdownMenuItem>
        <DropdownMenuItem className="flex items-center justify-between">
          Тема <ThemeToggle />
        </DropdownMenuItem>
        <DropdownMenuItem>Выйти</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
