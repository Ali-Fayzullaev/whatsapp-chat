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
    <div className="flex h-screen w-full bg-white dark:bg-gray-900">
      {/* Мобильная версия */}
      <div className="md:hidden flex flex-col h-full w-full">
        {chatId ? (
          <OptimizedChat 
            chatId={decodeURIComponent(chatId)} 
            onBackToSidebar={() => router.push('/')}
          />
        ) : (
          <OptimizedSidebar selectedChatId={chatId || undefined} />
        )}
      </div>

      {/* Десктопная версия */}
      <div className="hidden md:flex h-full w-full">
        {/* Sidebar */}
        <aside className="w-[360px] lg:w-[420px] h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <OptimizedSidebar selectedChatId={chatId || undefined} />
        </aside>

        {/* Main Content */}
        {chatId ? (
          <main className="flex-1 bg-[#f0f2f5] dark:bg-gray-900">
            <OptimizedChat 
              chatId={decodeURIComponent(chatId)} 
              onBackToSidebar={() => router.push('/')}
            />
          </main>
        ) : (
          <main className="flex-1 bg-[#f0f2f5] dark:bg-gray-900 flex items-center justify-center relative">
          {/* WhatsApp Web Style Welcome Screen */}
          <div className="text-center max-w-md px-6">
            {/* WhatsApp Logo */}
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto bg-[#00a884] rounded-full flex items-center justify-center mb-6 shadow-2xl">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.051 3.596z"/>
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-light text-gray-700 dark:text-gray-200 mb-4">
              WhatsApp Web
            </h1>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Выберите чат из списка слева, чтобы начать общение.
            </p>



            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 dark:text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Быстрые сообщения</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Медиафайлы</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Синхронизация</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Безопасность</span>
              </div>
            </div>
          </div>

            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300a884' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
          </main>
        )}
      </div>
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
