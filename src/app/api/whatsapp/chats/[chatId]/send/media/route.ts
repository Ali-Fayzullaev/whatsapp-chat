// src/app/api/whatsapp/chats/[chatId]/send/media/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const caption = formData.get('caption') as string | null;

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

    // Проверка размера (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return Response.json({ error: "Файл слишком большой (максимум 50MB)" }, { status: 400 });
    }

    const decodedId = decodeURIComponent(chatId);
    console.log("Decoded chat ID:", decodedId);

    // 🔹 ИСПРАВЛЕНО: Правильный эндпоинт для медиа
    const url = `${apiConfig.getBaseUrl()}/api/chats/${decodedId}/send/media`;
    console.log("External API URL:", url);

    // Создаем новый FormData для внешнего API
    const externalFormData = new FormData();
    
    // 🔹 ВАЖНО: Правильное создание Blob из файла
    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      externalFormData.append('file', blob, file.name);
      console.log("File converted to Blob successfully");
    } catch (blobError) {
      console.error("Failed to convert file to Blob:", blobError);
      return Response.json({ 
        error: "Ошибка обработки файла",
        details: blobError instanceof Error ? blobError.message : "Unknown error"
      }, { status: 500 });
    }
    
    // Добавляем caption если есть
    if (caption && caption.trim()) {
      externalFormData.append('caption', caption.trim());
    }

    console.log("Sending media to external API...");

    // 🔹 ИСПРАВЛЕНО: Правильные заголовки
    const headers = apiConfig.getHeadersForFormData();
    console.log("Request headers:", Object.keys(headers));

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        body: externalFormData,
        headers: headers,
      });
      console.log("External API response received");
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return Response.json({ 
        error: "Ошибка соединения с API",
        details: fetchError instanceof Error ? fetchError.message : "Network error"
      }, { status: 500 });
    }

    console.log("External API status:", res.status);
    console.log("External API status text:", res.statusText);

    // Читаем ответ
    const responseText = await res.text();
    console.log("External API response length:", responseText.length);
    
    if (responseText.length > 0) {
      console.log("Response preview (first 200 chars):", responseText.substring(0, 200));
    }
    
    let data;
    let parseError = null;
    
    try {
      if (responseText.trim()) {
        data = JSON.parse(responseText);
        console.log("External API parsed response:", data);
      } else {
        console.log("External API returned empty response");
        data = { success: true }; // Если пустой ответ, считаем успешным
      }
    } catch (error) {
      parseError = error;
      console.error("Failed to parse API response:", error);
      
      // Проверяем HTML ответ
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
        const h1Match = responseText.match(/<h1[^>]*>(.*?)<\/h1>/i);
        
        console.error("Received HTML response instead of JSON");
        console.error("HTML title:", titleMatch ? titleMatch[1] : "N/A");
        console.error("HTML h1:", h1Match ? h1Match[1] : "N/A");
        
        data = {
          error: "API вернул HTML вместо JSON",
          html_title: titleMatch ? titleMatch[1] : null,
          html_h1: h1Match ? h1Match[1] : null,
          status: res.status,
        };
      } else if (responseText.toLowerCase().includes('internal server error')) {
        console.error("Internal server error from API");
        data = {
          error: "Внутренняя ошибка сервера API",
          raw_message: responseText.substring(0, 200),
          status: res.status,
        };
      } else {
        data = {
          error: "Невалидный JSON ответ от API",
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
        parseError: parseError ? "Failed to parse" : "Parsed OK"
      });

      return Response.json(
        {
          error: data.error || `API Error: ${res.status} ${res.statusText}`,
          details: data,
          status: res.status,
        },
        { status: res.status }
      );
    }

    console.log("Media sent successfully:", data);
    return Response.json(data);
    
  } catch (error) {
    console.error("Send media network error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    
    return Response.json(
      {
        error: "Ошибка сети",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}