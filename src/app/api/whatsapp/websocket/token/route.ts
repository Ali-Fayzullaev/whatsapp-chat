// src/app/api/whatsapp/websocket/token/route.ts
import { apiConfig } from "@/lib/api-config";

export async function GET() {
  try {
    console.log("=== GETTING WEBSOCKET TOKEN ===");
    
    const apiUrl = `${apiConfig.getBaseUrl()}/api/websocket/token`;
    console.log("Fetching token from:", apiUrl);

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: apiConfig.getHeaders(),
      cache: 'no-store',
    });
    
    console.log("Token API status:", res.status);
    
    

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Token API error:", errorText);
      
      // Если сервер не поддерживает токены, возвращаем базовый URL
      return Response.json({ 
        token: null,
        url: apiConfig.getWebSocketUrl() 
      });
    }
    
    const data = await res.json();
    console.log("Token received successfully");
    
    // Добавляем URL если его нет
    if (!data.url) {
      data.url = apiConfig.getWebSocketUrl();
    }
    
    return Response.json(data);
    
  } catch (error) {
    console.error("Failed to get WebSocket token:", error);
    
    // Возвращаем базовый URL без токена
    return Response.json({ 
      token: null,
      url: apiConfig.getWebSocketUrl() 
    });
  }
}