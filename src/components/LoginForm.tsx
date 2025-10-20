// src/components/LoginForm.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, MessageCircle } from 'lucide-react';
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
    
    if (!formData.username || !formData.password) {
      return;
    }

    try {
      await login(formData);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const isFormValid = formData.username && formData.password;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
      {/* WhatsApp фон */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00a884] to-[#008069] h-60"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Логотип WhatsApp */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <MessageCircle className="w-10 h-10 text-[#00a884]" />
          </div>
          <h1 className="text-2xl font-normal text-white mb-2">WhatsApp Chat</h1>
          <p className=" text-sm text-black/80">Войдите в свой аккаунт</p>
        </div>

        {/* Форма входа */}
        <Card className="bg-white shadow-2xl border-0 rounded-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-[#111b21] font-normal">
              Добро пожаловать
            </CardTitle>
            <CardDescription className="text-[#667781]">
              Введите данные для входа в систему
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Имя пользователя */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-[#111b21]">
                    Имя пользователя
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Введите имя пользователя"
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    disabled={isLoading}
                    required
                    className="h-12 px-4 border-[#d1d7db] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] bg-white"
                  />
                </div>

                {/* Пароль */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-[#111b21]">
                    Пароль
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Введите пароль"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      disabled={isLoading}
                      required
                      className="h-12 px-4 pr-12 border-[#d1d7db] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-[#667781] hover:text-[#111b21] hover:bg-gray-100"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Дополнительные поля */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-[#111b21]">
                      Полное имя
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Опционально"
                      value={formData.full_name}
                      onChange={handleInputChange('full_name')}
                      disabled={isLoading}
                      className="h-10 px-3 text-sm border-[#d1d7db] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userId" className="text-sm font-medium text-[#111b21]">
                      ID пользователя
                    </Label>
                    <Input
                      id="userId"
                      type="text"
                      placeholder="Опционально"
                      value={formData.user_id}
                      onChange={handleInputChange('user_id')}
                      disabled={isLoading}
                      className="h-10 px-3 text-sm border-[#d1d7db] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Кнопка входа */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#00a884] hover:bg-[#008069] text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </Button>
            </form>

            {/* Информация */}
            <div className="mt-6 text-center">
              <div className="bg-[#f0f2f5] rounded-lg p-3">
                <p className="text-xs text-[#667781] leading-relaxed">
                  Используйте учетные данные, предоставленные администратором системы для безопасного доступа к WhatsApp чату.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Нижний текст */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-xs">
            WhatsApp Chat Management System
          </p>
        </div>
      </div>
    </div>
  );
}