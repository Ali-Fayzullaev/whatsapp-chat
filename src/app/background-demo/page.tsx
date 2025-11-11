// src/app/background-demo/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Image as ImageIcon, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { MessageBubble } from "@/components/chat/MessageBubble";
import type { Message } from "@/components/chat/types";

// Демо сообщения
const demoMessages: Message[] = [
  {
    id: "demo-msg-1",
    chatId: "demo-group@g.us",
    author: "them",
    text: "Привет! Как тебе новый фон?",
    time: "14:30",
    createdAt: Date.now() - 600000,
    status: "read",
    isRead: true,
    sender: {
      id: "79123456789@c.us",
      name: "Алексей",
      full_name: "Алексей Петров"
    }
  },
  {
    id: "demo-msg-2", 
    chatId: "demo-group@g.us",
    author: "me",
    text: "Отлично! Очень стильно выглядит! 😍",
    time: "14:31",
    createdAt: Date.now() - 540000,
    status: "read",
    isRead: true
  }
];

export default function BackgroundDemoPage() {
  const router = useRouter();

  const handleUserClick = (userId: string, userName: string) => {
    console.log(`Клик по пользователю: ${userName} (${userId})`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Palette className="h-6 w-6 text-purple-600" />
                Фон чата - logoChat.jpg
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Демонстрация нового фонового изображения для чатов
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
          <CardHeader>
            <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Новый фон чата добавлен
            </CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-300">
              Теперь в качестве фона используется изображение logoChat.jpg из папки public
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Chat Demo with Background */}
        <Card>
          <CardHeader>
            <CardTitle>Демонстрация чата с новым фоном</CardTitle>
            <CardDescription>
              Посмотрите как выглядят сообщения на новом фоне
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Chat Area with Background */}
            <div 
              className="h-96 rounded-lg border overflow-hidden relative"
              style={{
                backgroundImage: `url("/logoChat.jpg")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            >
              {/* Полупрозрачный слой для лучшей читаемости */}
              <div className="absolute inset-0 bg-white/30 dark:bg-black/20 pointer-events-none"></div>
              
              {/* Сообщения */}
              <div className="relative h-full overflow-y-auto p-4 space-y-4">
                {demoMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    msg={message}
                    isGroup={true}
                    onUserClick={handleUserClick}
                  />
                ))}
                
                {/* Пустое сообщение для демонстрации */}
                <div className="text-center py-8">
                  <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 inline-block">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      💬 Фон чата: logoChat.jpg
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Полупрозрачный слой обеспечивает читаемость сообщений
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Технические детали</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">📁 Расположение файла:</h4>
              <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm">
                /public/logoChat.jpg
              </code>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🎨 CSS стили:</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
{`backgroundImage: url("/logoChat.jpg"),
backgroundSize: "cover",
backgroundPosition: "center", 
backgroundRepeat: "no-repeat",
backgroundAttachment: "fixed"`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">✨ Дополнительные улучшения:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Полупрозрачный слой для лучшей читаемости сообщений</li>
                <li>• Адаптивность под светлую и темную темы</li>
                <li>• Фиксированное положение фона при скролле</li>
                <li>• Правильное масштабирование изображения</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">
              Как использовать
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 dark:text-blue-300 space-y-3">
            <div>
              <strong>1. Откройте любой чат:</strong>
              <p className="text-sm mt-1">Перейдите в основное приложение и выберите любой чат</p>
            </div>
            
            <div>
              <strong>2. Наслаждайтесь новым фоном:</strong>
              <p className="text-sm mt-1">Фон logoChat.jpg будет отображаться во всех чатах</p>
            </div>
            
            <div>
              <strong>3. Замена изображения:</strong>
              <p className="text-sm mt-1">Чтобы изменить фон, замените файл /public/logoChat.jpg на другое изображение</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}