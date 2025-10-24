// src/components/chat/ChatHeader.tsx
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Video, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteChat } from "@/hooks/useDeleteChat";
import { useRouter } from "next/navigation";
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteChat, loading: deleteLoading } = useDeleteChat();
  const router = useRouter();

  const handleDeleteChat = async () => {
    const success = await deleteChat(chatId);
    if (success) {
      setShowDeleteDialog(false);
      // Возвращаемся к списку чатов
      if (onBack) {
        onBack();
      } else {
        router.push("/");
      }
    }
  };
  
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
    <>
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
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-2">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить чат
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    {/* Диалог подтверждения удаления чата */}
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить чат?</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите удалить чат с {getDisplayName()}? 
            Это действие нельзя отменить, и все сообщения будут потеряны.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setShowDeleteDialog(false)}
            disabled={deleteLoading}
          >
            Отмена
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteChat}
            disabled={deleteLoading}
          >
            {deleteLoading ? "Удаление..." : "Удалить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
