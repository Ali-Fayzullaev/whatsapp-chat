// src/app/api/whatsapp/chats/[chatId]/sendText/route.ts
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  const { text } = await req.json();

  const res = await fetch(`https://socket.eldor.kz/chats/${chatId}/send/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}