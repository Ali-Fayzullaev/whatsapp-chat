// src/app/api/whatsapp/send-media-temp/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function POST(req: NextRequest) {
  try {
    console.log("=== SEND MEDIA MESSAGE API TEMP ===");

    // Получаем токен авторизации
    const authHeader = req.headers.get('authorization');
    let token = '';
    
    if (authHeader) {
      token = authHeader.replace('Bearer ', '');
    } else {
      // Fallback: пробуем получить из cookies
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'auth_token') {
            token = decodeURIComponent(value);
            break;
          }
        }
      }
    }

    if (!token) {
      console.error('No authorization token provided');
      return Response.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const { chatId, media_url, caption, reply_to } = await req.json();
    
    if (!media_url || !chatId) {
      return Response.json({ error: "URL медиа и chatId обязательны" }, { status: 400 });
    }

    console.log("Sending media message:", {
      chatId,
      media_url,
      caption
    });

    const url = `${apiConfig.getBaseUrl()}/api/chats/${chatId}/send/media`;
    console.log("External API URL:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: media_url,  // 👈 Внешний API ожидает 'url'
        caption: caption || "",
        reply_to,
      }),
    });

    console.log("Media message status:", res.status);
    
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse media message response:", parseError);
      const textResponse = await res.text();
      data = { 
        error: "Invalid JSON response", 
        raw: textResponse,
        status: res.status 
      };
    }
    
    if (!res.ok) {
      console.error("Media message error:", data);
      return Response.json({ 
        error: data.error || "Ошибка отправки медиа-сообщения",
        details: data,
        status: res.status
      }, { status: res.status });
    }
    
    console.log("Media message sent successfully:", data);
    return Response.json(data);
    
  } catch (error) {
    console.error("Media message network error:", error);
    return Response.json({ 
      error: "Ошибка сети при отправке медиа",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}