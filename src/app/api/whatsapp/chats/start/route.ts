// src/app/api/whatsapp/chats/start/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone) {
    return Response.json({ error: 'Требуется номер телефона' }, { status: 400 });
  }

  const res = await fetch('https://socket.eldor.kz/chats/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return Response.json({ error: 'Ошибка API', details: errorText }, { status: res.status });
  }

  const data = await res.json();
  return Response.json(data);
}