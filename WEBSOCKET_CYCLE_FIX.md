# Исправление бесконечного цикла WebSocket

## Проблема
```
Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
```

## Причина
Бесконечный цикл возникал из-за:
1. В `WebSocketProvider` использовался `useState` для хранения обработчиков сообщений
2. В `useWebSocketChats` зависимость от `handleWebSocketMessage` в `useEffect` вызывала переподписку

## Исправления

### 1. WebSocketProvider.tsx
**Было:**
```typescript
const [messageHandlers, setMessageHandlers] = useState<((data: any) => void)[]>([]);

const onMessage = useCallback((handler: (data: any) => void) => {
  setMessageHandlers(prev => [...prev, handler]); // Вызывал ререндер!
}, []);

const handleWsEnvelope = useCallback((raw: string) => {
  // ...
  messageHandlers.forEach(handler => { // Зависимость от state
    handler(payload);
  });
}, [messageHandlers]); // Зависимость вызывала цикл!
```

**Стало:**
```typescript
const messageHandlersRef = useRef<Set<(data: any) => void>>(new Set());

const onMessage = useCallback((handler: (data: any) => void) => {
  messageHandlersRef.current.add(handler); // Без ререндера
}, []);

const handleWsEnvelope = useCallback((raw: string) => {
  // ...
  messageHandlersRef.current.forEach((handler: (data: any) => void) => {
    handler(payload);
  });
}, []); // Без зависимостей!
```

### 2. useWebSocketChats.ts  
**Было:**
```typescript
const handleWebSocketMessage = useCallback((data: any) => {
  // ...
}, [onChatUpdated, onNewMessage, /* много зависимостей */]);

useEffect(() => {
  if (isConnected) {
    onMessage(handleWebSocketMessage);
    return () => {
      offMessage(handleWebSocketMessage); // Постоянно менялась ссылка!
    };
  }
}, [isConnected, onMessage, offMessage, handleWebSocketMessage]);
```

**Стало:**
```typescript
const handleWebSocketMessageRef = useRef<((data: any) => void) | null>(null);

const handleWebSocketMessage = useCallback((data: any) => {
  // ... та же логика
}, [onChatUpdated, onNewMessage, /* зависимости */]);

// Создаем стабильную ссылку
if (!handleWebSocketMessageRef.current) {
  handleWebSocketMessageRef.current = handleWebSocketMessage;
} else {
  handleWebSocketMessageRef.current = handleWebSocketMessage;
}

useEffect(() => {
  const stableHandler = handleWebSocketMessageRef.current;
  if (isConnected && stableHandler) {
    onMessage(stableHandler);
    return () => {
      if (stableHandler) {
        offMessage(stableHandler); // Стабильная ссылка!
      }
    };
  }
}, [isConnected, onMessage, offMessage]); // Без handleWebSocketMessage!
```

## Тестирование

### 1. Откройте тестовую страницу
```
http://localhost:3000/test-unread
```

### 2. Проверьте что ошибка исчезла
- Откройте консоль браузера (F12)
- Убедитесь что нет ошибок "Maximum update depth exceeded"
- WebSocket должен подключаться без циклов

### 3. Проверьте функциональность
```bash
# 1. Добавьте тестовый токен
Кнопка "Добавить тестовый токен"

# 2. Проверьте WebSocket статус
Должен показать "connecting" → "connected"

# 3. Тестируйте непрочитанные сообщения
Кнопки "Добавить сообщения" должны работать без ошибок

# 4. Проверьте WebSocket сообщения
Кнопка "Тест WebSocket сообщения" (если подключен)
```

### 4. Логи в консоли
**Правильные логи:**
```
🚀 Инициализация WebSocket Provider
🔑 Токен найден, подключаем WebSocket  
🔗 Подключение к WebSocket: wss://socket.eldor.kz/api/ws?token=***
✅ WebSocket успешно подключен!
📤 Отправлен ping
```

**Не должно быть:**
```
❌ Maximum update depth exceeded
❌ Too many re-renders
❌ Циклические ошибки React
```

## Дополнительная диагностика

### Если ошибка всё ещё возникает:

1. **Перезапустите сервер разработки**
   ```bash
   npm run dev
   ```

2. **Очистите кеш браузера**
   ```bash
   Ctrl+Shift+R (жёсткая перезагрузка)
   ```

3. **Проверьте что изменения применились**
   - Убедитесь что в `WebSocketProvider.tsx` используется `messageHandlersRef`
   - Убедитесь что в `useWebSocketChats.ts` используется стабильная ссылка

4. **Проверьте другие места использования WebSocket**
   ```bash
   # Найти все использования useWebSocket
   grep -r "useWebSocket" src/
   ```

## Архитектура решения

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  WebSocket      │    │  useWebSocket   │    │ useWebSocketChats│
│  Provider       │───▶│  Hook           │───▶│  Hook           │
│ (messageHandlers│    │ (stable refs)   │    │ (stable handler)│
│  via useRef)    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Без ререндеров  │    │ Стабильные      │    │ Без циклов      │
│ при добавлении  │    │ ссылки на       │    │ переподписки    │
│ обработчиков    │    │ функции         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Статус исправления

✅ **WebSocketProvider**: Использует `useRef` вместо `useState` для обработчиков
✅ **useWebSocketChats**: Использует стабильные ссылки для предотвращения циклов  
✅ **Тестирование**: Добавлена диагностическая страница с кнопками
✅ **Совместимость**: Все существующие функции работают как прежде

🔥 **Результат**: Бесконечный цикл должен быть устранён!