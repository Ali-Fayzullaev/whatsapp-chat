// src/components/TokenManager.tsx
"use client";
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { apiConfig } from '@/lib/api-config';

export function TokenManager() {
  const [currentToken, setCurrentToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || '';
    }
    return '';
  });
  
  const [newToken, setNewToken] = useState('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const checkCurrentToken = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setCurrentToken(token);
      const info = apiConfig.getTokenInfo();
      setTokenInfo(info);
      console.log('🎫 Current token info:', info);
    } else {
      console.log('❌ No token in localStorage');
    }
  };

  const updateToken = () => {
    if (newToken.trim()) {
      localStorage.setItem('auth_token', newToken.trim());
      apiConfig.setAccessToken(newToken.trim());
      setCurrentToken(newToken.trim());
      setNewToken('');
      console.log('✅ Token updated');
      checkCurrentToken();
    }
  };

  const testTokenWithAPI = async () => {
    try {
      const response = await fetch('https://socket.eldor.kz/api/chats', {
        headers: apiConfig.getHeaders()
      });
      
      console.log(`🧪 Token test result: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✅ Token is valid');
      } else {
        console.log('❌ Token is invalid');
      }
      
      return response.ok;
    } catch (error) {
      console.error('❌ Token test failed:', error);
      return false;
    }
  };

  const testWebSocketWithToken = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('❌ No token to test');
      return;
    }

    console.log('🧪 Testing WebSocket with current token...');
    const wsUrl = `wss://socket.eldor.kz/api/ws?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    const timeout = setTimeout(() => {
      console.log('⏰ WebSocket test timeout');
      ws.close();
    }, 10000);

    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully with token!');
      clearTimeout(timeout);
      
      // Отправляем тестовое сообщение
      ws.send(JSON.stringify({ type: 'ping', test: true }));
      
      setTimeout(() => ws.close(), 2000);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket connection failed:', error);
      clearTimeout(timeout);
    };

    ws.onclose = (event) => {
      console.log(`🔚 WebSocket test closed: ${event.code} - ${event.reason || 'no reason'}`);
      clearTimeout(timeout);
    };

    ws.onmessage = (event) => {
      console.log('📨 WebSocket test message received:', event.data);
    };
  };

  return (
    <Card className="p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">🎫 Управление токеном</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Текущий токен:</label>
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono break-all">
            {currentToken ? `${currentToken.substring(0, 50)}...` : 'Токен не найден'}
          </div>
          <Button onClick={checkCurrentToken} size="sm" className="mt-2">
            Проверить текущий токен
          </Button>
        </div>

        {tokenInfo && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <h3 className="font-semibold mb-2">Информация о токене:</h3>
            <div className="text-sm space-y-1">
              <div>Замаскированный: {tokenInfo.masked}</div>
              <div>Истек: {tokenInfo.isExpired ? 'Да ❌' : 'Нет ✅'}</div>
              <div>Пользователь: {tokenInfo.payload?.sub || 'Unknown'}</div>
              <div>ID: {tokenInfo.payload?.user_id || 'Unknown'}</div>
              <div>Истекает: {tokenInfo.payload?.exp ? new Date(tokenInfo.payload.exp * 1000).toLocaleString() : 'Unknown'}</div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Новый токен:</label>
          <Input
            type="text"
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            placeholder="Вставьте новый JWT токен здесь..."
            className="font-mono text-xs"
          />
          <Button onClick={updateToken} disabled={!newToken.trim()} className="mt-2">
            Обновить токен
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={testTokenWithAPI} variant="outline">
            Тест API
          </Button>
          <Button onClick={testWebSocketWithToken} variant="outline">
            Тест WebSocket
          </Button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-sm">
          <strong>Ваш рабочий токен:</strong><br />
          <code className="text-xs">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxfbmFtZSI6IkphaG9uZ2lyIiwidXNlcl9pZCI6Ijk5IiwiZXhwIjoxNzYxNzI1MjUwfQ.nA-NmjABdTGTNBBvjfHCsOf95Ogz-M2sbr0-2Bt0ajw</code>
        </div>
      </div>
    </Card>
  );
}