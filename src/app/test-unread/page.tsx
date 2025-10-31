// src/app/test-unread/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useWebSocket } from "@/providers/WebSocketProvider";

export default function TestUnreadPage() {
  const { 
    addUnreadMessage, 
    markChatAsRead, 
    getUnreadCount, 
    getUnreadChats,
    unreadMessages,
    lastReadTimestamps
  } = useUnreadMessages();

  const { isConnected, connectionState, sendMessage } = useWebSocket();
  const [testChatId] = useState("test-chat-1");
  const [messageCounter, setMessageCounter] = useState(1);
  const [wsLogs, setWsLogs] = useState<string[]>([]);

  // Добавить тестовое непрочитанное сообщение
  const addTestMessage = () => {
    const messageId = `test-msg-${messageCounter}`;
    addUnreadMessage(messageId, testChatId);
    setMessageCounter(prev => prev + 1);
  };

  // Добавить несколько сообщений разом
  const addMultipleMessages = () => {
    for (let i = 0; i < 5; i++) {
      const messageId = `test-msg-${messageCounter + i}`;
      addUnreadMessage(messageId, testChatId);
    }
    setMessageCounter(prev => prev + 5);
  };

  // Создать сообщения в разных чатах
  const createMessagesInDifferentChats = () => {
    const chats = ['chat-1', 'chat-2', 'chat-3'];
    chats.forEach((chatId, index) => {
      for (let i = 0; i < 3; i++) {
        const messageId = `${chatId}-msg-${Date.now()}-${i}`;
        addUnreadMessage(messageId, chatId);
      }
    });
  };

  // Проверить WebSocket и отправить тестовое сообщение
  const testWebSocketMessage = () => {
    const testMessage = {
      type: 'test_message',
      chatId: testChatId,
      message: {
        id: `test-ws-msg-${Date.now()}`,
        author: 'them',
        text: `Тестовое сообщение WebSocket ${new Date().toLocaleTimeString()}`,
        createdAt: Date.now()
      },
      timestamp: Date.now()
    };
    
    try {
      sendMessage(testMessage);
      const logEntry = `${new Date().toLocaleTimeString()}: Отправлено - ${JSON.stringify(testMessage)}`;
      setWsLogs(prev => [logEntry, ...prev.slice(0, 4)]);
    } catch (error) {
      const logEntry = `${new Date().toLocaleTimeString()}: Ошибка - ${error}`;
      setWsLogs(prev => [logEntry, ...prev.slice(0, 4)]);
    }
  };

  // Проверить статус авторизации
  const checkAuthStatus = () => {
    const token = localStorage.getItem('auth_token');
    const logEntry = `${new Date().toLocaleTimeString()}: Токен ${token ? 'найден' : 'отсутствует'} ${token ? `(длина: ${token.length})` : ''}`;
    setWsLogs(prev => [logEntry, ...prev.slice(0, 4)]);
  };

  // Очистить логи
  const clearLogs = () => {
    setWsLogs([]);
  };

  // Добавить тестовый токен для проверки WebSocket
  const addTestToken = () => {
    const testToken = 'test_token_' + Date.now();
    localStorage.setItem('auth_token', testToken);
    const logEntry = `${new Date().toLocaleTimeString()}: Добавлен тестовый токен: ${testToken}`;
    setWsLogs(prev => [logEntry, ...prev.slice(0, 4)]);
  };

  // Пометить чат как прочитанный
  const markAsRead = () => {
    markChatAsRead(testChatId);
  };

  // Получить данные о непрочитанных чатах
  const unreadChats = getUnreadChats();
  const unreadCount = getUnreadCount(testChatId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Тест непрочитанных сообщений и WebSocket</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Тестирование непрочитанных сообщений */}
        <Card>
          <CardHeader>
            <CardTitle>Непрочитанные сообщения</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Тестовый чат ID:</span>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {testChatId}
              </code>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Непрочитанных:</span>
              <Badge variant="secondary">{unreadCount}</Badge>
            </div>

            <div className="space-y-2">
              <Button onClick={addTestMessage} className="w-full">
                Добавить 1 сообщение
              </Button>
              <Button onClick={addMultipleMessages} variant="secondary" className="w-full">
                Добавить 5 сообщений
              </Button>
              <Button onClick={createMessagesInDifferentChats} variant="secondary" className="w-full">
                Создать сообщения в разных чатах
              </Button>
              <Button onClick={testWebSocketMessage} variant="secondary" className="w-full" disabled={!isConnected}>
                Тест WebSocket сообщения
              </Button>
              <Button onClick={checkAuthStatus} variant="outline" className="w-full">
                Проверить авторизацию
              </Button>
              <Button onClick={addTestToken} variant="outline" className="w-full">
                Добавить тестовый токен
              </Button>
              <Button onClick={clearLogs} variant="outline" className="w-full">
                Очистить логи
              </Button>
              <Button 
                onClick={markAsRead} 
                variant="outline" 
                className="w-full"
                disabled={unreadCount === 0}
              >
                Пометить как прочитанное
              </Button>
            </div>

            {/* Статистика по всем чатам */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Все чаты с непрочитанными:</h4>
              {Object.keys(unreadChats).length === 0 ? (
                <p className="text-gray-500 text-sm">Нет непрочитанных чатов</p>
              ) : (
                <div className="space-y-1">
                  {Object.entries(unreadChats).map(([chatId, count]) => (
                    <div key={chatId} className="flex justify-between text-sm">
                      <span className="font-mono">{chatId}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Детальная информация */}
            <div className="border-t pt-4 text-xs text-gray-500 space-y-2">
              <p>Всего непрочитанных сообщений: {unreadMessages.length}</p>
              <p>Отслеживаемых чатов: {Object.keys(lastReadTimestamps).length}</p>
              <p>WebSocket: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {connectionState}
              </span></p>
            </div>

            {/* WebSocket логи */}
            {wsLogs.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">WebSocket логи:</h4>
                <div className="text-xs bg-gray-100 p-2 rounded space-y-1 max-h-32 overflow-y-auto">
                  {wsLogs.map((log, index) => (
                    <div key={index} className="break-all">{log}</div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WebSocket диагностика */}
        <Card>
          <CardHeader>
            <CardTitle>WebSocket диагностика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Статус:</span>
              <Badge className={connectionState === 'connected' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                {connectionState}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Подключено:</span>
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Да' : 'Нет'}
              </span>
            </div>

            <div className="text-xs text-gray-500">
              <p>Token: {typeof window !== 'undefined' && localStorage.getItem('auth_token') ? 'Есть' : 'Нет'}</p>
              <p>URL: wss://socket.eldor.kz/api/ws</p>
              <p className="text-green-600">🎯 Тест: Если видите это без ошибок циклов - исправление работает!</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Сырые данные для отладки */}
      <Card>
        <CardHeader>
          <CardTitle>Отладочная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Непрочитанные сообщения:</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(unreadMessages, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">Время последнего прочтения:</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(lastReadTimestamps, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}