// src/app/api/whatsapp/chats/[chatId]/send/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const resolvedParams = await params;
  const { chatId } = resolvedParams;
  const { text, reply_to } = await req.json();
  
  console.log("=== SEND MESSAGE API ===");
  console.log("Chat ID:", chatId);
  console.log("Message text:", text);
  console.log("Reply to:", reply_to);
  
  if (!text) {
    return Response.json({ error: "Текст обязателен" }, { status: 400 });
  }

  // 🔹 ДОБАВЛЕНО: Получаем токен авторизации из заголовка
  const authHeader = req.headers.get('authorization');
  let token = '';
  
  if (authHeader) {
    token = authHeader.replace('Bearer ', '');
  } else {
    token = apiConfig.getAccessToken() || '';
  }

  if (!token) {
    console.error('No access token available');
    return Response.json(
      { error: 'Authorization token required' },
      { status: 401 }
    );
  }

  try {
    const decodedId = decodeURIComponent(chatId);
    
    // Если это временный чат, сначала создаем реальный чат
    let actualChatId = decodedId;
    if (decodedId.startsWith("temp:")) {
      const phone = decodedId.replace("temp:", "");
      const apiPhone = phone.includes("@c.us") ? phone : `${phone}@c.us`;
      
      console.log("Creating chat for temp ID:", decodedId);
      console.log("Phone:", apiPhone);
      
      // Создаем чат
      const createChatUrl = `${apiConfig.getBaseUrl()}/api/chats/start`;
      const createRes = await fetch(createChatUrl, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: apiPhone }),
      });
      
      if (createRes.ok) {
        const createData = await createRes.json();
        if (createData?.chat_id) {
          actualChatId = createData.chat_id;
          console.log("Created chat with ID:", actualChatId);
        }
      } else {
        console.error("Failed to create chat:", createRes.status);
        return Response.json({ error: "Не удалось создать чат" }, { status: 400 });
      }
    }
    
    const url = `${apiConfig.getBaseUrl()}/api/chats/${actualChatId}/send/text`;
    console.log("External API URL:", url);

    // 🔹 ПРАВИЛЬНАЯ СТРУКТУРА ДЛЯ ВНЕШНЕГО API
    const payload: any = {
      text: text
    };

    // 🔹 ПРАВИЛЬНО ПЕРЕДАЕМ ИНФОРМАЦИЮ ОБ ОТВЕТЕ
    if (reply_to?.message_id) {
      payload.replyToMessageId = reply_to.message_id; // 🔹 ИЛИ ТО ПОЛЕ, КОТОРОЕ ЖДЕТ ВАШ БЭКЕНД
    }

    console.log("Sending payload to external API:", payload);

    // 🔹 ОБНОВЛЕНО: Используем токен который получили выше
    const res = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("External API status:", res.status);
    
    // Сначала читаем ответ как текст, чтобы избежать ошибки "Body has already been read"
    const responseText = await res.text();
    console.log("External API response text:", responseText);
    
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("Failed to parse API response:", parseError);
      data = { 
        error: "Invalid JSON response", 
        raw: responseText,
        status: res.status 
      };
    }
    
    if (!res.ok) {
      console.error("External API error:", data);
      return Response.json({ 
        error: data.error || "Ошибка API",
        details: data,
        status: res.status
      }, { status: res.status });
    }
    
    console.log("Message sent successfully:", data);
    return Response.json(data);
    
  } catch (error) {
    console.error("Send message network error:", error);
    return Response.json({ 
      error: "Ошибка сети",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}