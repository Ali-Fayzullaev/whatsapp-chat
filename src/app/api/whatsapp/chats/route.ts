// src/app/api/whatsapp/chats/route.ts
import { NextRequest } from 'next/server';
import { apiConfig } from "@/lib/api-config";

export async function GET(req: NextRequest) {
  try {
    console.log('Fetching chats from API...');
    
    const apiUrl = `${apiConfig.getBaseUrl()}/api/chats`;
    console.log('API URL:', apiUrl);
    
    const res = await fetch(apiUrl, {
      cache: 'no-store',
      headers: apiConfig.getHeaders(),
    });
    
    console.log('API response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API error:', errorText);
      return Response.json([]);
    }
    
    const data = await res.json();
    console.log('API response data:', data);
    
    return Response.json(data);
  } catch (error) {
    console.error('API fetch error:', error);
    return Response.json([]);
  }
}