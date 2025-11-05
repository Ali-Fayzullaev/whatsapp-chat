// src/providers/WebSocketProvider.tsx
"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { FEATURES } from "@/config/features";

// Константы для WebSocket
const WS_RECONNECT_DELAY = 3000; // Уменьшили до 3 секунд
const WS_BASE_URL = "wss://socket.eldor.kz/api/ws";
const MAX_RECONNECT_ATTEMPTS = 10; // Максимум попыток переподключения
const INITIAL_RETRY_DELAY = 1000; // Начальная задержка retry
const HEARTBEAT_INTERVAL = 30000; // Heartbeat каждые 30 секунд

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
  const reconnectAttemptsRef = useRef(0);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Управление heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    
    heartbeatTimerRef.current = setInterval(() => {
      if (wsConnectionRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsConnectionRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          console.log("💓 Heartbeat ping отправлен");
        } catch (error) {
          console.error("❌ Ошибка отправки heartbeat:", error);
        }
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  // Планирование переподключения с экспоненциальной задержкой
  const scheduleWsReconnect = useCallback(() => {
    if (!shouldReconnectWsRef.current) return;
    if (wsReconnectTimerRef.current) return;
    
    reconnectAttemptsRef.current += 1;
    
    if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
      console.error(`❌ Максимальное количество попыток переподключения (${MAX_RECONNECT_ATTEMPTS}) достигнуто`);
      setConnectionState('error');
      return;
    }
    
    // Экспоненциальная задержка: 1s, 2s, 4s, 8s, но не больше WS_RECONNECT_DELAY
    const delay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1), 
      WS_RECONNECT_DELAY
    );
    
    console.log(`🔄 Планируется переподключение WebSocket (попытка ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}) через ${delay}ms`);
    
    wsReconnectTimerRef.current = setTimeout(() => {
      wsReconnectTimerRef.current = null;
      connectWebSocket();
    }, delay);
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
      
      // Сбрасываем счетчик попыток при успешном подключении
      reconnectAttemptsRef.current = 0;
      
      setIsConnected(true);
      setConnectionState('connected');
      
      // Запускаем heartbeat
      startHeartbeat();
      
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
      
      // Останавливаем heartbeat
      stopHeartbeat();
      
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
    reconnectAttemptsRef.current = 0; // Сбрасываем счетчик при ручном переподключении
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
    
    // Функция для проверки токена и подключения с задержкой
    const checkTokenAndConnect = (attempt = 1) => {
      const token = localStorage.getItem('auth_token');
      
      console.log(`🔍 Проверка токена (попытка ${attempt}):`, token ? 'найден' : 'не найден');
      
      if (token && shouldReconnectWsRef.current) {
        console.log("🔑 Токен найден, подключаем WebSocket");
        // Небольшая задержка для стабильности
        setTimeout(() => {
          connectWebSocket();
        }, 100);
      } else if (!token) {
        console.log("⏳ Токен не найден");
        setConnectionState('disconnected');
        
        // Повторная проверка токена (максимум 5 попыток с интервалом 1 секунда)
        if (attempt < 5) {
          console.log(`⏰ Повторная проверка токена через 1 секунду (попытка ${attempt + 1}/5)`);
          setTimeout(() => {
            checkTokenAndConnect(attempt + 1);
          }, 1000);
        } else {
          console.log("⏹️ Максимальное количество попыток проверки токена достигнуто");
        }
      }
    };

    // Задержка для загрузки DOM и localStorage, а также чтобы дать время для первичной загрузки данных
    const initTimer = setTimeout(() => {
      checkTokenAndConnect();
    }, 2000); // Увеличиваем до 2 секунд

    // Отслеживаем изменения в localStorage (когда пользователь авторизуется)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log("🔄 Изменение токена авторизации");
        setTimeout(() => {
          checkTokenAndConnect();
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    shouldReconnectWsRef.current = true;

    // Cleanup при размонтировании
    return () => {
      clearTimeout(initTimer);
      shouldReconnectWsRef.current = false;
      clearWsReconnectTimer();
      stopHeartbeat();
      window.removeEventListener('storage', handleStorageChange);
      
      if (wsConnectionRef.current) {
        wsConnectionRef.current.onclose = null;
        wsConnectionRef.current.onerror = null;
        wsConnectionRef.current.close();
      }
    };
  }, [connectWebSocket, clearWsReconnectTimer, startHeartbeat, stopHeartbeat]);

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