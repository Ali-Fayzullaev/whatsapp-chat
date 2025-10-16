// src/lib/api-config.ts
class ApiConfig {
  private static instance: ApiConfig;
  private baseUrl = "https://socket.eldor.kz";
  private accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxfbmFtZSI6InRlc3QiLCJ1c2VyX2lkIjoiMTIiLCJleHAiOjE3NjA2MTkzODJ9.zPAdLqdWoFxqlLqGjF19UPFuWzgbmyhCrSyMFI_sDsU";

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
      "Authorization": `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  // 🔹 ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ FORMDATA
  getHeadersForFormData(): HeadersInit {
    return {
      "Authorization": `Bearer ${this.accessToken}`,
      // НЕ добавляем Content-Type - браузер сам установит с boundary
    };
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  // 🔹 ДОБАВЬТЕ МЕТОД ДЛЯ ПРОВЕРКИ ТОКЕНА
  async validateToken(): Promise<boolean> {
    try {
      const testUrl = `${this.baseUrl}/api/chats`;
      const res = await fetch(testUrl, {
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  }
}

export const apiConfig = ApiConfig.getInstance();