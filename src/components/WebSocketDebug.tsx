// src/components/WebSocketDebug.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink } from "lucide-react";
import { apiConfig } from "@/lib/api-config";

export function WebSocketDebug() {
  const [status, setStatus] = useState<string>("Не проверено");
  const [logs, setLogs] = useState<string[]>([]);
  const [wsUrl, setWsUrl] = useState<string>("");
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const copyDiagnosticInfo = () => {
    const info = {
      timestamp: new Date().toISOString(),
      wsUrl: wsUrl,
      userAgent: navigator.userAgent,
      status: status,
      logs: logs,
      diagnosticInfo: diagnosticInfo
    };
    navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    addLog("📋 Диагностическая информация скопирована в буфер обмена");
  };

  const testWebSocket = async () => {
    setStatus("Проверяю...");
    setLogs([]);
    addLog("🚀 Начинаю диагностику WebSocket");

    // Получаем информацию о токене
    try {
      const tokenInfo = apiConfig.getTokenInfo();
      addLog(`🔑 Токен: ${tokenInfo.masked}`);
      addLog(`⏰ Токен истекает: ${tokenInfo.isExpired ? 'ДА' : 'НЕТ'}`);
      
      if (tokenInfo.payload) {
        addLog(`👤 Пользователь: ${tokenInfo.payload.full_name || 'неизвестно'}`);
      }
    } catch (e) {
      addLog(`❌ Ошибка получения токена: ${e}`);
    }

    // Проверим токен через API
    addLog("🌐 Проверяю токен через API...");
    try {
      const testResponse = await fetch('/api/whatsapp/chats');
      addLog(`API тест: ${testResponse.ok ? '✅ OK' : '❌ FAILED'} (${testResponse.status})`);
    } catch (e) {
      addLog(`❌ API недоступен: ${e}`);
    }

    const currentWsUrl = apiConfig.getWebSocketUrlWithToken();
    setWsUrl(currentWsUrl);
    addLog(`🔗 WebSocket URL: ${currentWsUrl.replace(/token=[^&]+/, 'token=***')}`);

    // Дополнительная диагностика
    const diagnostic = {
      baseUrl: apiConfig.getBaseUrl(),
      websocketSupported: 'WebSocket' in window,
      protocol: window.location.protocol,
      host: window.location.host,
      userAgent: navigator.userAgent.substring(0, 100) + '...'
    };
    setDiagnosticInfo(diagnostic);
    addLog(`🔧 Browser: ${diagnostic.websocketSupported ? 'Поддерживает WS' : 'НЕ поддерживает WS'}`);

    try {
      const ws = new WebSocket(currentWsUrl);
      
      ws.onopen = () => {
        addLog("✅ WebSocket подключен!");
        setStatus("Подключен");
        ws.close();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error details:', error);
        addLog(`❌ Ошибка WebSocket: ${JSON.stringify(error)}`);
        setStatus("Ошибка подключения");
      };

      ws.onclose = (event) => {
        const closeReasons: Record<number, string> = {
          1000: "Нормальное закрытие",
          1001: "Конечная точка отключилась",
          1002: "Ошибка протокола",
          1003: "Неподдерживаемые данные",
          1005: "Код не получен",
          1006: "Соединение закрыто ненормально (возможно проблемы с сетью/сервером)",
          1007: "Недопустимые данные",
          1008: "Нарушение политики",
          1009: "Слишком большое сообщение",
          1010: "Расширение не согласовано",
          1011: "Внутренняя ошибка сервера",
          1012: "Перезагрузка сервера",
          1013: "Попробуйте позже",
        };
        
        const reason = closeReasons[event.code] || `Неизвестная причина (код ${event.code})`;
        addLog(`🔌 WebSocket закрыт: ${reason}`);
        addLog(`📊 Детали: код=${event.code}, чистое=${event.wasClean}, причина="${event.reason}"`);
        
        if (event.code === 1006) {
          addLog("💡 Код 1006 означает проблемы с сетью или что сервер WebSocket недоступен");
          addLog("🔍 Проверьте: 1) Запущен ли WebSocket сервер 2) Правильный ли URL 3) Есть ли сетевые блокировки");
        }
        
        if (event.code !== 1000) {
          setStatus(`Ошибка: ${reason}`);
        }
      };

      // Таймаут на случай зависания
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          addLog("⏰ Таймаут подключения");
          ws.close();
          setStatus("Таймаут");
        }
      }, 10000);

    } catch (error) {
      addLog(`❌ Исключение при создании WebSocket: ${error}`);
      setStatus("Ошибка создания");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-medium">WebSocket диагностика</h3>
        <Badge variant={status === "Подключен" ? "default" : "destructive"}>
          {status}
        </Badge>
      </div>
      
      <div className="flex gap-2 mb-3">
        <Button onClick={testWebSocket}>
          Проверить подключение
        </Button>
        
        {logs.length > 0 && (
          <Button variant="outline" size="sm" onClick={copyDiagnosticInfo}>
            <Copy className="h-3 w-3 mr-1" />
            Копировать диагностику
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('https://socket.eldor.kz', '_blank')}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Проверить сервер
        </Button>
      </div>

      {logs.length > 0 && (
        <div className="text-xs bg-black text-green-400 p-2 rounded font-mono max-h-48 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className={log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : ''}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}