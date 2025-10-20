// src/components/AuthenticatedApp.tsx
"use client";

import { useAuth } from '@/providers/AuthProvider';
import { LoginForm } from '@/components/LoginForm';
import { UserHeader } from '@/components/UserHeader';
import { Loader2 } from 'lucide-react';

interface AuthenticatedAppProps {
  children: React.ReactNode;
}

export function AuthenticatedApp({ children }: AuthenticatedAppProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Показываем лоадер во время инициализации
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Инициализация приложения...
          </p>
        </div>
      </div>
    );
  }

  // Если не авторизован, показываем форму входа
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Если авторизован, показываем приложение с заголовком пользователя
  return (
    <div className="min-h-screen">
      <UserHeader />
      {children}
    </div>
  );
}