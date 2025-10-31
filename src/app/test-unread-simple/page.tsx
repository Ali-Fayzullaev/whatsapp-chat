"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useWebSocket } from "@/providers/WebSocketProvider";

export default function TestUnreadMessages() {
  const [testChatId, setTestChatId] = useState("test_chat_001");
  const [testMessageId, setTestMessageId] = useState("");
  
  const { 
    addUnreadMessage, 
    markChatAsRead, 
    getUnreadCount, 
    getUnreadChats,
    unreadMessages
  } = useUnreadMessages();
  
  const { isConnected } = useWebSocket();

  const handleAddUnreadMessage = () => {
    const messageId = testMessageId || `msg_${Date.now()}`;
    addUnreadMessage(messageId, testChatId);
    setTestMessageId("");
  };

  const handleMarkChatAsRead = () => {
    markChatAsRead(testChatId);
  };

  const unreadChats = getUnreadChats();
  const currentChatUnreadCount = getUnreadCount(testChatId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Тест непрочитанных сообщений</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Управление */}
        <Card>
          <CardHeader>
            <CardTitle>Управление</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID чата</label>
              <Input 
                value={testChatId}
                onChange={(e) => setTestChatId(e.target.value)}
                placeholder="ID чата"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">ID сообщения (опционально)</label>
              <Input 
                value={testMessageId}
                onChange={(e) => setTestMessageId(e.target.value)}
                placeholder="Оставьте пустым для автогенерации"
              />
            </div>
            
            <div className="space-y-2">
              <Button onClick={handleAddUnreadMessage} className="w-full">
                Добавить непрочитанное сообщение
              </Button>
              <Button onClick={handleMarkChatAsRead} variant="secondary" className="w-full">
                Пометить чат как прочитанный
              </Button>
              <Button 
                onClick={() => {
                  // Симуляция WebSocket сообщения для тестирования
                  const mockMessage = {
                    id: `msg_${Date.now()}`,
                    text: `Тестовое сообщение ${new Date().toLocaleTimeString()}`,
                    author: 'them',
                    timestamp: new Date().toISOString(),
                    createdAt: Date.now()
                  };
                  
                  // Добавляем сообщение в систему непрочитанных
                  addUnreadMessage(mockMessage.id, testChatId);
                }}
                variant="outline" 
                className="w-full"
              >
                Симуляция нового сообщения
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Статус */}
        <Card>
          <CardHeader>
            <CardTitle>Статус</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>WebSocket подключен:</span>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Да" : "Нет"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Непрочитанных в текущем чате:</span>
              <Badge variant="secondary">
                {currentChatUnreadCount}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Всего непрочитанных сообщений:</span>
              <Badge variant="secondary">
                {unreadMessages.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Непрочитанные чаты */}
      <Card>
        <CardHeader>
          <CardTitle>Непрочитанные чаты</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(unreadChats).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(unreadChats).map(([chatId, count]) => (
                <div key={chatId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-mono text-sm">{chatId}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Нет непрочитанных чатов</p>
          )}
        </CardContent>
      </Card>

      {/* Список всех непрочитанных сообщений */}
      <Card>
        <CardHeader>
          <CardTitle>Все непрочитанные сообщения</CardTitle>
        </CardHeader>
        <CardContent>
          {unreadMessages.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {unreadMessages.map((msg, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                  <div>
                    <div className="font-mono">{msg.messageId}</div>
                    <div className="text-gray-500">Чат: {msg.chatId}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Нет непрочитанных сообщений</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}