// src/config/features.ts
export const FEATURES = {
  // Отключаем WebSocket так как сервер его не поддерживает
  WEBSOCKET_ENABLED: false,
  
  // Интервал обновления сообщений в HTTP режиме (мс)
  HTTP_POLLING_INTERVAL: 5000,
  
  // Показывать ли уведомления о режиме работы
  SHOW_CONNECTION_STATUS: false,
} as const;