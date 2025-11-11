// src/lib/api-client.ts
import { apiConfig } from "./api-config";
import { dataCache } from "./cache";
import type { Chat, Message } from "@/components/chat/types";
// Кэшированный fetch с автоматической инвалидацией
async function cachedFetch<T>(
  url: string, 
  cacheKey: string, 
  options?: RequestInit,
  ttl = 5 * 60 * 1000
): Promise<T> {
  // Проверяем кэш
  const cached = dataCache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${apiConfig.getAccessToken()}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  const data = await response.json();
  // Сохраняем в кэш
  dataCache.set(cacheKey, data, ttl);
  return data;
}
export class ApiClient {
  // Инвалидация кеша для чатов
  static invalidateChatsCache() {
    dataCache.invalidate('chats');
    // Также очищаем кеш поиска
    dataCache.invalidatePattern('chats_search_');
  }

  // Инвалидация кеша для сообщений конкретного чата
  static invalidateMessagesCache(chatId: string) {
    dataCache.invalidate(`messages-${chatId}`);
  }

  // Получение списка чатов с кэшированием
  static async getChats(search?: string): Promise<Chat[]> {
    // Формируем параметры запроса
    const params = new URLSearchParams();
    params.set('limit', '100'); // Устанавливаем лимит 100
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    const url = `/api/whatsapp/chats?${params.toString()}`;
    const cacheKey = search ? `chats_search_${search}` : 'chats';
    const data = await cachedFetch<any[]>(
      url,
      cacheKey,
      { cache: "no-store" },
      search ? 30 * 1000 : 2 * 60 * 1000 // Увеличиваем кеш: 30с для поиска, 2мин для обычных чатов
    );
    return data.map((raw: any, i: number) => {
      const rawId = raw?.chat_id || raw?.id;
      const id = rawId ? String(rawId) : `temp-${i}`;
      let phone = raw?.phone || raw?.id || raw?.chat_id || "";
      phone = String(phone).replace("@c.us", "");
      const name = phone || `Чат ${id}`;
      const ts = typeof raw?.updated_at === "number"
        ? raw.updated_at * 1000
        : raw?.updated_at
        ? Date.parse(raw.updated_at)
        : typeof raw?.timestamp === "number"
        ? raw.timestamp * 1000
        : raw?.timestamp
        ? Date.parse(raw.timestamp)
        : Date.now();
      return {
        id,
        chat_id: raw?.chat_id || id,
        is_group: raw?.is_group || false,
        name,
        phone,
        lastMessage: raw?.last_message || raw?.text || "",
        time: new Date(ts).toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        unread: raw?.unread_count || 0,
        avatarFallback: name?.slice(0, 2).toUpperCase() || "?",
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
        updatedAt: ts,
      };
    }).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }
  // Получение сообщений чата с кэшированием
  static async getChatMessages(chatId: string): Promise<Message[]> {
    if (chatId.startsWith("temp:")) {
      return [];
    }
    const data = await cachedFetch<any>(
      `/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages`,
      `messages-${chatId}`,
      { cache: "no-store" },
      60 * 1000 // 1 минута кэш для сообщений
    );
    let messagesArray: any[] = [];
    if (Array.isArray(data)) {
      messagesArray = data;
    } else if (data && Array.isArray(data.items)) {
      messagesArray = data.items;
    } else if (data && typeof data === "object") {
      messagesArray = Object.values(data).filter(Array.isArray).flat();
    }
    const seenIds = new Set<string>();
    const messages: Message[] = [];
    messagesArray.forEach((msg: any, index: number) => {
      const baseId = msg.id_message || msg.id || msg.message_ref || msg._id || `msg-${index}-${Date.now()}`;
      if (seenIds.has(baseId)) return;
      seenIds.add(baseId);
      const timestamp = msg.timestamp || msg.created_at || msg.date || Date.now();
      const ts = typeof timestamp === "number" ? timestamp * 1000 : 
                 typeof timestamp === "string" ? Date.parse(timestamp) : Date.now();
      const direction = msg.direction || msg.type || "in";
      const isFromMe = direction === "out" || msg.from_me === true;
      // Обрабатываем данные отправителя для групп
      let senderInfo = undefined;
      if (!isFromMe && msg.sender) {
        if (typeof msg.sender === 'string') {
          senderInfo = {
            id: msg.sender,
            name: msg.sender.replace('@c.us', '').replace(/^\+/, ''),
            full_name: msg.sender_name || msg.pushname || null
          };
        } else if (typeof msg.sender === 'object') {
          senderInfo = {
            id: msg.sender.id || msg.sender.phone || '',
            name: msg.sender.name || msg.sender.pushname || '',
            full_name: msg.sender.full_name || msg.sender.pushname || msg.sender.name || null
          };
        }
      } else if (!isFromMe && (msg.from || msg.participant)) {
        // Альтернативные поля для отправителя в группах
        const senderId = msg.from || msg.participant;
        senderInfo = {
          id: senderId,
          name: msg.pushname || msg.sender_name || senderId.replace('@c.us', '').replace(/^\+/, ''),
          full_name: msg.pushname || msg.sender_name || null
        };
      }

      const message: Message = {
        id: baseId,
        chatId,
        author: isFromMe ? "me" : "them",
        text: msg.text || msg.body || "",
        time: new Date(ts).toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: ts,
        status: msg.status || "sent",
        isRead: true,
        sender: senderInfo,
        direction: direction,
        timestamp: msg.timestamp,
        id_message: msg.id_message
      };
      // Обработка медиа
      if (msg.media) {
        message.media = {
          url: msg.media.url,
          type: msg.media.type || "document",
          name: msg.media.name,
          size: msg.media.size,
          mime: msg.media.mime,
        };
        // Обновляем текст для медиа
        if (!message.text) {
          switch (message.media.type) {
            case "image": message.text = "📷 Изображение"; break;
            case "video": message.text = "🎥 Видео"; break;
            case "audio": message.text = "🎵 Аудио"; break;
            default: message.text = `📄 ${message.media.name || "Документ"}`;
          }
        }
      }
      messages.push(message);
    });
    return messages.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  }
  // Отправка сообщения
  static async sendMessage(chatId: string, text: string, replyTo?: any): Promise<any> {
    // Инвалидируем кэш сообщений для этого чата
    dataCache.invalidate(`messages-${chatId}`);
    dataCache.invalidate("chats");
    const replyId = replyTo?.id || replyTo;
    const response = await fetch(`/api/whatsapp/chats/${encodeURIComponent(chatId)}/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiConfig.getAccessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        reply_to: replyId,
      }),
    });
    if (!response.ok) {
      throw new Error(`Send message error: ${response.status}`);
    }
    return response.json();
  }
  // Отправка медиа-сообщения
  static async sendMediaMessage(chatId: string, mediaUrl: string, caption?: string, replyTo?: any): Promise<any> {
    // Инвалидируем кэш сообщений для этого чата
    dataCache.invalidate(`messages-${chatId}`);
    dataCache.invalidate("chats");
    const response = await fetch(`/api/whatsapp/send-media-temp`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiConfig.getAccessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        media_url: mediaUrl,
        caption: caption || "",
        reply_to: replyTo?.id || replyTo,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Send media error response:', errorText);
      throw new Error(`Send media message error: ${response.status} - ${errorText}`);
    }
    return response.json();
  }
  // Удаление чата
  static async deleteChat(chatId: string): Promise<any> {
    dataCache.invalidate("chats");
    dataCache.invalidate(`messages-${chatId}`);
    const response = await fetch(`/api/whatsapp/chats/${encodeURIComponent(chatId)}/delete`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${apiConfig.getAccessToken()}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete chat error response:', errorText);
      throw new Error(`Delete chat error: ${response.status} - ${errorText}`);
    }
    return response.json();
  }
  // Создание нового чата
  static async startChat(phone: string): Promise<any> {
    dataCache.invalidate("chats");
    const response = await fetch("/api/whatsapp/chats/start", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiConfig.getAccessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });
    if (!response.ok) {
      // Пытаемся получить детали ошибки из ответа
      let errorMessage = `Start chat error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((d: any) => d.msg).join(", ");
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Если не удалось распарсить JSON ошибки, используем стандартное сообщение
      }
      throw new Error(errorMessage);
    }
    const result = await response.json();
    // Проверяем что результат содержит chat_id
    if (!result || typeof result !== 'object') {
      throw new Error("Получен некорректный ответ от сервера");
    }
    return result;
  }
  // Удаление сообщения
  static async deleteMessage(chatId: string, messageId: string, remote = false): Promise<void> {
    dataCache.invalidate(`messages-${chatId}`);
    const url = `/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}`;
    const params = remote ? "?remote=true" : "";
    const response = await fetch(url + params, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${apiConfig.getAccessToken()}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Delete message error: ${response.status}`);
    }
  }
}
