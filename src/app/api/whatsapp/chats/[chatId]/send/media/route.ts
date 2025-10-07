// src/app/api/whatsapp/chats/[chatId]/send/media/route.ts
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  
  console.log("=== SEND MEDIA MESSAGE API ===");
  console.log("Chat ID:", chatId);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    
    if (!file) {
      return Response.json({ error: "Файл обязателен" }, { status: 400 });
    }

    console.log("Media file:", {
      name: file.name,
      type: file.type,
      size: file.size,
      caption: caption
    });

    // Декодируем chatId
    const decodedId = decodeURIComponent(chatId);
    console.log("Decoded chat ID:", decodedId);
    
    // Создаем FormData для внешнего API
    const externalFormData = new FormData();
    externalFormData.append('file', file);
    if (caption) {
      externalFormData.append('caption', caption);
    }

    const url = `https://socket.eldor.kz/chats/${decodedId}/send/media`;
    console.log("External API URL:", url);

    const res = await fetch(url, {
      method: "POST",
      body: externalFormData,
    });

    console.log("External API status:", res.status);
    console.log("External API ok:", res.ok);
    
    let data;
    try {
      data = await res.json();
      console.log("External API response:", data);
    } catch (parseError) {
      console.error("Failed to parse API response:", parseError);
      const textResponse = await res.text();
      console.error("Raw API response:", textResponse);
      data = { 
        error: "Invalid JSON response", 
        raw: textResponse,
        status: res.status 
      };
    }
    
    if (!res.ok) {
      console.error("External API error:", {
        status: res.status,
        statusText: res.statusText,
        data: data
      });
      
      return Response.json({ 
        error: data.error || "Ошибка API",
        details: data.details || data,
        status: res.status
      }, { status: res.status });
    }
    
    console.log("Media sent successfully:", data);
    return Response.json(data);
    
  } catch (error) {
    console.error("Send media network error:", error);
    return Response.json({ 
      error: "Ошибка сети",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}