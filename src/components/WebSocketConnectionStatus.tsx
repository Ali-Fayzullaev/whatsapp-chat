// src/components/WebSocketStatus.tsx
"use client";
import { useWebSocket } from '@/providers/WebSocketProvider';
import { FEATURES } from '@/config/features';
import { Button } from '@/components/ui/button';

export function WebSocketConnectionStatus() {
  const { isConnected, connectionState, reconnect } = useWebSocket();

  // Не показываем статус, если WebSocket отключен или не нужно показывать статус
  if (!FEATURES.WEBSOCKET_ENABLED || !FEATURES.SHOW_CONNECTION_STATUS) {
    return null;
  }

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'error':
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Подключен (реальное время)';
      case 'connecting':
        return 'Подключение...';
      case 'error':
        return 'Ошибка подключения';
      case 'disconnected':
        return 'Не подключен';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'error':
      case 'disconnected':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-xs ${getStatusColor()}`}>
      <span>{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      {(connectionState === 'error' || connectionState === 'disconnected') && (
        <Button
          onClick={reconnect}
          size="sm"
          variant="ghost" 
          className="h-5 px-2 text-xs text-white hover:bg-white/10"
        >
          ↻
        </Button>
      )}
    </div>
  );
}