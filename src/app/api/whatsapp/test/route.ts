// src/app/api/whatsapp/test/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    
    console.log("=== TEST API CALL ===");
    console.log("Testing with phone:", phone);
    
    if (!phone) {
      return Response.json({ error: "Phone required" }, { status: 400 });
    }

    const testUrl = 'https://socket.eldor.kz/chats/start';
    console.log("Testing URL:", testUrl);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    console.log("Test response status:", response.status);
    
    const responseText = await response.text();
    console.log("Test response text:", responseText);
    
    let parsedData;
    try {
      parsedData = responseText ? JSON.parse(responseText) : {};
    } catch {
      parsedData = { raw: responseText };
    }

    return Response.json({
      testUrl,
      requestBody: { phone },
      responseStatus: response.status,
      responseOk: response.ok,
      responseData: parsedData,
      responseHeaders: Object.fromEntries(response.headers),
    });
    
  } catch (error) {
    console.error("Test error:", error);
    return Response.json({ 
      error: "Test failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}