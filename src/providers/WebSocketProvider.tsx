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
  startConnection: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  connectionState: 'disconnected',
  sendMessage: () => {},
  onMessage: () => {},
  offMessage: () => {},
  reconnect: () => {},
  startConnection: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);

  // Refs для WebSocket и обработчиков
  const wsConnectionRef = useRef<WebSocket | null>(null);
  const wsReconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectWsRef = useRef(true);
  const messageHandlersRef = useRef<Set<(data: any) => void>>(new Set());

  // Функции управления подписками
  const onMessage = useCallback((handler: (data: any) => void) => {
    messageHandlersRef.current.add(handler);
  }, []);

  const offMessage = useCallback((handler: (data: any) => void) => {
    messageHandlersRef.current.delete(handler);
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
    messageHandlersRef.current.forEach((handler: (data: any) => void) => {
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
  }, []);

  // Основная функция подключения WebSocket
  const connectWebSocket = useCallback(() => {
    if (!FEATURES.WEBSOCKET_ENABLED) {
      console.log('⚠️ WebSocket отключен в конфигурации');
      setConnectionState('disconnected');
      return;
    }

    clearWsReconnectTimer();
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log("ℹ️ Токен авторизации не найден - WebSocket ожидает авторизации");
      setConnectionState('disconnected');
      return;
    }

    const params = new URLSearchParams({ token });
    const url = `${WS_BASE_URL}?${params.toString()}`;

    console.log("🔗 Подключение к WebSocket:", url.replace(/token=[^&]+/, 'token=***'));
    console.log(`📋 WebSocket статус: WEBSOCKET_ENABLED=${FEATURES.WEBSOCKET_ENABLED}, URL=${WS_BASE_URL}`);
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
      console.log(`🔌 WebSocket статус подключения: readyState=${socket.readyState}`);
      setIsConnected(true);
      setConnectionState('connected');
      
      // Отправляем тестовый ping через секунду
      setTimeout(() => {
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            console.log("📤 Отправлен ping для проверки соединения");
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
      console.log(`🔌 WebSocket статус отключения: readyState=${socket.readyState}, wasClean=${event.wasClean}`);
      setIsConnected(false);
      setConnectionState('disconnected');
      wsConnectionRef.current = null;
      
      if (shouldReconnectWsRef.current) {
        console.log("🔄 Планируется автоматическое переподключение WebSocket...");
        scheduleWsReconnect();
      } else {
        console.log("⏹️ Автоматическое переподключение WebSocket отключено");
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

  // Эффект для отслеживания токена и автоматического подключения
  useEffect(() => {
    if (!FEATURES.WEBSOCKET_ENABLED) {
      console.log("⚠️ WebSocket отключен в конфигурации");
      return;
    }

    console.log("🚀 Инициализация WebSocket Provider");
    
    // Функция для проверки токена и подключения
    const checkTokenAndConnect = () => {
      const token = localStorage.getItem('auth_token');
      if (token && shouldReconnectWsRef.current) {
        console.log("🔑 Токен найден, подключаем WebSocket");
        connectWebSocket();
      } else if (!token) {
        console.log("⏳ Ожидаем авторизацию пользователя");
        setConnectionState('disconnected');
      }
    };

    // Проверяем токен при загрузке
    checkTokenAndConnect();

    // Отслеживаем изменения в localStorage (когда пользователь авторизуется)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log("🔄 Изменение токена авторизации");
        checkTokenAndConnect();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    shouldReconnectWsRef.current = true;

    // Cleanup при размонтировании
    return () => {
      shouldReconnectWsRef.current = false;
      clearWsReconnectTimer();
      window.removeEventListener('storage', handleStorageChange);
      
      if (wsConnectionRef.current) {
        wsConnectionRef.current.onclose = null;
        wsConnectionRef.current.onerror = null;
        wsConnectionRef.current.close();
      }
    };
  }, [connectWebSocket, clearWsReconnectTimer]);

  // Функция для запуска подключения после авторизации
  const startConnection = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      console.log("🚀 Запуск WebSocket соединения после авторизации");
      shouldReconnectWsRef.current = true;
      connectWebSocket();
    }
  }, [connectWebSocket]);

  const value: WebSocketContextType = {
    isConnected,
    lastMessage,
    connectionState,
    sendMessage,
    onMessage,
    offMessage,
    reconnect,
    startConnection,
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