// src/components/TokenStorageTester.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Database, 
  Cookie, 
  Shield, 
  Clock, 
  Info,
  CheckCircle,
  XCircle,
  Copy,
  RefreshCw
} from 'lucide-react';
import { tokenStorage, TokenUtils } from '@/lib/token-storage';
import { apiConfig } from '@/lib/api-config';

export function TokenStorageTester() {
  const [testToken, setTestToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZnVsbF9uYW1lIjoidGVzdCIsInVzZXJfaWQiOiIxMiIsImV4cCI6MTc2MDk1MzAzMH0.test123');
  const [tokenInfo, setTokenInfo] = useState(apiConfig.getTokenInfo());
  
  const refreshTokenInfo = () => {
    setTokenInfo(apiConfig.getTokenInfo());
  };

  const handleSetToken = () => {
    tokenStorage.setToken(testToken);
    refreshTokenInfo();
  };

  const handleClearToken = () => {
    tokenStorage.removeToken();
    refreshTokenInfo();
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(tokenInfo.current);
      alert('Токен скопирован в буфер обмена');
    } catch (error) {
      console.error('Failed to copy token:', error);
    }
  };

  const testLocalStorageOnly = () => {
    localStorage.setItem('auth_token', 'test-localStorage-token');
    refreshTokenInfo();
  };

  const testCookieOnly = () => {
    document.cookie = 'whatsapp_auth_token=test-cookie-token; Max-Age=3600; Path=/';
    localStorage.removeItem('auth_token');
    refreshTokenInfo();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            🔐 Тестер системы хранения токенов
          </CardTitle>
          <CardDescription>
            Гибридная система: localStorage + Cookies для максимальной надежности
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Текущий статус */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">Токен</span>
              </div>
              <div className="text-xs font-mono">
                {tokenInfo.masked}
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">localStorage</span>
              </div>
              <Badge variant={tokenInfo.storage.storage.includes('localStorage') ? "default" : "outline"}>
                {tokenInfo.storage.storage.includes('localStorage') ? 'Есть' : 'Нет'}
              </Badge>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cookie className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-sm">Cookie</span>
              </div>
              <Badge variant={tokenInfo.storage.storage.includes('cookie') ? "default" : "outline"}>
                {tokenInfo.storage.storage.includes('cookie') ? 'Есть' : 'Нет'}
              </Badge>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="font-medium text-sm">Статус</span>
              </div>
              <div className="flex items-center gap-1">
                {tokenInfo.isExpired ? (
                  <XCircle className="h-3 w-3 text-red-500" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                <span className="text-xs">
                  {tokenInfo.isExpired ? 'Истек' : 'Активен'}
                </span>
              </div>
            </Card>
          </div>

          {/* Информация о токене */}
          {tokenInfo.payload && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Информация из токена (JWT payload):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Subject:</strong> {tokenInfo.payload.sub || 'N/A'}
                </div>
                <div>
                  <strong>User ID:</strong> {tokenInfo.payload.user_id || 'N/A'}
                </div>
                <div>
                  <strong>Full Name:</strong> {tokenInfo.payload.full_name || 'N/A'}
                </div>
                {tokenInfo.payload.exp && (
                  <div className="md:col-span-3">
                    <strong>Expires:</strong> {new Date(tokenInfo.payload.exp * 1000).toLocaleString()}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Управление токенами */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">🧪 Тестирование токенов</Label>
              
              <div className="space-y-3">
                <div>
                  <Label>Тестовый токен</Label>
                  <Input
                    value={testToken}
                    onChange={(e) => setTestToken(e.target.value)}
                    placeholder="Введите JWT токен..."
                    className="font-mono text-xs"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSetToken} size="sm" className="flex-1">
                    💾 Сохранить токен
                  </Button>
                  <Button onClick={handleClearToken} variant="destructive" size="sm" className="flex-1">
                    🗑️ Очистить
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">🔧 Специальные тесты</Label>
              
              <div className="space-y-2">
                <Button onClick={testLocalStorageOnly} variant="outline" size="sm" className="w-full">
                  <Database className="h-3 w-3 mr-2" />
                  Только localStorage
                </Button>
                <Button onClick={testCookieOnly} variant="outline" size="sm" className="w-full">
                  <Cookie className="h-3 w-3 mr-2" />
                  Только Cookie
                </Button>
                <Button onClick={refreshTokenInfo} variant="outline" size="sm" className="w-full">
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Обновить инфо
                </Button>
                <Button onClick={handleCopyToken} variant="outline" size="sm" className="w-full">
                  <Copy className="h-3 w-3 mr-2" />
                  Копировать токен
                </Button>
              </div>
            </div>
          </div>

          {/* Преимущества гибридного подхода */}
          <Card className="p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Преимущества гибридного хранения:
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700 dark:text-green-300">
              <div>
                <strong>✅ Надежность:</strong> Дублирование в localStorage и Cookie
              </div>
              <div>
                <strong>✅ Производительность:</strong> Быстрый доступ через localStorage
              </div>
              <div>
                <strong>✅ Совместимость:</strong> Работает с SSR через Cookie
              </div>
              <div>
                <strong>✅ Безопасность:</strong> Автоматическая проверка истечения
              </div>
            </div>
          </Card>

          {/* Техническая информация */}
          <details className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer font-medium">
              🔍 Техническая информация
            </summary>
            <div className="mt-3 space-y-2 text-sm font-mono">
              <div><strong>Storage locations:</strong> {tokenInfo.storage.storage.join(', ')}</div>
              <div><strong>Has token:</strong> {tokenInfo.storage.hasToken.toString()}</div>
              <div><strong>Is expired:</strong> {tokenInfo.isExpired.toString()}</div>
              <div><strong>Raw token:</strong> <span className="break-all">{tokenInfo.current}</span></div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}