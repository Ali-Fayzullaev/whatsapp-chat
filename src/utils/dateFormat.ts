// src/utils/dateFormat.ts
export function formatMessageTime(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  // Проверяем, сегодня ли это сообщение
  const isToday = date.toDateString() === now.toDateString();
  
  // Проверяем, вчера ли это сообщение
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    // Если сегодня - показываем только время
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (isYesterday) {
    // Если вчера - показываем "Вчера"
    return 'Вчера';
  } else {
    // Если раньше - показываем дату
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      // Если меньше недели - показываем день недели
      return date.toLocaleDateString('ru-RU', { weekday: 'long' });
    } else {
      // Если больше недели - показываем дату
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit',
        year: diffDays < 365 ? undefined : '2-digit'
      });
    }
  }
}

export function formatChatTime(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  // Проверяем, сегодня ли это сообщение
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    // Если сегодня - показываем только время
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    // Если не сегодня - показываем дату
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit'
      });
    }
  }
}