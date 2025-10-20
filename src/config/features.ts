// src/config/features.ts
export const FEATURES = {
  // Временно отключаем WebSocket пока бэкенд не поддерживает его
  WEBSOCKET_ENABLED: false,
  
  // Интервал обновления сообщений в HTTP режиме (мс)
  HTTP_POLLING_INTERVAL: 5000,
  
  // Показывать ли уведомления о режиме работы
  SHOW_CONNECTION_STATUS: true,
} as const;