// src/app/api/whatsapp/files/upload-file/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function POST(req: NextRequest) {
  try {
    console.log("=== FILE UPLOAD API ===");
    
    // Получаем токен авторизации
    const authHeader = req.headers.get('authorization');
    let token = '';
    
    console.log("Auth header received:", authHeader ? `Bearer ${authHeader.substring(7, 17)}...` : 'missing');
    
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
            console.log("Token found in cookies");
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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json({ error: "Файл обязателен" }, { status: 400 });
    }

    console.log("Uploading file:", file.name, file.type, file.size);

    // Определяем endpoint на основе типа файла
    const fileType = file.type.toLowerCase();
    let externalEndpoint = '/api/files/upload-document'; // по умолчанию документ
    
    if (fileType.startsWith('image/')) {
      externalEndpoint = '/api/files/upload-image';
    } else if (fileType.startsWith('video/')) {
      externalEndpoint = '/api/files/upload-video';
    } else if (fileType.startsWith('audio/')) {
      externalEndpoint = '/api/files/upload-audio';
    }

    const url = `${apiConfig.getBaseUrl()}${externalEndpoint}`;
    console.log("External API URL:", url);

    const externalFormData = new FormData();
    externalFormData.append('file', file);

    const res = await fetch(url, {
      method: "POST",
      body: externalFormData,
      headers: {
        'Authorization': `Bearer ${token}`,
        // НЕ добавляем Content-Type - браузер сам установит с boundary
      },
    });

    console.log("File upload status:", res.status);
    
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse file upload response:", parseError);
      const textResponse = await res.text();
      data = { 
        error: "Invalid JSON response", 
        raw: textResponse,
        status: res.status 
      };
    }
    
    if (!res.ok) {
      console.error("File upload error:", data);
      return Response.json({ 
        error: data.error || "Ошибка загрузки файла",
        details: data,
        status: res.status
      }, { status: res.status });
    }
    
    console.log("File uploaded successfully:", data);
    return Response.json(data);
    
  } catch (error) {
    console.error("File upload network error:", error);
    return Response.json({ 
      error: "Ошибка сети",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}