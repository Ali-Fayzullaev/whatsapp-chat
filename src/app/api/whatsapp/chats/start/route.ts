// src/app/api/whatsapp/chats/start/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    
    console.log("=== START CHAT API ===");
    console.log("Received phone:", phone);
    console.log("Phone length:", phone?.length);
    
    if (!phone) {
      console.error("No phone provided");
      return Response.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Проверяем формат номера
    if (!phone.endsWith('@c.us')) {
      console.error("Invalid phone format, should end with @c.us");
      return Response.json({ error: "Phone number must end with @c.us" }, { status: 400 });
    }

    const apiUrl = 'https://socket.eldor.kz/chats/start';
    console.log("Calling external API:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    console.log("External API response status:", response.status);
    console.log("External API response ok:", response.ok);
    
    // Получаем текст ответа сначала
    const responseText = await response.text();
    console.log("External API raw response:", responseText);
    
    let data;
    try {
      // Пытаемся распарсить JSON
      data = responseText ? JSON.parse(responseText) : {};
      console.log("External API parsed data:", data);
    } catch (parseError) {
      console.error("Failed to parse API response as JSON:", parseError);
      data = { 
        error: "Invalid JSON response from API", 
        raw: responseText,
        status: response.status
      };
    }
    
    if (!response.ok) {
      console.error("External API returned error:", {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      return Response.json({ 
        error: data.error || `API Error: ${response.status} ${response.statusText}`,
        details: data.details || data,
        status: response.status
      }, { status: response.status });
    }

    console.log("Chat started successfully, chat_id:", data.chat_id);
    return Response.json(data);
    
  } catch (error) {
    console.error('Start chat network error:', error);
    return Response.json({ 
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}