// src/app/test-reply/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestReplyPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  const testReplyButtons = () => {
    addLog("🧪 Ищем кнопки ответа...");
    
    // Ищем все кнопки ответа в dropdown меню
    const dropdownReplyButtons = document.querySelectorAll('[role="menuitem"]');
    const replyButtons = Array.from(dropdownReplyButtons).filter(btn => 
      btn.textContent?.includes('Ответить')
    );
    
    addLog(`📱 Найдено кнопок "Ответить" в dropdown: ${replyButtons.length}`);
    
    // Ищем элементы с handleReply
    const allButtons = document.querySelectorAll('button, div[role="menuitem"]');
    let replyHandlerCount = 0;
    
    allButtons.forEach(button => {
      const events = (button as any)._reactInternalFiber || (button as any).__reactInternalInstance;
      if (events && button.textContent?.includes('Ответить')) {
        replyHandlerCount++;
        addLog(`✅ Найден элемент с текстом "Ответить": ${button.tagName}`);
      }
    });
    
    addLog(`🔍 Всего элементов с текстом "Ответить": ${replyHandlerCount}`);
    
    // Проверяем состояние чата
    const chatContainer = document.querySelector('[class*="scroll"]');
    if (chatContainer) {
      addLog("✅ Контейнер чата найден");
    } else {
      addLog("❌ Контейнер чата не найден - возможно, чат не открыт");
    }
    
    return replyButtons.length;
  };

  const simulateReplyClick = () => {
    addLog("🖱️ Попытка симулировать клик по кнопке ответа...");
    
    // Найти первое сообщение
    const messageElements = document.querySelectorAll('[class*="group"]');
    if (messageElements.length === 0) {
      addLog("❌ Сообщения не найдены");
      return;
    }
    
    const firstMessage = messageElements[0] as HTMLElement;
    addLog(`📱 Найдено сообщений: ${messageElements.length}`);
    
    // Попробовать вызвать hover
    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    firstMessage.dispatchEvent(mouseEnterEvent);
    addLog("🖱️ Mouseenter event отправлен");
    
    // Подождать немного и поискать кнопку меню
    setTimeout(() => {
      const menuButton = firstMessage.querySelector('button[role="button"]');
      if (menuButton) {
        addLog("✅ Кнопка меню найдена, кликаем...");
        (menuButton as HTMLElement).click();
        
        // Подождать появления меню и кликнуть "Ответить"
        setTimeout(() => {
          const replyMenuItem = document.querySelector('[role="menuitem"]');
          if (replyMenuItem && replyMenuItem.textContent?.includes('Ответить')) {
            addLog("✅ Пункт меню 'Ответить' найден, кликаем...");
            (replyMenuItem as HTMLElement).click();
          } else {
            addLog("❌ Пункт меню 'Ответить' не найден");
          }
        }, 100);
      } else {
        addLog("❌ Кнопка меню не найдена");
      }
    }, 100);
  };

  const checkReplyState = () => {
    addLog("🔍 Проверяем состояние ответа...");
    
    // Ищем preview ответа
    const replyPreview = document.querySelector('[class*="bg-blue-50"]');
    if (replyPreview) {
      addLog("✅ Preview ответа найден!");
      addLog(`📝 Содержимое preview: ${replyPreview.textContent?.slice(0, 100)}...`);
    } else {
      addLog("❌ Preview ответа не найден");
    }
    
    // Ищем Composer
    const composer = document.querySelector('textarea[placeholder*="сообщение"]');
    if (composer) {
      addLog("✅ Composer найден");
    } else {
      addLog("❌ Composer не найден");
    }
  };

  const runFullTest = () => {
    clearLogs();
    addLog("🚀 Запуск полного теста системы ответов...");
    
    // Шаг 1: Проверить кнопки
    const buttonCount = testReplyButtons();
    
    // Шаг 2: Проверить состояние
    setTimeout(() => {
      checkReplyState();
      
      // Шаг 3: Попробовать симулировать клик
      if (buttonCount > 0) {
        setTimeout(() => {
          simulateReplyClick();
          
          // Шаг 4: Проверить результат
          setTimeout(() => {
            checkReplyState();
            addLog("✅ Тест завершен!");
          }, 500);
        }, 200);
      } else {
        addLog("⚠️ Кнопки не найдены, пропускаем симуляцию клика");
      }
    }, 100);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Диагностика функции ответов</CardTitle>
          <CardDescription>
            Инструменты для поиска проблем в системе ответов на сообщения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testReplyButtons} variant="outline">
              🔍 Найти кнопки ответа
            </Button>
            <Button onClick={simulateReplyClick} variant="outline">
              🖱️ Симулировать клик
            </Button>
            <Button onClick={checkReplyState} variant="outline">
              📋 Проверить состояние
            </Button>
            <Button onClick={runFullTest} className="bg-blue-600 hover:bg-blue-700">
              🚀 Полный тест
            </Button>
            <Button onClick={clearLogs} variant="ghost">
              🗑️ Очистить
            </Button>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              📊 Результаты теста
              {testResults.length > 0 && (
                <Badge variant="secondary">{testResults.length} записей</Badge>
              )}
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  Нажмите на кнопку теста, чтобы начать диагностику
                </div>
              ) : (
                <div className="space-y-1 font-mono text-sm">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        result.includes('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        result.includes('❌') ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                        result.includes('⚠️') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              🔧 Инструкция по использованию:
            </h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Откройте чат с сообщениями в соседней вкладке</li>
              <li>Вернитесь на эту страницу и нажмите "Полный тест"</li>
              <li>Проверьте результаты - все шаги должны быть ✅</li>
              <li>Если есть ❌ - найдена проблема в коде</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}