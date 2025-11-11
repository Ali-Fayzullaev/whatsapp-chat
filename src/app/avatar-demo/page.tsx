// src/app/avatar-demo/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MessageCircle, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

// Демо чаты для показа аватаров
const demoChatItems = [
  {
    id: "79123456789@c.us",
    name: "Алексей Петров",
    lastMessage: "Привет! Как дела?",
    time: "14:30",
    unread: 2,
    isGroup: false
  },
  {
    id: "group1@g.us", 
    name: "Рабочая группа",
    lastMessage: "Алексей: Встречаемся завтра в 10:00",
    time: "14:25",
    unread: 5,
    isGroup: true
  },
  {
    id: "79987654321@c.us",
    name: "Мария Иванова", 
    lastMessage: "Спасибо за помощь!",
    time: "13:45",
    unread: 0,
    isGroup: false
  },
  {
    id: "friends@g.us",
    name: "Друзья",
    lastMessage: "Дмитрий: Кто идет в кино?",
    time: "12:30", 
    unread: 3,
    isGroup: true
  }
];

export default function AvatarDemoPage() {
  const router = useRouter();

  const ChatItemDemo = ({ chat }: { chat: typeof demoChatItems[0] }) => {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-1 ring-gray-200 dark:ring-gray-700">
            <AvatarImage 
              src={chat.isGroup ? "/groupAvatar.png" : "/userAvatar.jpg"} 
              alt={chat.name} 
            />
            <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-medium text-sm">
              {chat.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* Индикатор типа чата */}
          {chat.isGroup && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-[15px] truncate text-gray-900 dark:text-gray-100 ${
              chat.unread > 0 ? 'font-bold' : 'font-semibold'
            }`}>
              {chat.name}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {chat.time}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-gray-600 dark:text-gray-400 truncate flex-1">
              {chat.lastMessage}
            </p>
            
            {chat.unread > 0 && (
              <div className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full ml-2 flex-shrink-0 min-w-[20px] text-center">
                {chat.unread}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
                <ImageIcon className="h-6 w-6 text-blue-600" />
                Аватары чатов в Sidebar
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Демонстрация новых аватаров для групп и личных чатов
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Новые аватары добавлены
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Теперь групповые и личные чаты имеют разные аватары с индикаторами
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Avatar Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Групповые чаты
              </CardTitle>
              <CardDescription>
                Используется изображение groupAvatar.png с синим индикатором
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 ring-1 ring-gray-200">
                    <AvatarImage src="/groupAvatar.png" alt="Group Avatar" />
                    <AvatarFallback>Г</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <div className="font-semibold">groupAvatar.png</div>
                  <div className="text-sm text-gray-600">+ индикатор группы</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Определение: ID чата заканчивается на "@g.us"
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Личные чаты
              </CardTitle>
              <CardDescription>
                Используется изображение userAvatar.jpg без индикатора
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-16 w-16 ring-1 ring-gray-200">
                  <AvatarImage src="/userAvatar.jpg" alt="User Avatar" />
                  <AvatarFallback>П</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">userAvatar.jpg</div>
                  <div className="text-sm text-gray-600">Без индикатора</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Определение: ID чата заканчивается на "@c.us" 
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Демонстрация Sidebar с новыми аватарами</CardTitle>
            <CardDescription>
              Так выглядят чаты в боковой панели с новыми аватарами
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md">
              {demoChatItems.map((chat, index) => (
                <ChatItemDemo key={index} chat={chat} />
              ))}
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
              <h4 className="font-semibold mb-2">📁 Файлы аватаров:</h4>
              <div className="space-y-1 text-sm font-mono">
                <div>• /public/groupAvatar.png - для групповых чатов</div>
                <div>• /public/userAvatar.jpg - для личных чатов</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🎯 Логика определения:</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
{`// Проверяем тип чата по ID
chat.id.endsWith('@g.us') 
  ? "/groupAvatar.png"    // Групповой чат
  : "/userAvatar.jpg"     // Личный чат`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">✨ Индикатор группы:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Синий кружок с иконкой людей</li>
                <li>• Отображается только для групповых чатов</li>
                <li>• Позиционируется в правом нижнем углу аватара</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">
              Как использовать
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700 dark:text-green-300 space-y-3">
            <div>
              <strong>1. Откройте основное приложение:</strong>
              <p className="text-sm mt-1">Перейдите на главную страницу WhatsApp клона</p>
            </div>
            
            <div>
              <strong>2. Посмотрите на боковую панель:</strong>
              <p className="text-sm mt-1">Все чаты теперь имеют соответствующие аватары</p>
            </div>
            
            <div>
              <strong>3. Различайте типы чатов:</strong>
              <p className="text-sm mt-1">Группы имеют синий индикатор с иконкой людей</p>
            </div>
            
            <div>
              <strong>4. Замена изображений:</strong>
              <p className="text-sm mt-1">Чтобы изменить аватары, замените файлы в /public/</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}