// src/app/api/whatsapp/test-upload/route.ts
import { NextRequest } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    console.log("=== TEST UPLOAD TO GREEN API ===");
    console.log("File:", file?.name, file?.type, file?.size);

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Тестируем загрузку на Green API
    const uploadUrl = `${apiConfig.getBaseUrl()}/api/files/upload-image`;
    console.log("Testing upload to:", uploadUrl);

    const testFormData = new FormData();
    testFormData.append('file', file);

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: testFormData,
    });

    console.log("Green API test upload status:", uploadRes.status);

    const responseText = await uploadRes.text();
    console.log("Green API test upload response text:", responseText);

    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      responseData = { error: "Failed to parse response", raw: responseText };
    }

    return Response.json({
      test: "Green API Upload Test",
      uploadStatus: uploadRes.status,
      greenApiResponse: responseData,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    });

  } catch (error) {
    console.error("Test upload error:", error);
    return Response.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}