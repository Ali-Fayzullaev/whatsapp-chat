// src/components/AuthTester.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Key, User, Lock } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { authAPI } from '@/lib/auth-api';
import { apiConfig } from '@/lib/api-config';

export function AuthTester() {
  const { user, isAuthenticated, logout } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [testCredentials, setTestCredentials] = useState({
    username: 'admin',
    password: 'admin123',
    full_name: 'Тестовый Пользователь',
    user_id: '12'
  });

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setTestResults(prev => [...prev, `[${timestamp}] ${emoji} ${message}`]);
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  const testTokenValidation = async () => {
    addLog('Тестируем валидацию текущего токена...');
    setIsLoading(true);
    
    try {
      const isValid = await authAPI.validateToken();
      addLog(`Валидация токена: ${isValid ? 'успешна' : 'не удалась'}`, isValid ? 'success' : 'error');
      
      if (isValid) {
        const currentUser = await authAPI.getCurrentUser();
        addLog(`Текущий пользователь: ${currentUser.username} (${currentUser.full_name})`, 'success');
      }
    } catch (error) {
      addLog(`Ошибка валидации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    addLog('Тестируем авторизацию с тестовыми данными...');
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(testCredentials);
      addLog('Авторизация успешна!', 'success');
      addLog(`Получен токен типа: ${response.token_type}`, 'info');
      addLog('Токен сохранен в ApiConfig', 'info');
      
      // Обновляем токен в конфигурации
      apiConfig.setAccessToken(response.access_token);
      
      // Тестируем получение информации о пользователе
      const user = await authAPI.getCurrentUser();
      addLog(`Пользователь: ${user.username} (ID: ${user.user_id})`, 'success');
      
    } catch (error) {
      addLog(`Ошибка авторизации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testLogout = async () => {
    addLog('Тестируем выход из системы...');
    setIsLoading(true);
    
    try {
      await logout();
      addLog('Выход из системы выполнен успешно', 'success');
    } catch (error) {
      addLog(`Ошибка при выходе: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testCurrentUser = async () => {
    addLog('Тестируем получение информации о текущем пользователе...');
    setIsLoading(true);
    
    try {
      const currentUser = await authAPI.getCurrentUser();
      addLog(`Пользователь: ${currentUser.username}`, 'success');
      addLog(`Полное имя: ${currentUser.full_name}`, 'info');
      addLog(`ID: ${currentUser.user_id}`, 'info');
    } catch (error) {
      addLog(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-green-600" />
            🔑 Тестер системы аутентификации
          </CardTitle>
          <CardDescription>
            Инструмент для тестирования и отладки системы авторизации
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Текущий статус */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">Статус авторизации</span>
              </div>
              <Badge variant={isAuthenticated ? "default" : "destructive"} className="mt-2">
                {isAuthenticated ? 'Авторизован' : 'Не авторизован'}
              </Badge>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Пользователь</span>
              </div>
              <div className="mt-2 text-sm">
                {user ? `${user.username} (${user.full_name})` : 'Нет данных'}
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Токен</span>
              </div>
              <div className="mt-2 text-sm">
                {apiConfig.getAccessToken() ? '••••••••' : 'Отсутствует'}
              </div>
            </Card>
          </div>

          {/* Тестовые данные */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Тестовые учетные данные</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Username"
                  value={testCredentials.username}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, username: e.target.value }))}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={testCredentials.password}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                />
                <Input
                  placeholder="Full Name"
                  value={testCredentials.full_name}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, full_name: e.target.value }))}
                />
                <Input
                  placeholder="User ID"
                  value={testCredentials.user_id}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, user_id: e.target.value }))}
                />
              </div>
            </div>
            
            {/* Кнопки тестирования */}
            <div className="space-y-3">
              <Label>Тесты API</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={testLogin} 
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Тест логина
                </Button>
                <Button 
                  onClick={testCurrentUser} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  Инфо о юзере
                </Button>
                <Button 
                  onClick={testTokenValidation} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  Валидация токена
                </Button>
                <Button 
                  onClick={testLogout} 
                  disabled={isLoading}
                  variant="destructive"
                  size="sm"
                >
                  Тест logout
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button onClick={clearLogs} variant="outline" size="sm">
              🗑️ Очистить логи
            </Button>
          </div>

          {/* Логи */}
          {testResults.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <h4 className="font-medium mb-3">📊 Логи тестирования:</h4>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Инструкции */}
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">💡 Инструкции по тестированию:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Тест логина:</strong> Проверяет авторизацию с указанными учетными данными</li>
                  <li><strong>Инфо о юзере:</strong> Получает информацию о текущем пользователе через API</li>
                  <li><strong>Валидация токена:</strong> Проверяет актуальность текущего токена</li>
                  <li><strong>Тест logout:</strong> Выполняет выход из системы и очищает токены</li>
                </ul>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  🔧 Все запросы выполняются к серверу <code>socket.eldor.kz</code>
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}