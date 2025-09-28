// src/app/api/whatsapp/chats/[chatId]/send/route.ts
import { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  const { text } = await req.json();

  console.log('Sending message to chat:', chatId, 'text:', text);

  try {
    const apiUrl = `https://socket.eldor.kz/chats/${chatId}/send/text`;
    console.log('External API URL:', apiUrl);
    
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    console.log('External API status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('External API error:', errorText);
      return Response.json({ error: 'API Error', details: errorText }, { status: res.status });
    }

    const data = await res.json();
    console.log('External API success:', data);
    
    return Response.json(data);
  } catch (error) {
    console.error('Send message error:', error);
    return Response.json({ error: 'Network error' }, { status: 500 });
  }
}