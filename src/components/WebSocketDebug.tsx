// src/components/WebSocketDebug.tsx
"use client";

import { useWebSocket } from "@/providers/WebSocketProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react";

export function WebSocketDebug() {
  const { 
    isConnected, 
    connectionState, 
    lastMessage, 
    reconnect,
    sendMessage 
  } = useWebSocket();

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected': return <Wifi className="h-4 w-4" />;
      case 'connecting': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const sendTestPing = () => {
    sendMessage({
      type: 'ping',
      timestamp: Date.now(),
      test: true
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          WebSocket Диагностика
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Статус:</span>
          <Badge className={`${getStatusColor()} text-white`}>
            {connectionState}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Подключено:</span>
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Да' : 'Нет'}
          </span>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={reconnect} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Переподключиться
          </Button>
          
          <Button 
            onClick={sendTestPing} 
            variant="outline" 
            size="sm" 
            className="w-full"
            disabled={!isConnected}
          >
            Отправить тест
          </Button>
        </div>

        {lastMessage && (
          <div className="text-sm">
            <p className="font-medium">Последнее сообщение:</p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(lastMessage, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>Token: {typeof window !== 'undefined' && localStorage.getItem('auth_token') ? 'Есть' : 'Нет'}</p>
          <p>URL: wss://socket.eldor.kz/api/ws</p>
        </div>
      </CardContent>
    </Card>
  );
}