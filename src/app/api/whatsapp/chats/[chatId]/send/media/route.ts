// src/app/api/whatsapp/chats/[chatId]/send/media/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    console.log("=== SEND MEDIA MESSAGE API ===");
    
    const resolvedParams = await params;
    const chatId = decodeURIComponent(resolvedParams.chatId);
    console.log("Chat ID:", chatId);

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

    const { media_url, caption, reply_to } = await req.json();
    
    if (!media_url) {
      return Response.json({ error: "URL медиа обязателен" }, { status: 400 });
    }

    console.log("Sending media message:", {
      chatId,
      media_url,
      caption,
      reply_to
    });

    const decodedId = decodeURIComponent(chatId);
    const replyToMessageId = reply_to || null;

    // Для прямых URL медиа-файлов пропускаем загрузку на сервер
    const fullUrl = media_url;

    console.log("Using direct media URL:", fullUrl);

    // 🔹 3. Проверяем доступность файла по URL
    const fileAccessible = await checkFileAccessibility(fullUrl);
    if (!fileAccessible) {
      return Response.json(
        {
          error:
            "Файл недоступен по полученному URL. Возможно, нужен другой домен для файлов.",
        },
        { status: 400 }
      );
    }

    // 🔹 4. Отправляем медиа-сообщение через Green API
    const fileName = media_url.split('/').pop() || 'media_file';
    const sendResult = await sendMediaToGreenAPI(
      decodedId,
      fullUrl,
      fileName,
      caption,
      replyToMessageId, // 🔹 ДОБАВЛЕНО
      token // 🔹 ОБНОВЛЕНО: Используем извлеченный токен
    );

    if (!sendResult.success) {
      return Response.json({ error: sendResult.error }, { status: 400 });
    }

    console.log("Media sent successfully:", sendResult.data);
    return Response.json(sendResult.data);
  } catch (error) {
    console.error("Send media error:", error);
    return Response.json(
      {
        error: "Ошибка отправки медиа",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 🔹 ФУНКЦИЯ ПРОВЕРКИ ДОСТУПНОСТИ ФАЙЛА
async function checkFileAccessibility(fileUrl: string): Promise<boolean> {
  try {
    console.log("Checking file accessibility:", fileUrl);

    const res = await fetch(fileUrl, { method: "HEAD" });
    console.log("File accessibility check status:", res.status);

    return res.ok;
  } catch (error) {
    console.error("File accessibility check failed:", error);
    return false;
  }
}

async function sendMediaToGreenAPI(
  chatId: string,
  fileUrl: string,
  fileName: string,
  caption: string | null,
  replyToMessageId?: string | null, // 🔹 ДОБАВЛЕНО
  token?: string | null // 🔹 ОБНОВЛЕНО: Изменили название параметра
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    console.log("Sending media to Green API...");
    console.log("File URL:", fileUrl);
    console.log("File name:", fileName);
    console.log("Reply to message ID:", replyToMessageId);

    // 🔹 ОБНОВЛЕННЫЙ PAYLOAD ДЛЯ GREEN API
    const payload: Record<string, unknown> = {
      chatId: chatId,
      url: fileUrl,
      fileName: fileName,
      caption: caption || "", // Отправляем пустую подпись вместо имени файла
    };

    // 🔹 ДОБАВЛЯЕМ информацию об ответе если есть
    if (replyToMessageId) {
      payload.replyToMessageId = replyToMessageId;
    }

    console.log("Green API payload:", payload);

    const url = `${apiConfig.getBaseUrl()}/api/chats/${chatId}/send/media`;
    console.log("Sending to:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
    });

    console.log("Green API response status:", res.status);
    console.log("Green API response status text:", res.statusText);

    const responseText = await res.text();
    console.log("Green API response text:", responseText);

    if (!res.ok) {
      let errorData;
      try {
        errorData = responseText
          ? JSON.parse(responseText)
          : { error: `HTTP ${res.status}` };
      } catch {
        errorData = { error: responseText };
      }

      console.error("Green API send failed:", errorData);
      return {
        success: false,
        error: `Green API Error: ${res.status} - ${JSON.stringify(errorData)}`,
      };
    }

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("Failed to parse Green API response:", parseError);
      return {
        success: false,
        error: "Invalid JSON response from Green API",
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Green API send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Green API send failed",
    };
  }
}
