// src/components/AIMonitor.tsx
"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIMonitorProps {
  chatId?: string;
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export function AIMonitor({ chatId }: AIMonitorProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const addLog = (type: LogEntry['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-50), { timestamp, type, message }]); // Keep last 50 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testAIFlow = async () => {
    if (!chatId) {
      addLog('error', 'Нет активного чата для тестирования');
      return;
    }

    addLog('info', '🧪 Начинаем полное тестирование AI системы...');
    
    try {
      // 1. Проверяем DeepSeek API
      addLog('info', '📡 Тестируем DeepSeek API...');
      
      const response = await fetch('/api/ai/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Тест AI системы',
          chatId: chatId,
          context: []
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const aiResult = await response.json();
      addLog('success', `✅ DeepSeek API работает: ${aiResult.aiResponse?.intent || 'OK'}`);

      // 2. Если AI решил отвечать, пробуем отправить
      if (aiResult.aiResponse?.shouldReply) {
        addLog('info', '📤 AI решил ответить, отправляем в WhatsApp...');
        
        const sendResponse = await fetch(`/api/whatsapp/chats/${encodeURIComponent(chatId)}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: aiResult.aiResponse.response,
            ai_generated: true
          })
        });

        if (sendResponse.ok) {
          addLog('success', '✅ Сообщение AI отправлено в WhatsApp!');
        } else {
          const errorText = await sendResponse.text();
          addLog('error', `❌ Ошибка отправки в WhatsApp: ${sendResponse.status} - ${errorText}`);
        }
      } else {
        addLog('warning', '⚠️ AI решил не отвечать на тестовое сообщение');
      }

    } catch (error) {
      addLog('error', `❌ Ошибка тестирования: ${error}`);
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Перехватываем console.log для AI логов
  useEffect(() => {
    if (!isMonitoring) return;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('🤖')) {
        addLog('info', message);
      }
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('🤖')) {
        addLog('error', message);
      }
      originalError(...args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('🤖')) {
        addLog('warning', message);
      }
      originalWarn(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [isMonitoring]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 AI Monitor
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? 'Активен' : 'Остановлен'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Мониторинг работы AI системы в реальном времени
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Управление */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? "destructive" : "default"}
          >
            {isMonitoring ? 'Остановить' : 'Запустить'} мониторинг
          </Button>
          <Button onClick={testAIFlow} disabled={!chatId} variant="outline">
            🧪 Полный тест AI
          </Button>
          <Button onClick={clearLogs} variant="ghost">
            🗑️ Очистить
          </Button>
        </div>

        {!chatId && (
          <div className="text-center text-yellow-600 p-4 bg-yellow-50 rounded">
            ⚠️ Откройте чат для тестирования AI
          </div>
        )}

        {/* Логи */}
        <ScrollArea className="h-64 border rounded p-2">
          <div className="space-y-1 text-sm font-mono">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                Нет логов. Начните мониторинг или запустите тест.
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`${getLogColor(log.type)} text-xs`}>
                  <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Инструкции */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Как тестировать:</strong></p>
          <p>1. Включите мониторинг</p>
          <p>2. Откройте чат и включите AI</p>
          <p>3. Нажмите "📤" в AI статус-баре или "Полный тест AI"</p>
          <p>4. Отправьте сообщение из WhatsApp и наблюдайте логи</p>
        </div>
      </CardContent>
    </Card>
  );
}