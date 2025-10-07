// src/app/api/whatsapp/chats/route.ts
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    console.log('Fetching chats from API...');
    const res = await fetch('https://socket.eldor.kz/chats', {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('API response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API error response:', errorText);
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('API response data:', JSON.stringify(data, null, 2));
    
    // ✅ Обработка данных в зависимости от структуры ответа
    let chats = [];
    
    if (Array.isArray(data)) {
      // Если API возвращает массив напрямую (как в вашем примере)
      chats = data;
    } else if (Array.isArray(data?.items)) {
      // Если API возвращает { items: [...] }
      chats = data.items;
    } else {
      console.warn('Unexpected API response structure:', data);
      chats = [];
    }
    
    console.log('Processed chats count:', chats.length);
    console.log('First chat id:', chats[0]?.chat_id);
    
    return Response.json(chats);
  } catch (error) {
    console.error('API fetch error:', error);
    return Response.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}