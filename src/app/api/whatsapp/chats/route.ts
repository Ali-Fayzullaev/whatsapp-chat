// src/app/api/whatsapp/chats/route.ts
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://socket.eldor.kz/chats');
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error('API fetch error:', error);
    return Response.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}