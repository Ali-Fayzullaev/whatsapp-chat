// src/components/chat/ChatHeader.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
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
import { DEFAULT_GROUP_AVATAR, DEFAULT_USER_AVATAR } from "@/lib/avatar-assets";
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
    // Безопасная проверка имени отправителя
    if (chat?.lastMessage?.sender?.name) {
      return chat.lastMessage.sender.name;
    }

    // Если есть название чата
    if (chat?.name) {
      return chat.name;
    }

    // Если есть номер телефона чата
    if (chat?.phone) {
      return chat.phone;
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

  const normalizedId = chat?.chat_id || chat?.id || chatId;
  const isGroupChat = Boolean(chat?.is_group) || Boolean(
    normalizedId && (normalizedId.endsWith("@g.us") || normalizedId.includes("@broadcast"))
  );
  const avatarSrc = chat?.avatarUrl && chat.avatarUrl.trim().length > 0
    ? chat.avatarUrl
    : isGroupChat
      ? DEFAULT_GROUP_AVATAR
      : DEFAULT_USER_AVATAR;

  return (
    <>
      <div className="flex items-center gap-3 p-4 h-[70px] bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Кнопка назад (для мобильных) */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="md:hidden p-2 h-10 w-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Аватар с индикатором онлайн */}
        <div className="relative">
          <img
            src={avatarSrc}
            alt={getDisplayName()}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = isGroupChat ? DEFAULT_GROUP_AVATAR : DEFAULT_USER_AVATAR;
            }}
          />
        </div>

        {/* Информация о чате */}
        <div className="flex-1 min-w-0 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-md p-2 -m-2 transition-colors">
          <div className="font-medium text-[16px] text-gray-900 dark:text-white truncate">
            {getDisplayName()}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center gap-1">
          {/* Меню дополнительных действий */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-muted">
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
