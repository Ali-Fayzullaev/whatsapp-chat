// src/providers/WebSocketProvider.tsx
"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { FEATURES } from "@/config/features";

// Константы как у друга
const WS_RECONNECT_DELAY = 5000;

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

  // Refs для WebSocket как у друга
  const wsConnectionRef = useRef<WebSocket | null>(null);
  const wsReconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectWsRef = useRef(true);

  const onMessage = useCallback((handler: (data: any) => void) => {
    setMessageHandlers(prev => [...prev, handler]);
  }, []);

  const offMessage = useCallback((handler: (data: any) => void) => {
    setMessageHandlers(prev => prev.filter(h => h !== handler));
  }, []);

  // Функции как у друга
  const clearWsReconnectTimer = useCallback(() => {
    if (wsReconnectTimerRef.current) {
      clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
    }
  }, []);

  const scheduleWsReconnect = useCallback(() => {
    if (!shouldReconnectWsRef.current) return;
    if (wsReconnectTimerRef.current) return;
    
    wsReconnectTimerRef.current = setTimeout(() => {
      wsReconnectTimerRef.current = null;
      connectWebSocket();
    }, WS_RECONNECT_DELAY);
  }, []);

  // Обработка сообщений как у друга
  const handleWsEnvelope = useCallback((raw: any) => {
    if (!raw) return;
    let payload;
    try {
      payload = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (err) {
      console.error("Failed to parse WS payload", err);
      return;
    }
    if (!payload || typeof payload !== "object") return;

    console.log("� WebSocket message received:", payload);
    setLastMessage(payload);
    
    // Уведомляем всех подписчиков
    messageHandlers.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error('❌ Error in WebSocket message handler:', error);
      }
    });

    // Можно добавить обработку специфичных событий
    const type = payload.type;
    const chatId = payload.chat_id || payload.chatId || null;
    const data = payload.data || {};

    switch (type) {
      case "ws.ready":
        console.debug("WS ready", payload.meta || {});
        break;
      case "message.created":
      case "message.updated":
      case "message.deleted":
      case "chat.deleted":
        console.debug(`WebSocket event: ${type}`, { chatId, data });
        break;
      default:
        console.debug("Unknown WebSocket event:", type);
        break;
    }
  }, [messageHandlers]);

  // Основная функция подключения как у друга
  const connectWebSocket = useCallback(() => {
    clearWsReconnectTimer();
    
    const token = apiConfig.getAccessToken();
    if (!token) {
      console.error("❌ No authentication token found");
      setConnectionState('error');
      return;
    }

    const params = new URLSearchParams({ token });
    const url = `${WS_BASE}/api/ws?${params.toString()}`;
    
    console.log("🔗 WebSocket connecting to:", url.replace(/token=[^&]+/, 'token=***'));
    setConnectionState('connecting');

    if (wsConnectionRef.current) {
      try {
        wsConnectionRef.current.onclose = null;
        wsConnectionRef.current.onerror = null;
        wsConnectionRef.current.close();
      } catch (err) {
        console.warn("Failed to close previous WS", err);
      }
    }

    let socket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      console.error("WebSocket init error", err);
      setConnectionState('error');
      scheduleWsReconnect();
      return;
    }

    wsConnectionRef.current = socket;

    socket.onopen = () => {
      console.info("✅ WebSocket connected", url.replace(/token=[^&]+/, 'token=***'));
      setIsConnected(true);
      setConnectionState('connected');
    };

    socket.onmessage = (event) => {
      try {
        handleWsEnvelope(event.data);
      } catch (err) {
        console.error("WS message handling failed", err);
      }
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error", err);
      setIsConnected(false);
      setConnectionState('error');
      try {
        socket.close();
      } catch (e) {
        console.warn("WebSocket close error", e);
      }
    };

    socket.onclose = (event) => {
      console.log(`🔚 WebSocket closed: ${event.code} - ${event.reason || 'no reason'}`);
      wsConnectionRef.current = null;
      setIsConnected(false);
      setConnectionState('disconnected');
      
      if (shouldReconnectWsRef.current) {
        scheduleWsReconnect();
      }
    };
  }, [clearWsReconnectTimer, scheduleWsReconnect, handleWsEnvelope]);

  const shutdownRealtime = useCallback(() => {
    shouldReconnectWsRef.current = false;
    clearWsReconnectTimer();
    
    const socket = wsConnectionRef.current;
    wsConnectionRef.current = null;
    if (socket) {
      try {
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
      } catch (err) {
        console.warn("WS close during shutdown failed", err);
      }
    }
    setIsConnected(false);
    setConnectionState('disconnected');
  }, [clearWsReconnectTimer]);

  // Функция для принудительного переподключения
  const reconnect = useCallback(() => {
    if (!FEATURES.WEBSOCKET_ENABLED) {
      console.log("📡 WebSocket отключен в конфигурации");
      return;
    }
    
    console.log("🔄 Manual WebSocket reconnection triggered");
    if (socket) {
      socket.close();
    }
    // initWebSocket будет вызвано автоматически через useEffect
  }, [socket]);

  useEffect(() => {
    // Проверяем, включен ли WebSocket в конфигурации
    if (!FEATURES.WEBSOCKET_ENABLED) {
      console.log("📡 WebSocket отключен в конфигурации - работаем в HTTP-режиме");
      setIsConnected(false);
      setConnectionState('disconnected');
      return;
    }

    const ws = initWebSocket();
    
    return () => {
      if (ws) {
        ws.then(websocket => {
          if (websocket) {
            websocket.close();
          }
        });
      }
    };
  }, [initWebSocket]);

  const sendMessage = useCallback((data: any) => {
    if (socket && isConnected) {
      try {
        const message = JSON.stringify(data);
        console.log("📤 Sending WebSocket message:", data);
        socket.send(message);
      } catch (error) {
        console.error("❌ Failed to send WebSocket message:", error);
      }
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message. Connection status:', {
        hasSocket: !!socket,
        isConnected
      });
    }
  }, [socket, isConnected]);

  return (
    <WebSocketContext.Provider
      value={{ 
        isConnected, 
        lastMessage, 
        connectionState,
        sendMessage,
        onMessage,
        offMessage,
        reconnect
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);