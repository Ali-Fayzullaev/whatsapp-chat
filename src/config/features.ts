// src/config/features.ts
export const FEATURES = {
  // Включаем WebSocket для работы в реальном времени
  WEBSOCKET_ENABLED: true,
  
  // Интервал обновления сообщений в HTTP режиме (мс) - fallback
  HTTP_POLLING_INTERVAL: 30000,
  
  // Показывать ли уведомления о режиме работы
  SHOW_CONNECTION_STATUS: true,
} as const;