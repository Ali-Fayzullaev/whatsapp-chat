// src/app/api/whatsapp/chats/[chatId]/send/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const resolvedParams = await params;
  const { chatId } = resolvedParams;
  const { text, reply_to } = await req.json(); // 🔹 ИЗМЕНИЛ НА reply_to
  
  console.log("=== SEND MESSAGE API ===");
  console.log("Chat ID:", chatId);
  console.log("Message text:", text);
  console.log("Reply to:", reply_to); // 🔹 ДОБАВИЛ ЛОГИРОВАНИЕ
  
  if (!text) {
    return Response.json({ error: "Текст обязателен" }, { status: 400 });
  }

  try {
    const decodedId = decodeURIComponent(chatId);
    
    const url = `${apiConfig.getBaseUrl()}/api/chats/${decodedId}/send/text`;
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

    // Получаем токен из заголовков запроса
    const authHeader = req.headers.get('authorization');

    const res = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(payload),
    });

    console.log("External API status:", res.status);
    
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse API response:", parseError);
      const textResponse = await res.text();
      data = { 
        error: "Invalid JSON response", 
        raw: textResponse,
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