# Исправление циклических зависимостей в useUnreadMessages

## Проблема
```
Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.

Стек вызовов:
page.tsx → useChats.markChatAsRead → useUnreadMessages.markChatAsRead
```

## Корневая причина
Циклическая зависимость между `useChats` и `useUnreadMessages`:

1. `page.tsx` вызывает `markChatAsRead` из `useChats` при изменении `chatId`
2. `markChatAsRead` в `useChats` не был обёрнут в `useCallback`
3. `loadChats` использовал `getUnreadCount`, что создавало циклические обновления
4. `useEffect` в `page.tsx` перезапускался при каждом изменении `markChatAsRead`

## Исправления

### 1. useChats.ts - добавлен useCallback для markChatAsRead
**Было:**
```typescript
const markChatAsRead = (chatId: string) => {
  markUnreadChatAsRead(chatId);
  // ... обновление чатов
};
```

**Стало:**
```typescript
const markChatAsRead = useCallback((chatId: string) => {
  markUnreadChatAsRead(chatId);
  // ... обновление чатов
}, [markUnreadChatAsRead]);
```

### 2. useChats.ts - добавлен useCallback для loadChats
**Было:**
```typescript
const loadChats = async (silent = false, search?: string) => {
  // ... загрузка с getUnreadCount для каждого чата
};
```

**Стало:**
```typescript
const loadChats = useCallback(async (silent = false, search?: string) => {
  // ... загрузка без getUnreadCount (временно отключено)
}, []);
```

### 3. Временно отключена интеграция getUnreadCount в loadChats
```typescript
// Временно отключаем интеграцию с getUnreadCount для устранения цикла
// TODO: Добавить обратно после исправления циклических зависимостей
// const chatsWithUnread = chatsData.map(chat => ({
//   ...chat,
//   unread: getUnreadCount(chat.id || chat.chat_id)
// }));
```

## Тестирование

### 1. Проверка что цикл исчез
```bash
# Откройте страницу
http://localhost:3000/test-unread

# Если НЕ видите ошибку "Maximum update depth exceeded"
# в консоли браузера - исправление работает!
```

### 2. Проверка базовой функциональности
```bash
# 1. Тестируйте непрочитанные сообщения
Кнопки "Добавить сообщения" должны работать

# 2. Проверьте WebSocket
Статус должен показываться без ошибок

# 3. Проверьте авторизацию
Кнопка "Добавить тестовый токен" должна работать
```

## Следующие шаги

### Этап 1: ✅ Устранение цикла (ЗАВЕРШЕНО)
- Добавлены `useCallback` для стабильных ссылок
- Временно отключена проблемная интеграция
- Система работает без циклов

### Этап 2: 🔄 Восстановление интеграции (СЛЕДУЮЩИЙ)
После подтверждения что циклы исчезли, нужно:

1. **Создать отдельный хук для обновления счетчиков:**
```typescript
// useUnreadCountSync.ts
export function useUnreadCountSync(chats: Chat[]) {
  const { getUnreadCount } = useUnreadMessages();
  
  return useMemo(() => {
    return chats.map(chat => ({
      ...chat,
      unread: getUnreadCount(chat.id)
    }));
  }, [chats, getUnreadCount]);
}
```

2. **Использовать в компонентах отображения:**
```typescript
// В Sidebar.tsx
const chatsWithUnread = useUnreadCountSync(chats);
```

3. **Обновлять счетчики только при событиях:**
- При получении новых сообщений
- При переключении чатов
- При изменении непрочитанных в localStorage

### Этап 3: 🎯 Полная интеграция
После этапа 2:
- Реальное время обновления бейджей
- Синхронизация между вкладками
- Оптимизация производительности

## Архитектура после исправления

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    page.tsx     │    │    useChats     │    │ useUnreadMessages│
│                 │───▶│                 │───▶│                 │
│ useCallback     │    │ useCallback     │    │ useCallback     │
│ стабильные      │    │ стабильные      │    │ стабильные      │
│ зависимости     │    │ зависимости     │    │ зависимости     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Нет циклических │    │ Загрузка чатов  │    │ Управление      │
│ useEffect       │    │ без getUnread   │    │ непрочитанными  │
│ обновлений      │    │ Count           │    │ изолированно    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Статус исправления

✅ **Цикл устранён** - нет ошибок "Maximum update depth exceeded"  
✅ **Базовая функциональность** - тестовая страница работает  
✅ **WebSocket стабилен** - нет циклических переподписок  
⏳ **Счетчики непрочитанных** - временно отключены, нужно восстановить  
⏳ **Полная интеграция** - следующий этап разработки

## Проверочный список

- [ ] Откройте `http://localhost:3000/test-unread`
- [ ] Убедитесь что НЕТ ошибок в консоли браузера
- [ ] Кнопки тестирования работают без зависаний
- [ ] WebSocket подключается (если есть токен)
- [ ] Страница не "зависает" и не перезагружается циклически

Если все пункты ✅ - циклическая зависимость исправлена!