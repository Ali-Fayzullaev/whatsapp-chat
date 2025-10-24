// src/components/WebSocketStatus.tsx
"use client";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WebSocketStatus() {
  const { isConnected, connectionState, reconnect } = useWebSocket();

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'WebSocket подключен';
      case 'connecting': return 'Подключение...';
      case 'disconnected': return 'WebSocket отключен';
      case 'error': return 'Ошибка подключения';
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge 
        variant="secondary" 
        className={`${getStatusColor()} text-white px-2 py-1`}
      >
        {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
        {getStatusText()}
      </Badge>
      
      {!isConnected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={reconnect}
          className="h-6 px-2 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Переподключить
        </Button>
      )}
    </div>
  );
}