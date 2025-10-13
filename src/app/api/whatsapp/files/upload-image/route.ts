// src/app/api/whatsapp/files/upload-image/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json({ error: "Файл обязателен" }, { status: 400 });
    }

    console.log("Uploading image:", file.name, file.type, file.size);

    const url = `${apiConfig.getBaseUrl()}/api/files/upload-image`;
    console.log("External API URL:", url);

    const externalFormData = new FormData();
    externalFormData.append('file', file);

    const res = await fetch(url, {
      method: "POST",
      body: externalFormData,
      headers: apiConfig.getHeadersForFormData(),
    });

    console.log("Image upload status:", res.status);
    
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse image upload response:", parseError);
      const textResponse = await res.text();
      data = { 
        error: "Invalid JSON response", 
        raw: textResponse,
        status: res.status 
      };
    }
    
    if (!res.ok) {
      console.error("Image upload error:", data);
      return Response.json({ 
        error: data.error || "Ошибка загрузки изображения",
        details: data,
        status: res.status
      }, { status: res.status });
    }
    
    console.log("Image uploaded successfully:", data);
    return Response.json(data);
    
  } catch (error) {
    console.error("Image upload network error:", error);
    return Response.json({ 
      error: "Ошибка сети",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}