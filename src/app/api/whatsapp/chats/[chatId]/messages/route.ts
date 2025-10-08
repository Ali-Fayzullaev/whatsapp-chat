// src/app/api/whatsapp/chats/[chatId]/messages/route.ts
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  
  console.log('Loading messages for chat:', chatId);
  
  try {
    const decodedChatId = decodeURIComponent(chatId);
    console.log('Decoded chat ID:', decodedChatId);
    
    // 🔹 ПРОВЕРЬТЕ ПРАВИЛЬНЫЙ URL ВАШЕГО API
    const apiUrl = `https://socket.eldor.kz/chats/${decodedChatId}/messages`;
    console.log('Fetching from URL:', apiUrl);
    
    const res = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Messages API response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Messages API error:', errorText);
      
      // 🔹 ВОЗВРАЩАЕМ ПУСТОЙ МАССИВ ЕСЛИ ЧАТ НЕ НАЙДЕН
      if (res.status === 404) {
        return Response.json([]);
      }
      
      return Response.json({ error: 'Failed to fetch messages' }, { status: res.status });
    }

    const data = await res.json();
    console.log('Messages API response data:', data);
    
    return Response.json(data);
  } catch (error) {
    console.error('Messages fetch error:', error);
    // 🔹 ВОЗВРАЩАЕМ ПУСТОЙ МАССИВ ПРИ ОШИБКЕ
    return Response.json([]);
  }
}