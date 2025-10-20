// src/components/LoginForm.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, Eye, EyeOff, MessageCircle, Shield, Sparkles, Zap } from 'lucide-react';
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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Анимированные частицы
  const [particles, setParticles] = useState<Array<{
    id: number; 
    x: number; 
    y: number; 
    size: number; 
    life: number;
    color: string;
  }>>([]);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  // Создание частиц для анимаций
  const createParticles = useCallback((count: number, x: number, y: number, color = 'cyan') => {
    const colors = ['cyan', 'purple', 'green', 'pink', 'yellow'];
    const newParticles: Array<{
      id: number; 
      x: number; 
      y: number; 
      size: number; 
      life: number;
      color: string;
    }> = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 100,
        size: Math.random() * 4 + 2,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Анимация частиц
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({ 
          ...p, 
          life: p.life - 0.03,
          y: p.y - 1 
        })).filter(p => p.life > 0)
      );
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  // Плавное слежение за курсором
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!cardRef.current) return;

    const cardRect = cardRef.current.getBoundingClientRect();
    const centerX = cardRect.left + cardRect.width / 2;
    const centerY = cardRect.top + cardRect.height / 2;
    
    const x = (e.clientX - centerX) / cardRect.width;
    const y = (e.clientY - centerY) / cardRect.height;
    
    const tiltX = y * 10;
    const tiltY = -x * 10;
    
    cardRef.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(20px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    }
  }, []);

  const handleInputChange = (field: keyof LoginRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));

    // Создаем частицы при активном вводе
    if (e.target.value.length > 0 && e.target.value.length % 2 === 0) {
      createParticles(3, 50, 30);
    }
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
    createParticles(5, 50, 50);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
    createParticles(8, 50, 50, 'purple');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!formData.username || !formData.password) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Анимация успешного входа
      createParticles(20, 50, 30, 'green');
      
      await login(formData);
    } catch (error) {
      console.error('Login error:', error);
      createParticles(10, 50, 30, 'red');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.username && formData.password;
  const loading = isLoading || isSubmitting;

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)
        `
      }}
      onMouseMove={handleMouseMove as any}
      onMouseLeave={handleMouseLeave}
    >
      {/* Анимированные частицы */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.life,
            transform: `scale(${particle.life})`,
            background: {
              cyan: 'linear-gradient(45deg, #06b6d4, #67e8f9)',
              purple: 'linear-gradient(45deg, #a855f7, #c084fc)',
              green: 'linear-gradient(45deg, #10b981, #6ee7b7)',
              pink: 'linear-gradient(45deg, #ec4899, #f9a8d4)',
              yellow: 'linear-gradient(45deg, #f59e0b, #fbbf24)',
              red: 'linear-gradient(45deg, #ef4444, #f87171)'
            }[particle.color] || 'linear-gradient(45deg, #06b6d4, #67e8f9)',
            boxShadow: `0 0 ${particle.size * 2}px rgba(6, 182, 212, ${particle.life * 0.5})`
          }}
        />
      ))}
      
      {/* Фоновая анимация */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
      </div>

      <Card 
        ref={cardRef}
        className="w-full max-w-md relative z-10 transition-all duration-300 ease-out"
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: `
            0 0 80px rgba(59, 130, 246, 0.1),
            0 0 40px rgba(168, 85, 247, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        <CardHeader className="space-y-6 text-center pt-8 pb-6">
          {/* Логотип */}
          <div className="mx-auto w-20 h-20 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-purple-500 to-green-400 rounded-2xl opacity-90 animate-pulse"></div>
            <div className="absolute inset-1 bg-slate-900 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
              <Shield className="w-3 h-3 text-slate-900" />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                WhatsApp Chat
              </span>
            </CardTitle>
            <CardDescription className="text-slate-400 text-lg">
              Безопасный вход в систему
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert 
                variant="destructive" 
                className="border-red-500/30 bg-red-500/10 backdrop-blur-sm animate-shake"
              >
                <AlertDescription className="text-red-300 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  Имя пользователя
                </Label>
                <div className="relative group">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Введите логин"
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    onFocus={() => handleFocus('username')}
                    onBlur={handleBlur}
                    disabled={loading}
                    required
                    className={`
                      h-12 px-4 transition-all duration-300 
                      bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400
                      backdrop-blur-sm rounded-xl
                      focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:bg-slate-800/70
                      group-hover:border-slate-500/50
                      ${focusedField === 'username' ? 'shadow-lg shadow-cyan-400/10' : ''}
                    `}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  Пароль
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Введите пароль"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    onFocus={() => handleFocus('password')}
                    onBlur={handleBlur}
                    disabled={loading}
                    required
                    className={`
                      h-12 px-4 pr-12 transition-all duration-300 
                      bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400
                      backdrop-blur-sm rounded-xl
                      focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 focus:bg-slate-800/70
                      group-hover:border-slate-500/50
                      ${focusedField === 'password' ? 'shadow-lg shadow-purple-400/10' : ''}
                    `}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-10 w-10 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 transition-all duration-300 rounded-lg"
                    onClick={handlePasswordToggle}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/0 via-purple-400/5 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-300 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                    Полное имя
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Опционально"
                    value={formData.full_name}
                    onChange={handleInputChange('full_name')}
                    onFocus={() => handleFocus('fullName')}
                    onBlur={handleBlur}
                    disabled={loading}
                    className="h-12 px-4 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 backdrop-blur-sm rounded-xl focus:border-green-400/50 focus:ring-2 focus:ring-green-400/20 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userId" className="text-slate-300 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                    ID пользователя
                  </Label>
                  <Input
                    id="userId"
                    type="text"
                    placeholder="Опционально"
                    value={formData.user_id}
                    onChange={handleInputChange('user_id')}
                    onFocus={() => handleFocus('userId')}
                    onBlur={handleBlur}
                    disabled={loading}
                    className="h-12 px-4 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 backdrop-blur-sm rounded-xl focus:border-pink-400/50 focus:ring-2 focus:ring-pink-400/20 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className={`
                w-full h-14 font-semibold text-lg rounded-xl transition-all duration-300 transform
                ${isFormValid && !loading 
                  ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-green-500 hover:from-cyan-600 hover:via-purple-600 hover:to-green-600 hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-cyan-500/25' 
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }
                disabled:transform-none disabled:hover:scale-100 group relative overflow-hidden
              `}
              disabled={!isFormValid || loading}
            >
              {/* Фоновая анимация кнопки */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Вход в систему...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Войти
                  </>
                )}
              </div>
            </Button>
          </form>

          <div className="mt-8 text-center">
            <div className="relative overflow-hidden rounded-2xl p-6" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <div className="relative z-10">
                <p className="font-semibold text-cyan-300 mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Системная информация
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Используйте учетные данные, предоставленные<br />
                  администратором системы для безопасного доступа
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-green-500/5 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}