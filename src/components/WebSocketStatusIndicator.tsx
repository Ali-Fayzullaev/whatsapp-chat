'use client'

import { useWebSocket } from '@/providers/WebSocketProvider';
import { Badge } from '@/components/ui/badge';

export function WebSocketStatusIndicator() {
  const { isConnected, connectionState } = useWebSocket();

  const getStatusInfo = () => {
    if (isConnected) {
      return { text: '🟢 WebSocket', variant: 'default' as const, color: 'text-green-600' };
    }
    if (connectionState === 'connecting') {
      return { text: '🟡 Подключение...', variant: 'secondary' as const, color: 'text-yellow-600' };
    }
    return { text: '🔴 Отключен', variant: 'destructive' as const, color: 'text-red-600' };
  };

  const status = getStatusInfo();

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant={status.variant} className={`${status.color} border-current`}>
        {status.text}
      </Badge>
      {process.env.NODE_ENV === 'development' && (
        <span className="text-gray-400">
          State: {connectionState}
        </span>
      )}
    </div>
  );
}