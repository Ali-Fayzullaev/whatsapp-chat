// src/app/api/whatsapp/chats/[chatId]/send/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { chatId: string } }) {
  const { chatId } = params;
  const { text, replyTo } = await req.json();
  
  console.log("=== SEND MESSAGE API ===");
  console.log("Chat ID:", chatId);
  console.log("Message text:", text);
  console.log("Reply to:", replyTo);
  
  if (!text) {
    console.error("No text provided");
    return Response.json({ error: "Текст обязателен" }, { status: 400 });
  }

  try {
    // Декодируем chatId
    const decodedId = decodeURIComponent(chatId);
    console.log("Decoded chat ID:", decodedId);
    
    const url = `https://socket.eldor.kz/chats/${decodedId}/send/text`;
    console.log("External API URL:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, reply_to: replyTo }),
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