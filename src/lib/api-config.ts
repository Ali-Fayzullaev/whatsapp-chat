// src/lib/api-config.ts
import { tokenStorage, TokenUtils } from './token-storage';

class ApiConfig {
  private static instance: ApiConfig;
  private baseUrl = "https://socket.eldor.kz";
  private BASE_URL = "https://socket.eldor.kz";
  private accessToken: string | null = null;
  // Fallback токен для разработки
  private fallbackToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxfbmFtZSI6InRlc3QiLCJ1c2VyX2lkIjoiMTIiLCJleHAiOjE3NjA5NTMwMzB9.hBjWO-KkYhgubovpHX50yU_V0lTHjYeRszKNxrWRS7E";

  private constructor() {
    // Пытаемся загрузить токен из хранилища при инициализации
    this.loadTokenFromStorage();
  }

  static getInstance(): ApiConfig {
    if (!ApiConfig.instance) {
      ApiConfig.instance = new ApiConfig();
    }
    return ApiConfig.instance;
  }

  getBaseUrl(): string {
    console.log('🔗 Returning base URL:', this.BASE_URL);
    return this.BASE_URL;
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
    // Сначала проверяем кэшированный токен
    if (this.accessToken) {
      return this.accessToken;
    }

    // Если нет кэша, загружаем из хранилища (только на клиенте)
    if (typeof window !== 'undefined') {
      const storedToken = tokenStorage.getToken();
      if (storedToken) {
        this.accessToken = storedToken; // Кэшируем
        return storedToken;
      }
    }

    // Fallback для разработки (особенно важно на сервере)
    console.log('🔄 Using fallback token (server-side or no stored token)');
    return this.fallbackToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    tokenStorage.setToken(token);
    console.log('🔑 Access token updated:', TokenUtils.maskToken(token));
  }

  clearAccessToken(): void {
    this.accessToken = null;
    tokenStorage.removeToken();
    console.log('🗑️ Access token cleared');
  }

  private loadTokenFromStorage(): void {
    const savedToken = tokenStorage.getToken();
    if (savedToken) {
      // Проверяем не истек ли токен
      if (!TokenUtils.isTokenExpired(savedToken)) {
        this.accessToken = savedToken;
        console.log('✅ Token restored from storage:', TokenUtils.maskToken(savedToken));
      } else {
        console.log('⚠️ Stored token is expired, removing...');
        tokenStorage.removeToken();
      }
    }
  }

  // 🔹 НОВЫЕ МЕТОДЫ ДЛЯ ДИАГНОСТИКИ
  getTokenInfo(): {
    current: string;
    masked: string;
    storage: { hasToken: boolean; storage: string[] };
    isExpired: boolean;
    payload: any | null;
  } {
    const current = this.getCurrentToken();
    return {
      current,
      masked: TokenUtils.maskToken(current),
      storage: tokenStorage.getTokenInfo(),
      isExpired: TokenUtils.isTokenExpired(current),
      payload: TokenUtils.getTokenPayload(current),
    };
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