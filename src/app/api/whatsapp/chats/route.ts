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
    
    // ✅ API возвращает { items: [...] }, а не массив напрямую
    const chats = Array.isArray(data?.items) ? data.items : [];
    console.log('Processed chats:', chats);
    
    return Response.json(chats);
  } catch (error) {
    console.error('API fetch error:', error);
    return Response.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}