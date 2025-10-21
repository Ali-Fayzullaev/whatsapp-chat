// src/components/ReplyTester.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ReplyTester() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  const testReplyFeature = () => {
    addLog("🧪 Начинаем тест функции ответов...");
    
    // Проверяем DOM элементы
    const messages = document.querySelectorAll('[data-message-id]');
    addLog(`📱 Найдено сообщений: ${messages.length}`);
    
    if (messages.length === 0) {
      addLog("❌ Сообщения не найдены. Откройте чат с сообщениями.");
      return;
    }

    // Проверяем кнопки ответа
    const replyButtons = document.querySelectorAll('[title="Ответить на сообщение"]');
    addLog(`🔘 Найдено кнопок ответа: ${replyButtons.length}`);
    
    if (replyButtons.length === 0) {
      addLog("❌ Кнопки ответа не найдены. Наведите курсор на сообщение.");
      return;
    }

    // Проверяем composer
    const composer = document.querySelector('textarea[placeholder*="сообщение"]');
    addLog(`📝 Composer найден: ${composer ? '✅' : '❌'}`);

    // Проверяем состояние
    const replyBanner = document.querySelector('[class*="bg-blue-50"]');
    addLog(`💬 Баннер ответа активен: ${replyBanner ? '✅' : '❌'}`);

    addLog("✅ Тест завершен. Попробуйте нажать на кнопку ответа рядом с сообщением.");
  };

  const simulateHover = () => {
    addLog("🖱️ Симулируем наведение на первое сообщение...");
    
    const firstMessage = document.querySelector('.group');
    if (firstMessage) {
      // Добавляем класс hover
      firstMessage.classList.add('hover');
      setTimeout(() => {
        firstMessage.classList.remove('hover');
        addLog("📱 Hover эффект применен и убран");
      }, 3000);
    } else {
      addLog("❌ Элемент сообщения не найден");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Тестер функции ответов</CardTitle>
        <CardDescription>
          Инструмент для диагностики и тестирования функции ответов на сообщения
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testReplyFeature} variant="default">
            🔍 Протестировать функцию
          </Button>
          <Button onClick={simulateHover} variant="outline">
            🖱️ Симулировать hover
          </Button>
          <Button onClick={clearLogs} variant="outline">
            🗑️ Очистить логи
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            📋 Инструкции по тестированию
          </h3>
          <div className="text-sm space-y-1">
            <p>1. <Badge variant="outline">Откройте чат</Badge> с несколькими сообщениями</p>
            <p>2. <Badge variant="outline">Наведите курсор</Badge> на любое сообщение</p>
            <p>3. <Badge variant="outline">Нажмите кнопку ответа</Badge> (иконка стрелки)</p>
            <p>4. <Badge variant="outline">Проверьте</Badge> появление баннера ответа внизу</p>
            <p>5. <Badge variant="outline">Напишите ответ</Badge> и отправьте</p>
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
            <h4 className="font-medium mb-2">📊 Результаты тестирования:</h4>
            <div className="text-sm font-mono space-y-1 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-xs">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            💡 Возможные проблемы:
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Кнопки не видны - наведите курсор на сообщение</li>
            <li>• Клик не работает - проверьте консоль браузера (F12)</li>
            <li>• Баннер не появляется - проверьте состояние replyingTo</li>
            <li>• Сообщение не отправляется - проверьте сетевые запросы</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}