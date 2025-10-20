// src/components/WebSocketDiagnostic.tsx
"use client";

import { useState } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiConfig } from "@/lib/api-config";
import { FEATURES } from "@/config/features";

export function WebSocketDiagnostic() {
  const { isConnected, connectionState, sendMessage, lastMessage, reconnect } = useWebSocket();
  const [testMessages, setTestMessages] = useState<any[]>([]);
  const [pingResponse, setPingResponse] = useState<string | null>(null);

  const sendPing = () => {
    const pingMessage = {
      action: "ping",
      timestamp: Date.now(),
      test: true
    };
    sendMessage(pingMessage);
    setPingResponse("Ping отправлен, ожидание ответа...");
    
    // Сбросим через 5 секунд если нет ответа
    setTimeout(() => {
      if (pingResponse === "Ping отправлен, ожидание ответа...") {
        setPingResponse("❌ Нет ответа на ping");
      }
    }, 5000);
  };

  const testConnection = async () => {
    setTestMessages(prev => [...prev, {
      type: 'info',
      message: '🔍 Начинаем диагностику...',
      timestamp: Date.now()
    }]);

    try {
      // 1. Проверим основной HTTP API
      const chatResponse = await fetch('/api/whatsapp/chats');
      setTestMessages(prev => [...prev, {
        type: chatResponse.ok ? 'success' : 'error',
        message: `HTTP API: ${chatResponse.ok ? '✅' : '❌'} Status: ${chatResponse.status}`,
        timestamp: Date.now()
      }]);

      // 2. Проверим WebSocket токен API
      const tokenResponse = await fetch('/api/whatsapp/websocket/token');
      let tokenData = null;
      try {
        tokenData = await tokenResponse.json();
      } catch (e) {
        tokenData = { error: 'Failed to parse response' };
      }
      
      setTestMessages(prev => [...prev, {
        type: tokenResponse.ok ? 'success' : 'warning',
        message: `WebSocket Token API: ${tokenResponse.ok ? '✅' : '⚠️'} Status: ${tokenResponse.status}`,
        timestamp: Date.now(),
        data: tokenData
      }]);

      // 3. Проверим доступность WebSocket URL
      const wsUrl = apiConfig.getWebSocketUrl();
      setTestMessages(prev => [...prev, {
        type: 'info',
        message: `WebSocket URL: ${wsUrl}`,
        timestamp: Date.now()
      }]);

      // 4. Попытка тестового WebSocket подключения
      if (tokenResponse.ok) {
        setTestMessages(prev => [...prev, {
          type: 'info',
          message: '🔌 Попытка WebSocket подключения...',
          timestamp: Date.now()
        }]);
        
        const testWs = new WebSocket(apiConfig.getWebSocketUrlWithToken());
        
        testWs.onopen = () => {
          setTestMessages(prev => [...prev, {
            type: 'success',
            message: '✅ WebSocket подключение успешно!',
            timestamp: Date.now()
          }]);
          testWs.close();
        };
        
        testWs.onerror = () => {
          setTestMessages(prev => [...prev, {
            type: 'error',
            message: '❌ WebSocket подключение неудачно',
            timestamp: Date.now()
          }]);
        };
        
        testWs.onclose = (event) => {
          setTestMessages(prev => [...prev, {
            type: 'info',
            message: `🔒 WebSocket закрыт: ${event.code} ${event.reason || '(no reason)'}`,
            timestamp: Date.now()
          }]);
        };
        
        // Таймаут для теста
        setTimeout(() => {
          if (testWs.readyState === WebSocket.CONNECTING) {
            testWs.close();
            setTestMessages(prev => [...prev, {
              type: 'error',
              message: '⏰ WebSocket подключение истекло по времени',
              timestamp: Date.now()
            }]);
          }
        }, 5000);
      }
      
    } catch (error) {
      setTestMessages(prev => [...prev, {
        type: 'error',
        message: `❌ Diagnostic Error: ${error}`,
        timestamp: Date.now()
      }]);
    }
  };

  // Отслеживаем ответы на ping
  if (lastMessage && lastMessage.type === 'pong' && pingResponse === "Ping отправлен, ожидание ответа...") {
    setPingResponse("✅ Pong получен успешно!");
    setTimeout(() => setPingResponse(null), 3000);
  }

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected': return '🟢 Подключен';
      case 'connecting': return '🟡 Подключение...';
      case 'error': return '🔴 Ошибка';
      default: return '⚫ Отключен';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          WebSocket Диагностика
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Информация о конфигурации и подключении */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
          <div>
            <strong>Конфигурация:</strong><br />
            <div className="text-xs mt-1 space-y-1">
              <div>WebSocket: <Badge variant={FEATURES.WEBSOCKET_ENABLED ? "default" : "secondary"}>
                {FEATURES.WEBSOCKET_ENABLED ? "Включен" : "Отключен"}
              </Badge></div>
              <div>HTTP Polling: {FEATURES.HTTP_POLLING_INTERVAL/1000}с</div>
              <div>Уведомления: {FEATURES.SHOW_CONNECTION_STATUS ? "Да" : "Нет"}</div>
            </div>
          </div>
          <div>
            <strong>WebSocket URL:</strong><br />
            <code className="text-xs">{apiConfig.getWebSocketUrl()}</code>
            <br /><br />
            <strong>Состояние:</strong><br />
            <Badge variant={connectionState === 'connected' ? 'default' : 'secondary'}>
              {connectionState}
            </Badge>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={sendPing} 
            disabled={!isConnected}
            variant="outline"
          >
            📡 Ping Test
          </Button>
          
          <Button 
            onClick={testConnection} 
            variant="outline"
          >
            🔧 API Test
          </Button>
          
          <Button 
            onClick={reconnect}
            variant="outline"
            disabled={!FEATURES.WEBSOCKET_ENABLED || connectionState === 'connecting'}
          >
            🔄 Переподключить
          </Button>
          
          {!FEATURES.WEBSOCKET_ENABLED && (
            <Button 
              onClick={() => {
                setTestMessages(prev => [...prev, {
                  type: 'info',
                  message: '💡 Для включения WebSocket измените WEBSOCKET_ENABLED в src/config/features.ts',
                  timestamp: Date.now()
                }]);
              }}
              variant="outline"
            >
              💡 Как включить WebSocket?
            </Button>
          )}
        </div>

        {/* Ответ на ping */}
        {pingResponse && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
            {pingResponse}
          </div>
        )}

        {/* Последнее сообщение */}
        {lastMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <strong>Последнее сообщение:</strong>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(lastMessage, null, 2)}
            </pre>
          </div>
        )}

        {/* Лог тестовых сообщений */}
        {testMessages.length > 0 && (
          <div className="space-y-2">
            <strong>Результаты диагностики:</strong>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {testMessages.slice(-10).map((msg, idx) => (
                <div key={idx} className={`text-xs p-2 border rounded ${
                  msg.type === 'success' ? 'bg-green-50 border-green-200' :
                  msg.type === 'error' ? 'bg-red-50 border-red-200' :
                  msg.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="font-mono">
                    <span className="text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}:
                    </span>
                    <span className="ml-2">{msg.message}</span>
                  </div>
                  {msg.data && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-gray-600">Подробности</summary>
                      <pre className="mt-1 text-xs overflow-auto bg-white p-1 rounded">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кнопка очистки */}
        {testMessages.length > 0 && (
          <Button 
            onClick={() => setTestMessages([])} 
            variant="outline" 
            size="sm"
          >
            🗑️ Очистить лог
          </Button>
        )}

      </CardContent>
    </Card>
  );
}