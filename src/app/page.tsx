"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { OptimizedSidebar } from "@/components/optimized/OptimizedSidebar";
import { OptimizedChat } from "@/components/optimized/OptimizedChat";
import { Suspense } from "react";

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Получаем chatId из query параметров
  const chatId = searchParams.get('chat');

  return (
    <div className="flex h-screen w-full">
      {/* Desktop Sidebar */}
      <aside className="w-full md:w-[360px] lg:w-[400px] flex-col border-r border-gray-200 dark:border-gray-800">
        <OptimizedSidebar selectedChatId={chatId || undefined} />
      </aside>

      {/* Main Content */}
      {chatId ? (
        <main className="flex-1">
          <OptimizedChat 
            chatId={decodeURIComponent(chatId)} 
            onBackToSidebar={() => router.push('/')}
          />
        </main>
      ) : (
        <main className="hidden md:flex flex-1 items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="text-2xl font-semibold mb-2 text-green-500">
              WhatsApp Web
            </div>
            <p className="text-muted-foreground mb-4">
              Выберите чат чтобы начать общение
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <ChatContent />
    </Suspense>
  );
}
