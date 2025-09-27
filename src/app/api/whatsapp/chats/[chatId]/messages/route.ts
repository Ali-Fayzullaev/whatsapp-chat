// src/app/api/whatsapp/chats/[chatId]/messages/route.ts
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  const res = await fetch(`https://socket.eldor.kz/chats/${chatId}/messages`);
  const data = await res.json();
  return Response.json(data);
}