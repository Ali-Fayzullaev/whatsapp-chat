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
      
      // 🔹 ВОЗВРАЩАЕМ ПУСТОЙ МАССИВ ПРИ ОШИБКЕ
      return Response.json([]);
    }
    
    const data = await res.json();
    console.log('API response data:', data);
    
    let chats = [];
    
    if (Array.isArray(data)) {
      chats = data;
    } else if (Array.isArray(data?.items)) {
      chats = data.items;
    } else {
      console.warn('Unexpected API response structure:', data);
      chats = [];
    }
    
    console.log('Processed chats count:', chats.length);
    
    return Response.json(chats);
  } catch (error) {
    console.error('API fetch error:', error);
    // 🔹 ВОЗВРАЩАЕМ ПУСТОЙ МАССИВ ПРИ ОШИБКЕ
    return Response.json([]);
  }
}