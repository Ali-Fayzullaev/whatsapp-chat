// src/app/api/whatsapp/chats/[chatId]/delete/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    console.log("=== DELETE CHAT API ===");
    
    const resolvedParams = await params;
    const chatId = decodeURIComponent(resolvedParams.chatId);
    console.log("Deleting chat ID:", chatId);

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

    const url = `${apiConfig.getBaseUrl()}/api/chats/${chatId}`;
    console.log("External API URL:", url);

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("Delete chat status:", res.status);
    
    if (res.status === 204 || res.status === 200) {
      // Успешное удаление
      console.log("Chat deleted successfully");
      return Response.json({ success: true, message: "Чат успешно удален" });
    }
    
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse delete response:", parseError);
      const textResponse = await res.text();
      data = { 
        error: "Invalid JSON response", 
        raw: textResponse,
        status: res.status 
      };
    }
    
    if (!res.ok) {
      console.error("Delete chat error:", data);
      return Response.json({ 
        error: data.error || "Ошибка удаления чата",
        details: data,
        status: res.status
      }, { status: res.status });
    }
    
    console.log("Chat deleted successfully:", data);
    return Response.json(data);
    
  } catch (error) {
    console.error("Delete chat network error:", error);
    return Response.json({ 
      error: "Ошибка сети при удалении чата",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}