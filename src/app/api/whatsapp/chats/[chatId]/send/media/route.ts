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
      return Response.json({ error: "Файл обязателен" }, { status: 400 });
    }

    const decodedId = decodeURIComponent(chatId);

    // 🔹 1. Загружаем файл на ваш сервер С АВТОРИЗАЦИЕЙ
    const uploadResult = await uploadFileToYourServer(file);
    
    if (!uploadResult.success) {
      console.error("File upload failed:", uploadResult.error);
      return Response.json({ error: uploadResult.error }, { status: 400 });
    }

    console.log("File uploaded successfully:", uploadResult);

    // 🔹 2. Преобразуем path в полный URL
    const fullUrl = `${apiConfig.getBaseUrl()}${uploadResult.path}`;
    console.log("Full file URL:", fullUrl);

    // 🔹 3. Проверяем доступность файла по URL
    const fileAccessible = await checkFileAccessibility(fullUrl);
    if (!fileAccessible) {
      return Response.json({ 
        error: "Файл недоступен по полученному URL. Возможно, нужен другой домен для файлов." 
      }, { status: 400 });
    }

    // 🔹 4. Отправляем медиа-сообщение через Green API
    const sendResult = await sendMediaToGreenAPI(decodedId, fullUrl, file.name, caption);

    if (!sendResult.success) {
      return Response.json({ error: sendResult.error }, { status: 400 });
    }

    console.log("Media sent successfully:", sendResult.data);
    return Response.json(sendResult.data);

  } catch (error) {
    console.error("Send media error:", error);
    return Response.json({ 
      error: "Ошибка отправки медиа",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// 🔹 ФУНКЦИЯ ЗАГРУЗКИ ФАЙЛА НА ВАШ СЕРВЕР С АВТОРИЗАЦИЕЙ
async function uploadFileToYourServer(file: File): Promise<{success: boolean; path?: string; error?: string}> {
  try {
    console.log("Uploading file to your server with authorization...");

    // Определяем endpoint для загрузки в зависимости от типа файла
    let uploadEndpoint: string;
    
    if (file.type.startsWith('image/')) {
      uploadEndpoint = '/api/files/upload-image';
    } else if (file.type.startsWith('video/')) {
      uploadEndpoint = '/api/files/upload-video';
    } else if (file.type.startsWith('audio/')) {
      uploadEndpoint = '/api/files/upload-audio';
    } else {
      uploadEndpoint = '/api/files/upload-document';
    }

    const uploadUrl = `${apiConfig.getBaseUrl()}${uploadEndpoint}`;
    console.log("Upload URL:", uploadUrl);

    const formData = new FormData();
    formData.append('file', file);

    // 🔹 ДОБАВЛЯЕМ AUTHORIZATION HEADER
    const headers = apiConfig.getHeadersForFormData();
    console.log("Upload headers:", headers);

    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      headers: headers, // 🔹 ОТПРАВЛЯЕМ С АВТОРИЗАЦИЕЙ
    });

    console.log("Upload response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Upload error response:", errorText);
      return { 
        success: false, 
        error: `Upload failed: ${res.status} - ${errorText}` 
      };
    }

    const data = await res.json();
    console.log("Upload response data:", data);

    // Проверяем структуру ответа
    if (data.success && data.path) {
      return { success: true, path: data.path };
    } else {
      return { 
        success: false, 
        error: "Invalid upload response: " + JSON.stringify(data) 
      };
    }

  } catch (error) {
    console.error("Upload error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Upload failed" 
    };
  }
}

// 🔹 ФУНКЦИЯ ПРОВЕРКИ ДОСТУПНОСТИ ФАЙЛА
async function checkFileAccessibility(fileUrl: string): Promise<boolean> {
  try {
    console.log("Checking file accessibility:", fileUrl);
    
    const res = await fetch(fileUrl, { method: 'HEAD' });
    console.log("File accessibility check status:", res.status);
    
    return res.ok;
  } catch (error) {
    console.error("File accessibility check failed:", error);
    return false;
  }
}

// 🔹 ФУНКЦИЯ ОТПРАВКИ МЕДИА В GREEN API
async function sendMediaToGreenAPI(
  chatId: string, 
  fileUrl: string, 
  fileName: string, 
  caption: string | null
): Promise<{success: boolean; data?: any; error?: string}> {
  try {
    console.log("Sending media to Green API...");
    console.log("File URL:", fileUrl);
    console.log("File name:", fileName);

    // 🔹 ПРАВИЛЬНЫЙ PAYLOAD ДЛЯ GREEN API
    const payload = {
      chatId: chatId,
      url: fileUrl, // Полный URL к файлу
      fileName: fileName,
      caption: caption || fileName,
    };

    console.log("Green API payload:", payload);

    const url = `${apiConfig.getBaseUrl()}/api/chats/${chatId}/send/media`;
    console.log("Sending to:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...apiConfig.getHeaders(),
        "Content-Type": "application/json",
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
        errorData = responseText ? JSON.parse(responseText) : { error: `HTTP ${res.status}` };
      } catch {
        errorData = { error: responseText };
      }
      
      console.error("Green API send failed:", errorData);
      return { 
        success: false, 
        error: `Green API Error: ${res.status} - ${JSON.stringify(errorData)}` 
      };
    }

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("Failed to parse Green API response:", parseError);
      return { 
        success: false, 
        error: "Invalid JSON response from Green API" 
      };
    }

    return { success: true, data };

  } catch (error) {
    console.error("Green API send error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Green API send failed" 
    };
  }
}