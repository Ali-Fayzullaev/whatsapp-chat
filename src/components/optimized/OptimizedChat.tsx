// src/components/optimized/OptimizedChat.tsx
"use client";
import { useState, useRef, useEffect, useCallback, memo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Composer } from "@/components/chat/Composer";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { useMessages } from "@/hooks/useMessages";
import { useChats } from "@/hooks/useChats";
import type { Message, ReplyMessage } from "@/components/chat/types";
import { ArrowLeft, MessageCircleMore, MoreVertical } from "lucide-react";

// Мемоизированный компонент сообщения
const MemoizedMessageBubble = memo(MessageBubble);

interface OptimizedChatProps {
  chatId: string | null;
  onBackToSidebar?: () => void;
}

export function OptimizedChat({ chatId, onBackToSidebar }: OptimizedChatProps) {
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { chats } = useChats();
  const { messages, loading, sendMessage, sendMediaMessage, deleteMessage } = useMessages(chatId);

  // Обработчик возврата к списку чатов для мобильных устройств
  const handleBackToSidebar = useCallback(() => {
    if (onBackToSidebar) {
      onBackToSidebar();
    } else {
      router.push("/chat");
    }
  }, [onBackToSidebar, router]);

  // Находим текущий чат
  const selectedChat = chats.find(chat => chat.id === chatId);
  const isTempChat = chatId?.startsWith("temp:") ?? false;

  // Автоскролл к новым сообщениям
  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end" 
      });
    }
  }, []);

  // Проверка, находится ли пользователь внизу чата
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  // Скролл при новых сообщениях
  useEffect(() => {
    if (isNearBottom()) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom, isNearBottom]);

  // Обработчик отправки сообщений
  const handleSend = useCallback(async (text: string, replyTo?: ReplyMessage) => {
    if (!text.trim() || !chatId) return;

    const stick = isNearBottom();
    
    // Обернем sendMessage в transition
    startTransition(() => {
      sendMessage(text.trim(), replyTo).then(() => {
        setDraft("");
        setReplyingTo(null);

        if (stick) {
          setTimeout(scrollToBottom, 50);
        }
      });
    });
  }, [chatId, sendMessage, isNearBottom, scrollToBottom, startTransition]);

  // Обработчик ответа на сообщение
  const handleReplyToMessage = useCallback((message: Message) => {
    setReplyingTo({
      id: message.id,
      author: message.author,
      text: message.text,
      media: message.media ? {
        type: message.media.type,
        name: message.media.name,
      } : undefined,
    });
  }, []);

  // Обработчик отмены ответа
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Обработчик удаления сообщения
  const handleDeleteMessage = useCallback(async (messageId: string, remote = false) => {
    if (!chatId) return;
    await deleteMessage(messageId, remote);
  }, [chatId, deleteMessage]);

  // Обработчик отправки файлов
  const handleFileSelect = useCallback(async (file: File) => {
    if (!chatId) return;
    
    try {
      console.log('Uploading file:', file.name, 'to chat:', chatId);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', chatId);
      
      // Используем fetch для отправки файла с авторизацией
      const response = await fetch('/api/whatsapp/files/upload-image', {
        method: 'POST',
        headers: {
          // НЕ устанавливаем Content-Type - браузер сам добавит boundary для FormData
        },
        body: formData,
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        
        // Показать пользователю более понятную ошибку
        alert(`Ошибка загрузки файла: ${response.status === 404 ? 'API не найден' : errorText}`);
        return;
      }
      
      const result = await response.json();
      console.log('File uploaded successfully:', result);
      
      // Создаем полный URL медиа
      const mediaUrl = result.path ? `https://socket.eldor.kz${result.path}` : result.mediaUrl || result.url;
      console.log('Media URL:', mediaUrl);
      
      // Отправить медиа-сообщение в transition
      startTransition(() => {
        sendMediaMessage(file, mediaUrl, replyingTo);
        setReplyingTo(null);
      });
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Ошибка при загрузке: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }, [chatId, sendMessage]);

  // Состояние загрузки
  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Skeleton header */}
        <div className="h-16 bg-gray-100 dark:bg-gray-800 border-b animate-pulse"></div>
        
        {/* Skeleton messages */}
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}
            >
              <div className="h-12 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Skeleton composer */}
        <div className="h-16 bg-gray-100 dark:bg-gray-800 border-t animate-pulse"></div>
      </div>
    );
  }

  // Пустое состояние
  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-2xl font-semibold mb-2 text-green-500">
            <MessageCircleMore className="inline h-6 w-6 mb-1" /> WhatsApp Web
          </div>
          <p className="text-muted-foreground mb-4">
            Выберите чат для начала общения
          </p>
          <Button
            onClick={handleBackToSidebar}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Открыть список чатов
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <ChatHeader
        chat={selectedChat}
        chatId={chatId}
        onBack={handleBackToSidebar}
        showBackButton={true}
      />

      {/* HTTP режим индикатор */}
      <div className="h-1 bg-blue-500" title="HTTP режим активен" />

      {/* Временный чат баннер */}
      {isTempChat && (
        <div className="px-3 md:px-6 py-2 text-xs bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-b border-yellow-200 dark:border-yellow-800">
          <span>
            Новый чат с <b>{chatId?.replace("temp:", "")}</b> — отправьте первое сообщение для создания
          </span>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea
        className="flex-1"
        ref={(el) => {
          const viewport = el?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null;
          scrollContainerRef.current = viewport;
        }}
        style={{
          backgroundImage: `url('/telegramm-bg-tile.png')`,
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundColor: "#ECE5DD",
        }}
      >
        <div className="px-3 md:px-6 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {isTempChat
                ? "Напишите первое сообщение — чат ещё не создан на сервере"
                : "Нет сообщений"
              }
            </div>
          ) : (
            messages.map((message) => (
              <MemoizedMessageBubble
                key={message.id}
                msg={message}
                onReply={handleReplyToMessage}
                isReplying={replyingTo?.id === message.id}
                onDelete={handleDeleteMessage}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="sticky bottom-0 z-10 bg-transparent">
        <Composer
          draft={draft}
          setDraft={setDraft}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          disabled={!chatId || isPending}
          placeholder={isPending ? "Отправка..." : "Введите сообщение..."}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      </div>
    </div>
  );
}