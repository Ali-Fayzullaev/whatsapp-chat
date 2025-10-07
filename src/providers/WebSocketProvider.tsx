// src/providers/WebSocketProvider.tsx
"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (data: any) => void;
  onMessage: (handler: (data: any) => void) => void;
  offMessage: (handler: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
  onMessage: () => {},
  offMessage: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<ReconnectingWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [messageHandlers, setMessageHandlers] = useState<((data: any) => void)[]>([]);

  // Функция для подписки на сообщения
  const onMessage = useCallback((handler: (data: any) => void) => {
    setMessageHandlers(prev => [...prev, handler]);
  }, []);

  // Функция для отписки от сообщений
  const offMessage = useCallback((handler: (data: any) => void) => {
    setMessageHandlers(prev => prev.filter(h => h !== handler));
  }, []);

  useEffect(() => {
    const ws = new ReconnectingWebSocket("wss://socket.eldor.kz/ws", [], {
      connectionTimeout: 4000,
      maxRetries: 10,
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
    });

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        setLastMessage(data);
        
        // Вызываем все зарегистрированные обработчики
        messageHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error('Error in WebSocket message handler:', error);
          }
        });
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [messageHandlers]); // ✅ Добавляем зависимость

  const sendMessage = (data: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  };

  return (
    <WebSocketContext.Provider
      value={{ 
        isConnected, 
        lastMessage, 
        sendMessage,
        onMessage,
        offMessage
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);