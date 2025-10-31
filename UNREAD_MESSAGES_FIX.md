# Исправление системы непрочитанных сообщений и WebSocket

## Проблемы, которые были решены

### 1. Непрочитанные сообщения не отображались
**Проблема:** Хук `useUnreadMessages` существовал, но не был интегрирован с системой чатов.

**Решение:**
- Интегрировали `useUnreadMessages` в хук `useChats`
- Добавили автоматическое обновление счетчика непрочитанных при получении новых сообщений
- Подключили систему к WebSocket обработчикам для реального времени

### 2. WebSocket диагностика и мониторинг
**Проблема:** Не было возможности проверить состояние WebSocket подключения.

**Решение:**
- Создали компонент `WebSocketDebug` для диагностики
- Добавили в главное меню пункт "WebSocket диагностика"
- Реализовали отображение состояния подключения в реальном времени

## Изменённые файлы

### `src/hooks/useChats.ts`
```typescript
// Добавлены импорты
import { useUnreadMessages } from "./useUnreadMessages";

// Интеграция с системой непрочитанных сообщений
const { 
  addUnreadMessage, 
  markChatAsRead: markUnreadChatAsRead, 
  getUnreadCount 
} = useUnreadMessages();

// Обновлён обработчик новых сообщений
const handleNewMessage = useCallback((chatId: string, message: Message) => {
  if (message.author === 'them' && message.id) {
    addUnreadMessage(message.id, chatId);
  }
  // ... остальная логика с актуальным getUnreadCount()
}, [addUnreadMessage, getUnreadCount]);

// Обновлена функция пометки как прочитанное
const markChatAsRead = (chatId: string) => {
  markUnreadChatAsRead(chatId);  // Интеграция с useUnreadMessages
  // ... остальная логика
};

// Обновлена загрузка чатов с учётом непрочитанных
const loadChats = async (silent = false, search?: string) => {
  // ...
  const chatsWithUnread = chatsData.map(chat => ({
    ...chat,
    unread: getUnreadCount(chat.id || chat.chat_id)
  }));
  // ...
};
```

### `src/hooks/useMessages.ts`
```typescript
// Добавлен импорт
import { useUnreadMessages } from "./useUnreadMessages";

// Интеграция с системой непрочитанных сообщений
const { addUnreadMessage } = useUnreadMessages();

// Обновлён обработчик новых сообщений
const handleNewMessage = useCallback((receivedChatId: string, message: Message) => {
  // Добавляем в непрочитанные, если не в текущем чате
  if (message.author === 'them' && message.id && receivedChatId !== chatId) {
    addUnreadMessage(message.id, receivedChatId);
  }
  // ... остальная логика
}, [chatId, addUnreadMessage]);
```

### `src/components/WebSocketDebug.tsx` (новый файл)
- Компонент для диагностики WebSocket соединения
- Отображение статуса подключения
- Кнопки для переподключения и отправки тестовых сообщений
- Просмотр последних полученных сообщений

### `src/components/chat/menus.tsx`
```typescript
// Добавлены импорты
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WebSocketDebug } from "@/components/WebSocketDebug";

// Добавлен пункт меню и диалог
<DropdownMenuItem onClick={() => setDebugDialogOpen(true)}>
  WebSocket диагностика
</DropdownMenuItem>

<Dialog open={debugDialogOpen} onOpenChange={setDebugDialogOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>WebSocket диагностика</DialogTitle>
    </DialogHeader>
    <WebSocketDebug />
  </DialogContent>
</Dialog>
```

### `src/app/test-unread/page.tsx` (новый файл)
- Тестовая страница для проверки системы непрочитанных сообщений
- Интерфейс для добавления тестовых сообщений
- Отображение статистики и сырых данных
- Интеграция с WebSocket диагностикой

## Как проверить исправления

1. **Перейти на тестовую страницу:**
   - Откройте `http://localhost:3000/test-unread`

2. **Проверить WebSocket диагностику:**
   - В главном меню выберите "WebSocket диагностика"
   - Проверьте статус подключения
   - Попробуйте переподключиться

3. **Проверить непрочитанные сообщения:**
   - На тестовой странице добавьте сообщения
   - Проверьте, что счётчик обновляется
   - Пометьте чат как прочитанный

4. **Проверить интеграцию в реальном приложении:**
   - Откройте основной чат
   - При переключении между чатами счётчики должны обнуляться
   - При получении новых сообщений (через WebSocket) должны появляться бейджи

## Архитектура решения

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │───▶│   useChats      │───▶│   Sidebar       │
│   Provider      │    │                 │    │   (отображение) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ useUnreadMessages│
                       │  (localStorage)  │
                       └─────────────────┘
                                │
                                ▼ 
                       ┌─────────────────┐
                       │   useMessages   │
                       │ (текущий чат)   │
                       └─────────────────┘
```

## Конфигурация WebSocket

WebSocket настроен для подключения к `wss://socket.eldor.kz/api/ws` с токеном авторизации. Состояние подключения отслеживается и автоматически переподключается при разрыве соединения.

## Состояние системы

✅ **Завершено:**
- Интеграция системы непрочитанных сообщений
- WebSocket диагностика
- Автоматическое обновление счётчиков
- Пометка чатов как прочитанные при переключении

🔄 **Работает в реальном времени:**
- Получение новых сообщений через WebSocket
- Обновление бейджей непрочитанных сообщений
- Синхронизация между вкладками через localStorage

📱 **Поддерживается:**
- Мобильная и десктопная версии
- Тёмная и светлая темы
- Локализация на русском языке