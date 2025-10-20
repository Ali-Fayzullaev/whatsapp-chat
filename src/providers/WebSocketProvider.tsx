// src/providers/WebSocketProvider.tsx
"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { apiConfig } from "@/lib/api-config";
import { FEATURES } from "@/config/features";

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
  const [socket, setSocket] = useState<ReconnectingWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [messageHandlers, setMessageHandlers] = useState<((data: any) => void)[]>([]);

  const onMessage = useCallback((handler: (data: any) => void) => {
    setMessageHandlers(prev => [...prev, handler]);
  }, []);

  const offMessage = useCallback((handler: (data: any) => void) => {
    setMessageHandlers(prev => prev.filter(h => h !== handler));
  }, []);

  // Функция для инициализации WebSocket соединения
  const initWebSocket = useCallback(async () => {
    try {
      console.log("=== INITIALIZING WEBSOCKET ===");
      setConnectionState('connecting');
      
      // Проверим, поддерживает ли сервер WebSocket
      let wsUrl: string;
      let tokenAvailable = false;
      
      try {
        console.log("🔍 Checking WebSocket token availability...");
        const tokenRes = await fetch('/api/whatsapp/websocket/token');
        
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          wsUrl = tokenData.url || apiConfig.getWebSocketUrl();
          if (tokenData.token) {
            wsUrl += `?token=${tokenData.token}`;
            tokenAvailable = true;
          } else {
            wsUrl += `?token=${apiConfig.getAccessToken()}`;
          }
          console.log("✅ WebSocket token obtained successfully");
        } else {
          console.warn(`⚠️ WebSocket token API not available (${tokenRes.status}), trying direct connection`);
          wsUrl = apiConfig.getWebSocketUrlWithToken();
        }
      } catch (error) {
        console.warn("⚠️ Failed to get WebSocket token, using direct connection:", error);
        wsUrl = apiConfig.getWebSocketUrlWithToken();
      }

      console.log("🔗 WebSocket URL:", wsUrl.replace(/token=[^&]+/, 'token=***'));
      
      // Попытка тестового подключения
      console.log("🧪 Testing WebSocket connection...");

      const ws = new ReconnectingWebSocket(wsUrl, [], {
        connectionTimeout: 8000,
        maxRetries: 3, // Уменьшаем количество попыток
        maxReconnectionDelay: 60000,
        minReconnectionDelay: 2000,
        debug: false, // Отключаем debug чтобы уменьшить шум в консоли
      });

      // Таймер для определения "мертвого" подключения
      let connectionAttemptTimer: NodeJS.Timeout | null = null;

      ws.onopen = () => {
        console.log("✅ WebSocket connected successfully");
        setIsConnected(true);
        setConnectionState('connected');
        if (connectionAttemptTimer) {
          clearTimeout(connectionAttemptTimer);
          connectionAttemptTimer = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 WebSocket message received:", data);
          setLastMessage(data);
          
          // Уведомляем всех подписчиков
          messageHandlers.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error('❌ Error in WebSocket message handler:', error);
            }
          });
        } catch (error) {
          console.error("❌ WebSocket message parse error:", error, "Raw data:", event.data);
        }
      };

      ws.onclose = (event) => {
        console.log(`❌ WebSocket disconnected: ${event.code} ${event.reason || '(no reason)'}`);
        setIsConnected(false);
        
        // Определяем тип отключения
        if (event.code === 1006) {
          console.log("🔍 Connection lost (abnormal closure)");
          setConnectionState('error');
        } else if (event.code === 1000) {
          console.log("✋ Normal closure");
          setConnectionState('disconnected');
        } else {
          console.log(`⚠️ Unexpected close code: ${event.code}`);
          setConnectionState('error');
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setIsConnected(false);
        setConnectionState('error');
      };

      // Таймер для отслеживания долгих попыток подключения
      connectionAttemptTimer = setTimeout(() => {
        if (!isConnected && connectionState === 'connecting') {
          console.log("⏰ WebSocket connection timeout - server may not support WebSocket");
          setConnectionState('error');
          ws.close();
        }
      }, 15000);

      setSocket(ws);

      return ws;
    } catch (error) {
      console.error("❌ Failed to initialize WebSocket:", error);
      setIsConnected(false);
      setConnectionState('error');
      
      // Показываем пользователю, что WebSocket недоступен
      console.log("🔄 WebSocket unavailable - application will work in HTTP-only mode");
      return null;
    }
  }, [messageHandlers]);

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