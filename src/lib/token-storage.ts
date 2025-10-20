// src/lib/token-storage.ts

interface TokenStorageOptions {
  useHttpOnlyCookies?: boolean;
  cookieName?: string;
  localStorageKey?: string;
}

class TokenStorage {
  private options: Required<TokenStorageOptions>;

  constructor(options: TokenStorageOptions = {}) {
    this.options = {
      useHttpOnlyCookies: false,
      cookieName: 'auth_token',
      localStorageKey: 'auth_token',
      ...options,
    };
  }

  /**
   * Сохранить токен
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') return;

    try {
      // 1. Всегда сохраняем в localStorage для JS доступа
      localStorage.setItem(this.options.localStorageKey, token);

      // 2. Дополнительно сохраняем в cookie
      this.setCookie(this.options.cookieName, token, {
        maxAge: 7 * 24 * 60 * 60, // 7 дней
        secure: window.location.protocol === 'https:',
        sameSite: 'strict',
        path: '/',
      });

      console.log('🔒 Token saved to localStorage and cookie');
    } catch (error) {
      console.error('❌ Failed to save token:', error);
    }
  }

  /**
   * Получить токен
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      // Приоритет: localStorage > cookie
      const localStorageToken = localStorage.getItem(this.options.localStorageKey);
      if (localStorageToken) {
        return localStorageToken;
      }

      // Fallback: читаем из cookie
      const cookieToken = this.getCookie(this.options.cookieName);
      if (cookieToken) {
        // Синхронизируем обратно в localStorage
        localStorage.setItem(this.options.localStorageKey, cookieToken);
        return cookieToken;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get token:', error);
      return null;
    }
  }

  /**
   * Удалить токен
   */
  removeToken(): void {
    if (typeof window === 'undefined') return;

    try {
      // Удаляем из localStorage
      localStorage.removeItem(this.options.localStorageKey);

      // Удаляем cookie
      this.setCookie(this.options.cookieName, '', {
        maxAge: -1,
        path: '/',
      });

      console.log('🗑️ Token removed from localStorage and cookie');
    } catch (error) {
      console.error('❌ Failed to remove token:', error);
    }
  }

  /**
   * Проверить наличие токена
   */
  hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Получить информацию о токене (без расшифровки)
   */
  getTokenInfo(): { hasToken: boolean; storage: string[] } {
    const localStorage = typeof window !== 'undefined' 
      ? !!window.localStorage.getItem(this.options.localStorageKey)
      : false;
    
    const cookie = typeof window !== 'undefined' 
      ? !!this.getCookie(this.options.cookieName)
      : false;

    const storage: string[] = [];
    if (localStorage) storage.push('localStorage');
    if (cookie) storage.push('cookie');

    return {
      hasToken: localStorage || cookie,
      storage,
    };
  }

  // Приватные методы для работы с cookies
  private setCookie(name: string, value: string, options: {
    maxAge?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
  } = {}): void {
    let cookieString = `${name}=${value}`;

    if (options.maxAge !== undefined) {
      cookieString += `; Max-Age=${options.maxAge}`;
    }

    if (options.secure) {
      cookieString += '; Secure';
    }

    if (options.sameSite) {
      cookieString += `; SameSite=${options.sameSite}`;
    }

    if (options.path) {
      cookieString += `; Path=${options.path}`;
    }

    document.cookie = cookieString;
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }

    return null;
  }
}

// Создаем глобальный экземпляр
export const tokenStorage = new TokenStorage({
  useHttpOnlyCookies: false, // Пока false, можно включить позже
  cookieName: 'whatsapp_auth_token',
  localStorageKey: 'auth_token',
});

// Дополнительные утилиты
export const TokenUtils = {
  /**
   * Безопасное отображение токена (только первые и последние символы)
   */
  maskToken(token: string | null): string {
    if (!token) return 'Отсутствует';
    if (token.length < 10) return '••••••••';
    
    return `${token.slice(0, 4)}••••${token.slice(-4)}`;
  },

  /**
   * Проверка истечения JWT токена (базовая)
   */
  isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;

      if (!exp) return false; // Токен без времени истечения

      return Date.now() >= exp * 1000;
    } catch (error) {
      console.warn('Cannot parse token:', error);
      return true;
    }
  },

  /**
   * Получение информации из JWT токена
   */
  getTokenPayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      return JSON.parse(atob(parts[1]));
    } catch (error) {
      console.warn('Cannot parse token payload:', error);
      return null;
    }
  },
};