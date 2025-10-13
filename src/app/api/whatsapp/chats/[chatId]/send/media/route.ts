// src/app/api/whatsapp/chats/[chatId]/send/media/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;

  console.log("=== SEND MEDIA MESSAGE API ===");
  console.log("Chat ID:", chatId);

  try {
    // Получаем FormData с файлом
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;

    console.log("Media file details:", {
      name: file?.name,
      type: file?.type,
      size: file?.size,
      caption: caption
    });

    if (!file) {
      console.error("No file provided");
      return Response.json({ error: "Файл обязателен" }, { status: 400 });
    }

    const decodedId = decodeURIComponent(chatId);
    console.log("Decoded chat ID:", decodedId);

    const url = `${apiConfig.getBaseUrl()}/api/chats/${decodedId}/send/media`;
    console.log("External API URL:", url);

    // Создаем FormData для внешнего API
    const externalFormData = new FormData();
    externalFormData.append('file', file);
    
    if (caption && caption.trim()) {
      externalFormData.append('caption', caption.trim());
    }

    console.log("Sending FormData to external API with entries:");
    for (const [key, value] of externalFormData.entries()) {
      if (value instanceof File) {
        console.log(`- ${key}:`, { name: value.name, type: value.type, size: value.size });
      } else {
        console.log(`- ${key}:`, value);
      }
    }

    // 🔹 ДОБАВЛЕНО: Логируем заголовки
    const headers = apiConfig.getHeadersForFormData();
    console.log("Request headers:", headers);

    const res = await fetch(url, {
      method: "POST",
      body: externalFormData,
      headers: headers,
    });

    console.log("External API status:", res.status);
    console.log("External API status text:", res.statusText);
    console.log("External API headers:", Object.fromEntries(res.headers.entries()));

    // 🔹 ДОБАВЛЕНО: Более детальное логирование ответа
    const responseText = await res.text();
    console.log("External API raw response length:", responseText.length);
    console.log("External API raw response (first 500 chars):", responseText.substring(0, 500));
    
    // 🔹 ДОБАВЛЕНО: Логируем полный ответ если он короткий
    if (responseText.length < 1000) {
      console.log("External API full response:", responseText);
    }

    let data;
    let parseError = null;
    
    try {
      if (responseText.trim()) {
        data = JSON.parse(responseText);
        console.log("External API parsed response:", data);
      } else {
        data = {};
        console.log("External API returned empty response");
      }
    } catch (error) {
      parseError = error;
      console.error("Failed to parse API response:", error);
      console.log("Response that failed to parse:", responseText);
      
      // 🔹 ДОБАВЛЕНО: Пытаемся извлечь ошибку из HTML если это HTML страница
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
        const bodyMatch = responseText.match(/<body[^>]*>(.*?)<\/body>/is);
        
        data = {
          error: "HTML response received",
          html_title: titleMatch ? titleMatch[1] : null,
          body_preview: bodyMatch ? bodyMatch[1].substring(0, 200) : null,
          status: res.status,
        };
      } else {
        data = {
          error: "Invalid JSON response from API",
          raw_preview: responseText.substring(0, 200),
          status: res.status,
        };
      }
    }

    if (!res.ok) {
      console.error("External API returned error:", {
        status: res.status,
        statusText: res.statusText,
        data: data,
        parseError: parseError
      });

      return Response.json(
        {
          error: data.error || `API Error: ${res.status} ${res.statusText}`,
          details: data.details || data,
          raw_response: responseText.substring(0, 500), // 🔹 ДОБАВЛЕНО
          status: res.status,
        },
        { status: res.status }
      );
    }

    console.log("Media sent successfully:", data);
    return Response.json(data);
  } catch (error) {
    console.error("Send media network error:", error);
    return Response.json(
      {
        error: "Ошибка сети",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}