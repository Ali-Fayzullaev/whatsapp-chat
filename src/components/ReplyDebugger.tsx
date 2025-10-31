// src/components/ReplyDebugger.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ReplyDebugger() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Перехватываем console.log для отображения в компоненте
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('🔹') || message.includes('🔘') || message.includes('🐭')) {
        setLogs(prev => {
          const newLogs = [...prev, `${new Date().toLocaleTimeString()}: ${message}`];
          return newLogs.slice(-10); // Показываем только последние 10 логов
        });
      }
      originalLog(...args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-50 bg-red-500 hover:bg-red-600"
        size="sm"
      >
        🐛 Debug
      </Button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 w-80 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm">🐛 Reply Debug</h3>
        <div className="flex gap-2">
          <Button onClick={() => setLogs([])} size="sm" variant="outline">
            Clear
          </Button>
          <Button onClick={() => setIsVisible(false)} size="sm" variant="outline">
            ✕
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 h-48 overflow-y-auto text-xs font-mono">
        {logs.length === 0 ? (
          <div className="text-gray-500">Ожидание логов...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Наведите курсор на сообщение и нажмите кнопку ответа
      </div>
    </div>
  );
}