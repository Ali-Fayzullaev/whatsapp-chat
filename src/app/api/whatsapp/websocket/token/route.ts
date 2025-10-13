// src/app/api/whatsapp/websocket/token/route.ts
import { apiConfig } from "@/lib/api-config";

export async function GET() {
  try {
    const res = await fetch(`${apiConfig.getBaseUrl()}/websocket-token`, { // 🔹 ОБНОВЛЕНО
      headers: apiConfig.getHeaders(), // 🔹 ОБНОВЛЕНО
    });
    
    if (!res.ok) throw new Error('Failed to get WebSocket token');
    
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to get WebSocket token' }, { status: 500 });
  }
}