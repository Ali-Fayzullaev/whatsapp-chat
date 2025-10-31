// src/components/MessageSyncStatus.tsx
"use client";
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface MessageSyncStatusProps {
  status: 'websocket' | 'polling' | 'offline';
  isPolling: boolean;
}

export function MessageSyncStatus({ status, isPolling }: MessageSyncStatusProps) {
  if (status === 'websocket' && !isPolling) {
    return (
      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
        <Wifi className="w-3 h-3 mr-1" />
        Реальное время
      </Badge>
    );
  }

  if (status === 'polling' || isPolling) {
    return (
      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
        Синхронизация
      </Badge>
    );
  }

  if (status === 'offline') {
    return (
      <Badge variant="destructive" className="text-xs">
        <WifiOff className="w-3 h-3 mr-1" />
        Оффлайн
      </Badge>
    );
  }

  return null;
}