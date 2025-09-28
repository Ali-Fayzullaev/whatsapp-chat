// src/app/api/whatsapp/chats/[chatId]/send/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { chatId: string } }) {
  const { chatId } = params;
  const { text, replyTo } = await req.json();
  if (!text) return Response.json({ error: "Текст обязателен" }, { status: 400 });

  const decodedId = decodeURIComponent(chatId);
  const url = `https://socket.eldor.kz/chats/${decodedId}/send/text`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, reply_to: replyTo }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return Response.json({ error: "Ошибка API", details: data }, { status: res.status });
  }
  return Response.json(data);
}
