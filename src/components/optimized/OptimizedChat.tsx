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
import { useChats } from "@/hooks/useChats";
import { useToast } from "@/components/ui/toast";
import type { Message, ReplyMessage } from "@/components/chat/types";
import { ArrowLeft, MessageCircleMore } from "lucide-react";



const MemoizedMessageBubble = memo(MessageBubble, (prevProps, nextProps) => {
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.text === nextProps.msg.text &&
    prevProps.msg.status === nextProps.msg.status &&
    prevProps.msg.pending === nextProps.msg.pending &&
    prevProps.isReplying === nextProps.isReplying &&
    JSON.stringify(prevProps.msg.media) === JSON.stringify(nextProps.msg.media) &&
    JSON.stringify(prevProps.msg.replyTo) === JSON.stringify(nextProps.msg.replyTo)
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
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { chats } = useChats();
  const { messages, loading, sendMessage, sendMediaMessage, deleteMessage } = useMessages(chatId);

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
        console.log("📤 Сообщение отправлено, сбрасываем replyingTo");
        setDraft("");
        setReplyingTo(null);
        if (stick) setTimeout(scrollToBottom, 50);
      });
    });
  }, [chatId, sendMessage, isNearBottom, scrollToBottom]);

  const handleReplyToMessage = useCallback((message: Message) => {
    console.log("🔹 handleReplyToMessage вызвана с сообщением:", message);
    const replyData = {
      id: message.id,
      author: message.author,
      text: message.text,
      media: message.media ? {
        type: message.media.type,
        name: message.media.name,
      } : undefined,
    };
    console.log("🔹 Устанавливаем replyingTo:", replyData);
    setReplyingTo(replyData);
  }, []);

  const clearReplyingTo = useCallback(() => {
    console.log("🔹 Принудительно очищаем replyingTo");
    setReplyingTo(null);
  }, []);

  const handleDeleteMessage = useCallback(async (messageId: string, remote = false) => {
    if (!chatId) return;
    await deleteMessage(messageId, remote);
  }, [chatId, deleteMessage]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!chatId) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', chatId);
      
      const response = await fetch('/api/whatsapp/files/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        addToast({
          type: "error",
          title: "Ошибка загрузки файла",
          description: response.status === 404 ? 'API не найден' : errorText
        });
        return;
      }
      
      const result = await response.json();
      const mediaUrl = result.path ? `https://socket.eldor.kz${result.path}` : result.mediaUrl || result.url;
      
      startTransition(() => {
        sendMediaMessage(file, mediaUrl, replyingTo);
        setReplyingTo(null);
      });
      
    } catch (error) {
      addToast({
        type: "error",
        title: "Ошибка при загрузке",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }, [chatId, sendMediaMessage, replyingTo]);

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
          className="flex-1 bg-[#ECE5DD] dark:bg-gray-900/50 bg-opacity-50 bg-whatsapp-pattern"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cccccc' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
          ref={(el) => {
            const viewport = el?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null;
            scrollContainerRef.current = viewport;
          }}
        >
          <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 space-y-1 sm:space-y-2">
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
              />
            ))
          )}
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