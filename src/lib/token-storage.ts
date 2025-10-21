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

// Старый экспорт будет заменен новым в конце файла

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

/**
 * 🔒 ДОПОЛНИТЕЛЬНЫЕ МЕРЫ БЕЗОПАСНОСТИ
 */
export const SecurityEnhancements = {
  /**
   * Очистка токена при закрытии вкладки (опционально)
   */
  setupTokenCleanup() {
    if (typeof window !== 'undefined') {
      // Очистка при выходе из приложения
      window.addEventListener('beforeunload', () => {
        // Можно добавить очистку при необходимости
        // tokenStorage.removeToken();
      });
      
      // Проверка валидности токена каждые 5 минут
      setInterval(() => {
        const token = tokenStorage.getToken();
        if (token && TokenUtils.isTokenExpired(token)) {
          console.log('🔒 Token expired, removing...');
          tokenStorage.removeToken();
          // Можно добавить редирект на страницу входа
          window.location.href = '/auth/login';
        }
      }, 5 * 60 * 1000); // 5 минут
    }
  },

  /**
   * Проверка целостности токена
   */
  validateTokenIntegrity(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Проверяем, что части токена корректны
      JSON.parse(atob(parts[1]));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Шифрование токена в localStorage (простое обфускирование)
   */
  encodeToken(token: string): string {
    // Простое base64 кодирование для обфускации
    return btoa(unescape(encodeURIComponent(token)));
  },

  decodeToken(encodedToken: string): string {
    try {
      return decodeURIComponent(escape(atob(encodedToken)));
    } catch {
      return encodedToken; // Возвращаем как есть, если не удается декодировать
    }
  },
};

/**
 * 🔒 УЛУЧШЕННОЕ ХРАНЕНИЕ ТОКЕНОВ С ДОПОЛНИТЕЛЬНОЙ БЕЗОПАСНОСТЬЮ
 */
class SecureTokenStorage extends TokenStorage {
  private isEncryptionEnabled = false;

  constructor(options: TokenStorageOptions & { enableEncryption?: boolean } = {}) {
    super(options);
    this.isEncryptionEnabled = options.enableEncryption || false;
  }

  /**
   * Сохранить токен с шифрованием
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') return;

    try {
      // Валидация токена
      if (!SecurityEnhancements.validateTokenIntegrity(token)) {
        console.error('❌ Invalid token format');
        return;
      }

      const tokenToStore = this.isEncryptionEnabled 
        ? SecurityEnhancements.encodeToken(token) 
        : token;

      // Сохраняем как обычно
      super.setToken(tokenToStore);
      
      // Инициализируем проверки безопасности
      SecurityEnhancements.setupTokenCleanup();

    } catch (error) {
      console.error('❌ Failed to save secure token:', error);
    }
  }

  /**
   * Получить токен с расшифровкой
   */
  getToken(): string | null {
    const storedToken = super.getToken();
    
    if (!storedToken) return null;

    try {
      const token = this.isEncryptionEnabled 
        ? SecurityEnhancements.decodeToken(storedToken)
        : storedToken;

      // Проверяем валидность токена
      if (TokenUtils.isTokenExpired(token)) {
        console.log('🔒 Token expired, removing...');
        this.removeToken();
        return null;
      }

      return token;
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      this.removeToken(); // Удаляем поврежденный токен
      return null;
    }
  }
}

// 🔹 ЭКСПОРТ ЭКЗЕМПЛЯРОВ
// Обычный экземпляр (текущий)
export const tokenStorage = new TokenStorage();

// Безопасный экземпляр (для будущего использования)
export const secureTokenStorage = new SecureTokenStorage({ 
  enableEncryption: false  // Можно включить при необходимости
});

// Экспорт классов для кастомных настроек
export { TokenStorage, SecureTokenStorage };