// src/app/api/ai/deepseek/route.ts
import { NextRequest } from "next/server";
import { deepSeekAI, type ChatContext } from "@/lib/deepseek";

export async function POST(req: NextRequest) {
  try {
    console.log("🤖 === DEEPSEEK AI API START ===");
    
    const requestBody = await req.json();
    console.log("🤖 Request body:", requestBody);
    
    const { message, chatId, context } = requestBody;
    
    if (!message || !chatId) {
      console.log("🤖 ❌ Missing required fields:", { message: !!message, chatId: !!chatId });
      return Response.json(
        { error: "Message and chatId are required" },
        { status: 400 }
      );
    }

    console.log("🤖 ✅ AI analyzing:", { 
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      chatId,
      contextMessages: context?.messages?.length || 0
    });

    // Подготавливаем контекст для AI
    const chatContext: ChatContext = {
      messages: context?.messages || [
        { text: message, author: 'them' as const, timestamp: Date.now() }
      ],
      customerName: context?.customerName,
      chatId,
    };

    // Генерируем ответ через DeepSeek AI
    console.log("🤖 Calling deepSeekAI.generateResponse...");
    const aiResponse = await deepSeekAI.generateResponse(message, chatContext);
    
    console.log("🤖 ✅ AI response generated successfully:", {
      intent: aiResponse.intent,
      responseLength: aiResponse.response?.length || 0,
      confidence: aiResponse.confidence,
      shouldReply: aiResponse.shouldReply,
      urgency: aiResponse.urgency
    });

    const result = {
      success: true,
      aiResponse,
      shouldAutoReply: aiResponse.shouldReply,
      timestamp: new Date().toISOString(),
    };

    console.log("🤖 === DEEPSEEK AI API SUCCESS ===");
    return Response.json(result);

  } catch (error) {
    console.error("DeepSeek AI API error:", error);
    
    return Response.json(
      {
        error: "AI processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET: Получить настройки AI
export async function GET() {
  return Response.json({
    enabled: deepSeekAI.isEnabled(),
    settings: {
      autoReplyDelay: 2000,
      maxResponseLength: 300,
      temperature: 0.7,
      confidence_threshold: 0.7,
    }
  });
}

// PUT: Обновить настройки AI
export async function PUT(req: NextRequest) {
  try {
    const { enabled, settings } = await req.json();
    
    if (typeof enabled === 'boolean') {
      deepSeekAI.setEnabled(enabled);
    }
    
    if (settings) {
      deepSeekAI.updateSettings(settings);
    }

    return Response.json({
      success: true,
      enabled: deepSeekAI.isEnabled(),
    });

  } catch (error) {
    console.error("Failed to update AI settings:", error);
    
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}