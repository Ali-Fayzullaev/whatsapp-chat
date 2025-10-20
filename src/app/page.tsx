"use client";

import { redirect } from "next/navigation";
import { CHATS } from "@/components/chat/fixtures";
import { WebSocketDiagnostic } from "@/components/WebSocketDiagnostic";
import { MediaTypeTester } from "@/components/MediaTypeTester";
import { ReplyTester } from "@/components/ReplyTester";
import { AuthTester } from "@/components/AuthTester";
import { AuthStatusDemo } from "@/components/AuthStatusDemo";
import { TokenStorageTester } from "@/components/TokenStorageTester";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type ViewType = 'menu' | 'websocket' | 'media' | 'reply' | 'auth' | 'tokens';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('menu');
  
  if (currentView === 'websocket') {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
        <div className="mb-4">
          <Button 
            onClick={() => setCurrentView('menu')}
            variant="outline"
          >
            ← Вернуться к меню
          </Button>
        </div>
        <WebSocketDiagnostic />
      </div>
    );
  }
  
  if (currentView === 'media') {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
        <div className="mb-4">
          <Button 
            onClick={() => setCurrentView('menu')}
            variant="outline"
          >
            ← Вернуться к меню
          </Button>
        </div>
        <MediaTypeTester />
      </div>
    );
  }
  
  if (currentView === 'reply') {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
        <div className="mb-4">
          <Button 
            onClick={() => setCurrentView('menu')}
            variant="outline"
          >
            ← Вернуться к меню
          </Button>
        </div>
        <ReplyTester />
      </div>
    );
  }
  
  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
        <div className="mb-4">
          <Button 
            onClick={() => setCurrentView('menu')}
            variant="outline"
          >
            ← Вернуться к меню
          </Button>
        </div>
        <AuthTester />
      </div>
    );
  }
  
  if (currentView === 'tokens') {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
        <div className="mb-4">
          <Button 
            onClick={() => setCurrentView('menu')}
            variant="outline"
          >
            ← Вернуться к меню
          </Button>
        </div>
        <TokenStorageTester />
      </div>
    );
  }

  // Временно показываем выбор - диагностика или чат
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-center">WhatsApp Chat</h1>
        
        <AuthStatusDemo />
        
        <div className="flex flex-col gap-4 w-full max-w-md">
          <Button onClick={() => {
            const first = CHATS[0]?.id || "1";
            window.location.href = `/${first}`;
          }} className="w-full">
            Открыть чат
          </Button>
          <Button 
            onClick={() => setCurrentView('websocket')}
            variant="outline"
            className="w-full"
          >
            🔧 WebSocket диагностика
          </Button>
          <Button 
            onClick={() => setCurrentView('media')}
            variant="outline"
            className="w-full"
          >
            🎥 Тестер типов медиа
          </Button>
          <Button 
            onClick={() => setCurrentView('reply')}
            variant="outline"
            className="w-full"
          >
            💬 Тестер функции ответов
          </Button>
          <Button 
            onClick={() => setCurrentView('auth')}
            variant="outline"
            className="w-full"
          >
            🔑 Тест аутентификации
          </Button>
          <Button 
            onClick={() => setCurrentView('tokens')}
            variant="outline"
            className="w-full"
          >
            🔐 Система хранения токенов
          </Button>
        </div>
      </div>
    </div>
  );
}
