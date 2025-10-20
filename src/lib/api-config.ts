// src/lib/api-config.ts
class ApiConfig {
  private static instance: ApiConfig;
  private baseUrl = "https://socket.eldor.kz";
  private accessToken: string | null = null;
  // Fallback токен для разработки
  private fallbackToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxfbmFtZSI6InRlc3QiLCJ1c2VyX2lkIjoiMTIiLCJleHAiOjE3NjA5NTMwMzB9.hBjWO-KkYhgubovpHX50yU_V0lTHjYeRszKNxrWRS7E";

  private constructor() {
    // Пытаемся загрузить токен из localStorage при инициализации
    this.loadTokenFromStorage();
  }

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
    const token = this.getCurrentToken();
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  // 🔹 ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ FORMDATA
  getHeadersForFormData(): HeadersInit {
    const token = this.getCurrentToken();
    return {
      "Authorization": `Bearer ${token}`,
      // НЕ добавляем Content-Type - браузер сам установит с boundary
    };
  }

  getAccessToken(): string {
    return this.getCurrentToken();
  }

  // 🔹 МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ ТОКЕНАМИ
  private getCurrentToken(): string {
    return this.accessToken || this.fallbackToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    this.saveTokenToStorage(token);
  }

  clearAccessToken(): void {
    this.accessToken = null;
    this.removeTokenFromStorage();
  }

  private loadTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        this.accessToken = savedToken;
      }
    }
  }

  private saveTokenToStorage(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private removeTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // 🔹 МЕТОД ДЛЯ ПОЛУЧЕНИЯ WEBSOCKET URL
  getWebSocketUrl(): string {
    // Преобразуем HTTP URL в WebSocket URL
    return this.baseUrl.replace(/^https?/, 'wss') + '/ws';
  }

  // 🔹 МЕТОД ДЛЯ ПОЛУЧЕНИЯ WEBSOCKET URL С ТОКЕНОМ
  getWebSocketUrlWithToken(token?: string): string {
    const wsUrl = this.getWebSocketUrl();
    const currentToken = token || this.getCurrentToken();
    return `${wsUrl}?token=${currentToken}`;
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