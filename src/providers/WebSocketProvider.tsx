// src/providers/WebSocketProvider.tsx
"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { FEATURES } from "@/config/features";

// Константы для WebSocket
const WS_RECONNECT_DELAY = 5000;
const WS_BASE_URL = "wss://socket.eldor.kz/api/ws";

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (data: any) => void;
  onMessage: (handler: (data: any) => void) => void;
  offMessage: (handler: (data: any) => void) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  connectionState: 'disconnected',
  sendMessage: () => {},
  onMessage: () => {},
  offMessage: () => {},
  reconnect: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [messageHandlers, setMessageHandlers] = useState<((data: any) => void)[]>([]);

  // Refs для WebSocket
  const wsConnectionRef = useRef<WebSocket | null>(null);
  const wsReconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectWsRef = useRef(true);

  // Функции управления подписками
  const onMessage = useCallback((handler: (data: any) => void) => {
    setMessageHandlers(prev => [...prev, handler]);
  }, []);

  const offMessage = useCallback((handler: (data: any) => void) => {
    setMessageHandlers(prev => prev.filter(h => h !== handler));
  }, []);

  // Очистка таймера переподключения
  const clearWsReconnectTimer = useCallback(() => {
    if (wsReconnectTimerRef.current) {
      clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
    }
  }, []);

  // Планирование переподключения
  const scheduleWsReconnect = useCallback(() => {
    if (!shouldReconnectWsRef.current) return;
    if (wsReconnectTimerRef.current) return;
    
    console.log('🔄 Планируется переподключение WebSocket через', WS_RECONNECT_DELAY, 'ms');
    wsReconnectTimerRef.current = setTimeout(() => {
      wsReconnectTimerRef.current = null;
      connectWebSocket();
    }, WS_RECONNECT_DELAY);
  }, []);

  // Обработка сообщений WebSocket
  const handleWsEnvelope = useCallback((raw: string) => {
    if (!raw) return;
    
    let payload;
    try {
      payload = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (err) {
      console.error("❌ Failed to parse WS payload", err);
      return;
    }
    
    if (!payload || typeof payload !== "object") return;

    console.log("📨 WebSocket message received:", payload);
    setLastMessage(payload);
    
    // Уведомляем всех подписчиков
    messageHandlers.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error('❌ Error in WebSocket message handler:', error);
      }
    });

    // Обработка специфичных событий
    const type = payload.type;
    
    switch (type) {
      case "ws.ready":
        console.log("✅ WebSocket готов:", payload.meta || {});
        break;
      case "message.created":
        console.log("📝 Новое сообщение:", payload);
        break;
      case "message.updated":
        console.log("✏️ Сообщение обновлено:", payload);
        break;
      case "message.deleted":
        console.log("🗑️ Сообщение удалено:", payload);
        break;
      case "chat.deleted":
        console.log("🗑️ Чат удален:", payload);
        break;
      default:
        console.log("🔔 Неизвестное событие WebSocket:", type, payload);
        break;
    }
  }, [messageHandlers]);

  // Основная функция подключения WebSocket
  const connectWebSocket = useCallback(() => {
    if (!FEATURES.WEBSOCKET_ENABLED) {
      console.log('⚠️ WebSocket отключен в конфигурации');
      return;
    }

    clearWsReconnectTimer();
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error("❌ Токен не найден в localStorage");
      setConnectionState('error');
      return;
    }

    const params = new URLSearchParams({ token });
    const url = `${WS_BASE_URL}?${params.toString()}`;

    console.log("🔗 Подключение к WebSocket:", url.replace(/token=[^&]+/, 'token=***'));
    setConnectionState('connecting');

    // Закрываем существующее соединение
    if (wsConnectionRef.current) {
      try {
        wsConnectionRef.current.onclose = null;
        wsConnectionRef.current.onerror = null;
        wsConnectionRef.current.close();
      } catch (err) {
        console.warn("⚠️ Ошибка закрытия предыдущего WebSocket:", err);
      }
    }

    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      console.error("❌ Ошибка создания WebSocket:", err);
      setConnectionState('error');
      scheduleWsReconnect();
      return;
    }

    wsConnectionRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket успешно подключен!");
      setIsConnected(true);
      setConnectionState('connected');
      
      // Отправляем тестовый ping через секунду
      setTimeout(() => {
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            console.log("📤 Отправлен ping");
          }
        } catch (e) {
          console.error("❌ Ошибка отправки ping:", e);
        }
      }, 1000);
    };

    socket.onmessage = (event) => {
      try {
        handleWsEnvelope(event.data);
      } catch (err) {
        console.error("❌ Ошибка обработки сообщения WebSocket:", err);
      }
    };

    socket.onerror = (err) => {
      console.error("❌ Ошибка WebSocket:", err);
      setConnectionState('error');
      try {
        socket.close();
      } catch (e) {
        console.warn("⚠️ Ошибка закрытия WebSocket при ошибке:", e);
      }
    };

    socket.onclose = (event) => {
      console.log(`🔚 WebSocket закрыт: код ${event.code}, причина: ${event.reason || 'не указана'}`);
      setIsConnected(false);
      setConnectionState('disconnected');
      wsConnectionRef.current = null;
      
      if (shouldReconnectWsRef.current) {
        scheduleWsReconnect();
      }
    };
  }, [clearWsReconnectTimer, scheduleWsReconnect, handleWsEnvelope]);

  // Функция отправки сообщений
  const sendMessage = useCallback((data: any) => {
    if (!wsConnectionRef.current || wsConnectionRef.current.readyState !== WebSocket.OPEN) {
      console.error("❌ WebSocket не подключен, сообщение не отправлено:", data);
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsConnectionRef.current.send(message);
      console.log("📤 Сообщение отправлено:", data);
      return true;
    } catch (error) {
      console.error("❌ Ошибка отправки сообщения:", error);
      return false;
    }
  }, []);

  // Функция ручного переподключения
  const reconnect = useCallback(() => {
    console.log("🔄 Ручное переподключение WebSocket");
    shouldReconnectWsRef.current = true;
    connectWebSocket();
  }, [connectWebSocket]);

  // Эффект для автоматического подключения при монтировании
  useEffect(() => {
    if (FEATURES.WEBSOCKET_ENABLED) {
      console.log("🚀 Инициализация WebSocket Provider");
      shouldReconnectWsRef.current = true;
      connectWebSocket();
    } else {
      console.log("⚠️ WebSocket отключен в конфигурации");
    }

    // Cleanup при размонтировании
    return () => {
      shouldReconnectWsRef.current = false;
      clearWsReconnectTimer();
      
      if (wsConnectionRef.current) {
        wsConnectionRef.current.onclose = null;
        wsConnectionRef.current.onerror = null;
        wsConnectionRef.current.close();
      }
    };
  }, [connectWebSocket, clearWsReconnectTimer]);

  const value: WebSocketContextType = {
    isConnected,
    lastMessage,
    connectionState,
    sendMessage,
    onMessage,
    offMessage,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};