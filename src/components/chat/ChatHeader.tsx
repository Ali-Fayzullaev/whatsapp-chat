// src/components/chat/ChatHeader.tsx
"use client";
import { Phone, Video, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Chat } from "./types";

interface ChatHeaderProps {
  chat: Chat;
}

export function ChatHeader({ chat }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={chat.avatarUrl} alt={chat.name} />
          <AvatarFallback>{chat.avatarFallback}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-lg">{chat.name}</div>
          <div className="text-sm text-green-600">в сети</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Голосовой вызов">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Видео вызов">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Меню">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}