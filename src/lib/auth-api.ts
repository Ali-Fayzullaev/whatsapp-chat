// src/lib/auth-api.ts
import { apiConfig } from './api-config';
import type { LoginRequest, LoginResponse, User } from '@/types/auth';

class AuthAPI {
  private static instance: AuthAPI;
  private baseUrl = 'https://socket.eldor.kz';

  private constructor() {}

  static getInstance(): AuthAPI {
    if (!AuthAPI.instance) {
      AuthAPI.instance = new AuthAPI();
    }
    return AuthAPI.instance;
  }

  /**
   * Авторизация пользователя
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔑 Logging in user:', credentials.username);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }

      const data: LoginResponse = await response.json();
      console.log('✅ Login successful, token type:', data.token_type);
      
      return data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error instanceof Error ? error : new Error('Неизвестная ошибка авторизации');
    }
  }

  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    console.log('🚪 Logging out user...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: apiConfig.getHeaders(),
      });

      if (!response.ok) {
        console.warn('⚠️ Logout request failed, but proceeding with local logout');
      } else {
        console.log('✅ Successfully logged out from server');
      }
    } catch (error) {
      console.warn('⚠️ Logout request error, but proceeding with local logout:', error);
    }
  }

  /**
   * Получение информации о текущем пользователе
   */
  async getCurrentUser(): Promise<User> {
    console.log('👤 Fetching current user info...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: apiConfig.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }

      const user: User = await response.json();
      console.log('✅ Current user loaded:', user.username);
      
      return user;
    } catch (error) {
      console.error('❌ Failed to fetch user info:', error);
      throw error instanceof Error ? error : new Error('Не удалось загрузить информацию о пользователе');
    }
  }

  /**
   * Проверка валидности токена
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      console.log('🔒 Token validation failed:', error);
      return false;
    }
  }
}

export const authAPI = AuthAPI.getInstance();