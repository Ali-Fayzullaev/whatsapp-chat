import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    console.log("=== DEBUG UPLOAD TEST ===");
    console.log("FormData entries:");
    
    const entries: any[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        entries.push({
          key,
          type: 'file',
          name: value.name,
          size: value.size,
          mimeType: value.type
        });
      } else {
        entries.push({
          key, 
          type: 'text',
          value: value
        });
      }
    }
    
    console.log("Entries:", entries);
    
    return Response.json({ 
      success: true, 
      message: "File received successfully",
      received: entries,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Debug upload error:", error);
    return Response.json({ error: "Debug failed" }, { status: 500 });
  }
}