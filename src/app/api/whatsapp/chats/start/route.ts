// src/app/api/whatsapp/chats/start/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    
    console.log("=== START CHAT API ===");
    console.log("Received phone:", phone);
    
    if (!phone) {
      return Response.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (!phone.endsWith('@c.us')) {
      return Response.json({ error: "Phone number must end with @c.us" }, { status: 400 });
    }

    const apiUrl = `${apiConfig.getBaseUrl()}/api/chats/start`;
    console.log("Calling external API:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: apiConfig.getHeaders(),
      body: JSON.stringify({ phone }),
    });

    console.log("External API response status:", response.status);
    
    const responseText = await response.text();
    console.log("External API raw response:", responseText);
    
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("Failed to parse API response:", parseError);
      data = { 
        error: "Invalid JSON response", 
        raw: responseText,
        status: response.status
      };
    }
    
    if (!response.ok) {
      console.error("External API error:", data);
      return Response.json({ 
        error: data.error || `API Error: ${response.status}`,
        details: data,
        status: response.status
      }, { status: response.status });
    }

    console.log("Chat started successfully:", data);
    return Response.json(data);
    
  } catch (error) {
    console.error('Start chat network error:', error);
    return Response.json({ 
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}