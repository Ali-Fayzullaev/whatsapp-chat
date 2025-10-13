// src/lib/api-config.ts
class ApiConfig {
  private static instance: ApiConfig;
  private baseUrl = "https://socket.eldor.kz";
  private accessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxfbmFtZSI6InRlc3QiLCJ1c2VyX2lkIjoiMTIiLCJleHAiOjE3NjAzNDMyNjZ9.ae267oB34uPcfhecxSS7PH603HIc7OzdIbQKexMFTbQ";
  private refreshToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxfbmFtZSI6InRlc3QiLCJ1c2VyX2lkIjoiMTQiLCJleHAiOjE3NjA5NDA4MTAsInR5cGUiOiJyZWZyZXNoIn0.oIr8dyR2qzI2XxYu7hcl8WNG32ABY35RhVzJDuQv2Xg";
  private constructor() {}

  static getInstance(): ApiConfig {
    if (!ApiConfig.instance) {
      ApiConfig.instance = new ApiConfig();
    }
    return ApiConfig.instance;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  // 🔹 ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ FormData
  getHeadersForFormData(): HeadersInit {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      // НЕ добавляем Content-Type - браузер сам установит с boundary
    };
  }

  getAccessToken(): string {
    return this.accessToken;
  }
}

export const apiConfig = ApiConfig.getInstance();
