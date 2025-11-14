"use client";
import { useState, useRef, useEffect, useCallback, memo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Composer } from "@/components/chat/Composer";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMessages } from "@/hooks/useMessages";
import { useChatContext } from "@/providers/ChatProvider";
import { useToast } from "@/components/ui/toast";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import type { Message, ReplyMessage } from "@/components/chat/types";
import { ArrowLeft, MessageCircleMore } from "lucide-react";
const MemoizedMessageBubble = memo(MessageBubble, (prevProps, nextProps) => {
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.text === nextProps.msg.text &&
    prevProps.msg.status === nextProps.msg.status &&
    prevProps.msg.pending === nextProps.msg.pending &&
    prevProps.isReplying === nextProps.isReplying &&
    prevProps.isGroup === nextProps.isGroup &&
    prevProps.onUserClick === nextProps.onUserClick &&
    prevProps.onReplyPreviewClick === nextProps.onReplyPreviewClick &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    JSON.stringify(prevProps.msg.media) === JSON.stringify(nextProps.msg.media) &&
    JSON.stringify(prevProps.msg.replyTo) === JSON.stringify(nextProps.msg.replyTo) &&
    JSON.stringify(prevProps.msg.sender) === JSON.stringify(nextProps.msg.sender)
  );
});
interface OptimizedChatProps {
  chatId: string | null;
  onBackToSidebar?: () => void;
}
export function OptimizedChat({ chatId, onBackToSidebar }: OptimizedChatProps) {
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyMessage | null>(() => {
    // Пытаемся восстановить состояние ответа из localStorage
    if (typeof window !== 'undefined' && chatId) {
      try {
        const saved = localStorage.getItem(`replyingTo-${chatId}`);
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { chats } = useChatContext();
  const { messages, loading, sendMessage, sendMediaMessage, deleteMessage } = useMessages(chatId || "");
  const { typingUsers } = useTypingIndicator(chatId || "");
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  // Сохранение состояния ответа в localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && chatId) {
      if (replyingTo === null) {
        localStorage.removeItem(`replyingTo-${chatId}`);
      } else {
        localStorage.setItem(`replyingTo-${chatId}`, JSON.stringify(replyingTo));
      }
    }
  }, [replyingTo, chatId]);
  const { addToast } = useToast();
  
  // Обработчик клика по пользователю в группе для открытия личного чата
  const handleUserClick = useCallback(async (userId: string, userName: string) => {
    try {
      // Нормализуем ID пользователя для создания личного чата
      const normalizedUserId = userId.includes('@c.us') ? userId : `${userId}@c.us`;
      
      // Проверяем, есть ли уже такой чат в списке
      const existingChat = chats.find(chat => 
        (chat.id === normalizedUserId || chat.chat_id === normalizedUserId) && !chat.is_group
      );
      
      if (existingChat) {
        // Если чат уже существует, переходим к нему
        router.push(`/?chat=${encodeURIComponent(existingChat.id)}`, { scroll: false });
        addToast({
          type: "success",
          title: "Переход к чату",
          description: `Открыт чат с ${userName}`
        });
      } else {
        // Если чата нет, создаем новый временный чат
        const tempChatId = `temp:${normalizedUserId.replace('@c.us', '')}`;
        router.push(`/?chat=${encodeURIComponent(tempChatId)}`, { scroll: false });
        addToast({
          type: "success",
          title: "Новый чат",
          description: `Создан чат с ${userName}`
        });
      }
    } catch (error) {
      console.error('Error opening user chat:', error);
      addToast({
        type: "error",
        title: "Ошибка",
        description: "Не удалось открыть чат с пользователем"
      });
    }
  }, [chats, router, addToast]);

  const handleBackToSidebar = useCallback(() => {
    if (onBackToSidebar) {
      onBackToSidebar();
    } else {
      router.push("/chat");
    }
  }, [onBackToSidebar, router]);
  const selectedChat = chats.find(chat => chat.id === chatId);
  const isTempChat = chatId?.startsWith("temp:") ?? false;
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);
  useEffect(() => {
    if (isNearBottom()) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom, isNearBottom]);
  const handleSend = useCallback(async (text: string, replyTo?: ReplyMessage) => {
    if (!text.trim() || !chatId) return;
    const stick = isNearBottom();
    startTransition(() => {
      sendMessage(text.trim(), replyTo).then(() => {
        setDraft("");
        setReplyingTo(null);
        if (stick) setTimeout(scrollToBottom, 50);
      });
    });
  }, [chatId, sendMessage, isNearBottom, scrollToBottom]);
  const handleReplyToMessage = useCallback((message: Message) => {
    const replyData = {
      id: message.id,
      author: message.author,
      text: message.text,
      media: message.media ? {
        type: message.media.type,
        name: message.media.name,
      } : undefined,
    };
    setReplyingTo(replyData);
  }, []);
  const clearReplyingTo = useCallback(() => {
    setReplyingTo(null);
  }, []);
  const handleDeleteMessage = useCallback(async (messageId: string, remote = false) => {
    if (!chatId) return;
    await deleteMessage(messageId, remote);
  }, [chatId, deleteMessage]);
  const handleReplyPreviewClick = useCallback((messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);

    if (!element) {
      console.warn(`Message with id ${messageId} not found for preview navigation`);
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(messageId);

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedMessageId((current) => (current === messageId ? null : current));
    }, 2000);
  }, []);
  const handleFileSelect = useCallback(async (file: File) => {
    if (!chatId) return;
    
    try {
      // Используем универсальный endpoint для всех типов файлов
      const uploadEndpoint = '/api/whatsapp/files/upload-file';
      
      // Определяем тип файла для отображения
      const fileType = file.type.toLowerCase();
      let mediaType = 'document';
      
      if (fileType.startsWith('image/')) {
        mediaType = 'image';
      } else if (fileType.startsWith('video/')) {
        mediaType = 'video';
      } else if (fileType.startsWith('audio/')) {
        mediaType = 'audio';
      }

      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        addToast({
          type: "error",
          title: "Ошибка загрузки файла",
          description: `${response.status}: ${errorText}`
        });
        return;
      }
      
      const result = await response.json();
      const mediaUrl = result.path ? `https://socket.eldor.kz${result.path}` : result.mediaUrl || result.url;
      
      // Создаем объект файла с определенным типом
      const mediaFile = {
        ...file,
        name: `${mediaType}_${Date.now()}.${file.name.split('.').pop()}`
      };
      
      startTransition(() => {
        sendMediaMessage(mediaFile, mediaUrl, replyingTo);
        setReplyingTo(null);
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Ошибка при загрузке",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }, [chatId, sendMediaMessage, replyingTo, addToast]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        <div className="h-[70px] bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
            <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div 
          className="flex-1 p-4 space-y-4" 
          style={{ 
            backgroundImage: `url('/fon_chat.jpeg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed"
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
              <div className={`h-14 rounded-2xl animate-pulse ${
                i % 2 
                  ? "w-52 bg-[#00a884]/20" 
                  : "w-48 bg-white dark:bg-gray-800 shadow-sm"
              }`}></div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-end gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse"></div>
            <div className="w-12 h-12 bg-[#00a884]/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
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
          <Button onClick={handleBackToSidebar} className="w-full bg-green-500 hover:bg-green-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Открыть список чатов
          </Button>
        </div>
      </div>
    );
  }
  return (
    <TooltipProvider>
      <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900">
        <ChatHeader
          chat={selectedChat}
          chatId={chatId}
          onBack={handleBackToSidebar}
          showBackButton={true}
        />
      {isTempChat && (
        <div className="px-3 md:px-6 py-3 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1 text-sm">
              <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                Новый чат с номером {chatId?.replace("temp:", "")}
              </div>
              <div className="text-amber-700 dark:text-amber-300 text-xs leading-relaxed">
                Номер еще не проверен в WhatsApp. При отправке первого сообщения будет выполнена проверка регистрации в WhatsApp.
              </div>
            </div>
          </div>
        </div>
      )}
        <ScrollArea
          className="flex-1 bg-[#ECE5DD] dark:bg-gray-900/50"
          style={{
            backgroundImage: `url("/logoChat.jpg")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed"
          }}
          ref={(el) => {
            const viewport = el?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null;
            scrollContainerRef.current = viewport;
          }}
        >
          {/* Полупрозрачный слой для лучшей читаемости */}
          <div className="absolute inset-0 bg-white/30 dark:bg-black/20 pointer-events-none"></div>
          <div className="relative px-3 sm:px-4 md:px-6 py-2 sm:py-3 space-y-1 sm:space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              {isTempChat ? (
                <div className="max-w-sm mx-auto">
                  <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircleMore className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Начать общение с {chatId?.replace("temp:", "")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Отправьте первое сообщение, чтобы проверить, зарегистрирован ли этот номер в WhatsApp, и начать чат.
                  </p>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  Нет сообщений
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <MemoizedMessageBubble
                key={message.id}
                msg={message}
                onReply={handleReplyToMessage}
                isReplying={replyingTo?.id === message.id}
                onDelete={handleDeleteMessage}
                isGroup={selectedChat?.is_group}
                onUserClick={handleUserClick}
                onReplyPreviewClick={handleReplyPreviewClick}
                isHighlighted={highlightedMessageId === message.id}
              />
            ))
          )}
          
          {/* Индикатор печати */}
          <TypingIndicator 
            typingUsers={typingUsers} 
            isGroup={selectedChat?.is_group || false}
          />
          
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="sticky bottom-0 z-10 bg-transparent">
        <Composer
          draft={draft}
          setDraft={setDraft}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          disabled={!chatId || isPending}
          placeholder={isPending ? "Отправка..." : "Введите сообщение..."}
          replyingTo={replyingTo}
          onCancelReply={clearReplyingTo}
        />
      </div>
      </div>
    </TooltipProvider>
  );
}
