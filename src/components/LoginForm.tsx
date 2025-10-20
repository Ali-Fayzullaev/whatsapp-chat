// src/components/LoginForm.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import type { LoginRequest } from '@/types/auth';

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
    full_name: '',
    user_id: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof LoginRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Базовая валидация
    if (!formData.username || !formData.password) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login(formData);
      // После успешного входа пользователь будет перенаправлен
    } catch (error) {
      console.error('Login error:', error);
      // Ошибка уже обрабатывается в AuthProvider
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.username && formData.password;
  const loading = isLoading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            <LogIn className="inline h-6 w-6 mr-2 text-green-600" />
            Вход в систему
          </CardTitle>
          <CardDescription>
            Введите свои учетные данные для доступа к WhatsApp чату
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                placeholder="Введите имя пользователя"
                value={formData.username}
                onChange={handleInputChange('username')}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Полное имя</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Введите полное имя"
                value={formData.full_name}
                onChange={handleInputChange('full_name')}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">ID пользователя</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Введите ID пользователя"
                value={formData.user_id}
                onChange={handleInputChange('user_id')}
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Войти
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                💡 Подсказка
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Используйте учетные данные, предоставленные администратором системы
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}