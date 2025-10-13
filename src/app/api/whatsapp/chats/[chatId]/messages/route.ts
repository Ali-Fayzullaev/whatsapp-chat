// src/app/api/whatsapp/chats/[chatId]/messages/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  
  console.log('Loading messages for chat:', chatId);
  
  try {
    const decodedChatId = decodeURIComponent(chatId);
    
    const apiUrl = `${apiConfig.getBaseUrl()}/api/chats/${decodedChatId}/messages`;
    console.log('Fetching from URL:', apiUrl);
    
    const res = await fetch(apiUrl, {
      cache: 'no-store',
      headers: apiConfig.getHeaders(),
    });

    console.log('Messages API response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Messages API error:', errorText);
      
      if (res.status === 404) {
        return Response.json([]);
      }
      
      return Response.json({ error: 'Failed to fetch messages' }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error('Messages fetch error:', error);
    return Response.json([]);
  }
}