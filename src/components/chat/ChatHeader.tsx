// src/components/chat/ChatHeader.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import type { Chat } from "./types";

interface ChatHeaderProps {
  chat?: Chat;
  chatId: string;
  last_message?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export  function ChatHeader({
  chat,
  chatId,
  onBack,
  showBackButton = false,
}: ChatHeaderProps) {
  
  
  const getDisplayName = () => {
    if (chat?.lastMessage.sender.name) {
      return typeof chat.lastMessage.sender.name === "string" ? chat.lastMessage.sender.name : chat.lastMessage.sender.name;
    }

    // Если это временный чат
    if (chatId.startsWith("temp:")) {
      return chatId.replace("temp:", "");
    }

    // Если это номер телефона (содержит @ символ)
    if (chatId.includes("@")) {
      const phoneNumber = chatId.replace("@c.us", "").replace("@g.us", "");
      return phoneNumber;
    }

    return chatId;
  };

  // Функция для получения статуса (онлайн/оффлайн)
  const getStatus = () => {
    if (chatId.startsWith("temp:")) {
      return "Временный чат";
    }

    if (chat?.lastSeen) {
      return `Последний раз в сети: ${new Date(chat.lastSeen).toLocaleString(
        "ru-RU"
      )}`;
    }

    return "WhatsApp";
  };

  // Функция для получения аватара
  const getAvatarFallback = () => {
    const name = getDisplayName();
    if (name.length > 0) {
      return name.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      {/* Кнопка назад (для мобильных) */}
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Аватар */}
      <Avatar className="h-10 w-10">
        {chat?.avatarUrl ? (
          <AvatarImage src={chat.avatarUrl} alt={getDisplayName()} />
        ) : (
          <AvatarFallback className="bg-green-500 text-white">
            {getAvatarFallback()}
          </AvatarFallback>
        )}
      </Avatar>

      {/* Информация о чате */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white truncate">
          {getDisplayName()}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {getStatus()}
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center gap-1">
        {/* Кнопка видеозвонка */}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Video className="h-5 w-5" />
        </Button>

        {/* Кнопка голосового звонка */}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Phone className="h-5 w-5" />
        </Button>

        {/* Меню дополнительных действий */}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
