// src/providers/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/auth-api';
import { apiConfig } from '@/lib/api-config';
import type { AuthState, LoginRequest, User } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    error: null,
  });

  // Функция для инициализации аутентификации
  const initializeAuth = async () => {
    console.log('🔄 Initializing authentication...');
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Проверяем есть ли сохраненный токен
      const savedToken = typeof window !== 'undefined' 
        ? localStorage.getItem('auth_token') 
        : null;
      
      if (savedToken) {
        console.log('🔑 Found saved token, validating...');
        apiConfig.setAccessToken(savedToken);
        
        // Проверяем валидность токена
        const isValid = await authAPI.validateToken();
        
        if (isValid) {
          // Загружаем информацию о пользователе
          const user = await authAPI.getCurrentUser();
          
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user,
            accessToken: savedToken,
            isLoading: false,
          }));
          
          console.log('✅ Authentication restored for user:', user.username);
          return;
        } else {
          console.log('❌ Saved token is invalid, clearing...');
          apiConfig.clearAccessToken();
        }
      }
      
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        isLoading: false,
      }));
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Ошибка инициализации',
      }));
    }
  };

  // Функция авторизации
  const login = async (credentials: LoginRequest) => {
    console.log('🔑 Attempting login for:', credentials.username);
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Выполняем авторизацию
      const response = await authAPI.login(credentials);
      
      // Сохраняем токен
      apiConfig.setAccessToken(response.access_token);
      
      // Загружаем информацию о пользователе
      const user = await authAPI.getCurrentUser();
      
      // Сохраняем refresh token
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isLoading: false,
        error: null,
      }));
      
      console.log('✅ Login successful for:', user.username);
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Ошибка авторизации',
      }));
      throw error;
    }
  };

  // Функция выхода
  const logout = async () => {
    console.log('🚪 Logging out...');
    
    try {
      // Уведомляем сервер о выходе
      await authAPI.logout();
    } catch (error) {
      console.warn('⚠️ Server logout failed, continuing with local logout:', error);
    }
    
    // Очищаем локальное состояние
    apiConfig.clearAccessToken();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refresh_token');
    }
    
    setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
    });
    
    console.log('✅ Logout completed');
  };

  // Обновление информации о пользователе
  const refreshUser = async () => {
    if (!state.isAuthenticated) return;
    
    try {
      const user = await authAPI.getCurrentUser();
      setState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('❌ Failed to refresh user info:', error);
      // Если не удалось обновить данные пользователя, возможно токен истек
      await logout();
    }
  };

  // Инициализация при монтировании
  useEffect(() => {
    initializeAuth();
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}