// src/components/DevDiagnostic.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Copy, Bug } from "lucide-react";
import { apiConfig } from "@/lib/api-config";

export function DevDiagnostic() {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  const generateDiagnostic = async () => {
    const data = {
      timestamp: new Date().toISOString(),
      frontend: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        host: window.location.host,
        websocketSupported: 'WebSocket' in window,
      },
      api: {
        baseUrl: apiConfig.getBaseUrl(),
        websocketUrl: apiConfig.getWebSocketUrl(),
        tokenInfo: apiConfig.getTokenInfo(),
      },
      tests: {
        httpApi: null as any,
        websocketTest: null as any,
      }
    };

    // Тест HTTP API
    try {
      const httpStart = Date.now();
      const httpResponse = await fetch('/api/whatsapp/chats');
      const httpEnd = Date.now();
      
      data.tests.httpApi = {
        status: httpResponse.status,
        ok: httpResponse.ok,
        responseTime: httpEnd - httpStart,
        headers: Object.fromEntries(httpResponse.headers.entries()),
      };
    } catch (error) {
      data.tests.httpApi = { error: String(error) };
    }

    // Тест WebSocket
    try {
      const wsUrl = apiConfig.getWebSocketUrlWithToken();
      const wsPromise = new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        const startTime = Date.now();
        
        ws.onopen = () => {
          resolve({
            status: 'connected',
            responseTime: Date.now() - startTime,
            readyState: ws.readyState,
          });
          ws.close();
        };
        
        ws.onerror = (error) => {
          reject({ error: 'connection_failed', event: error });
        };
        
        ws.onclose = (event) => {
          if (event.code !== 1000) {
            reject({ 
              error: 'closed_abnormally', 
              code: event.code, 
              reason: event.reason,
              wasClean: event.wasClean 
            });
          }
        };
        
        setTimeout(() => reject({ error: 'timeout' }), 10000);
      });
      
      data.tests.websocketTest = await wsPromise;
    } catch (error) {
      data.tests.websocketTest = { error };
    }

    setDiagnosticData(data);
    setIsOpen(true);
  };

  const copyDiagnostic = () => {
    navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2));
    alert('Диагностика скопирована в буфер обмена');
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={generateDiagnostic}
        className="text-orange-600 border-orange-600 hover:bg-orange-50"
      >
        <Bug className="h-3 w-3 mr-1" />
        Диагностика для разработчика
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Диагностика для Backend разработчика</DialogTitle>
          </DialogHeader>
          
          {diagnosticData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="outline">
                  WebSocket: {diagnosticData.tests.websocketTest?.status === 'connected' ? '✅ Работает' : '❌ Не работает'}
                </Badge>
                <Badge variant="outline">
                  HTTP API: {diagnosticData.tests.httpApi?.ok ? '✅ Работает' : '❌ Не работает'}
                </Badge>
                <Button size="sm" onClick={copyDiagnostic}>
                  <Copy className="h-3 w-3 mr-1" />
                  Копировать JSON
                </Button>
              </div>

              {/* WebSocket ошибка код 1006 - специальное объяснение */}
              {diagnosticData.tests.websocketTest?.error?.code === 1006 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">🚨 WebSocket код 1006 - Проблема с сервером</h4>
                  <p className="text-sm text-red-700 mb-2">
                    Код 1006 означает, что соединение было закрыто ненормально. Возможные причины:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 ml-4">
                    <li>• WebSocket сервер не запущен на <code>wss://socket.eldor.kz/ws</code></li>
                    <li>• Сервер не поддерживает WebSocket протокол</li>
                    <li>• Проблемы с SSL/TLS сертификатом</li>
                    <li>• Блокировка файрволом или прокси</li>
                    <li>• Неправильный токен авторизации</li>
                  </ul>
                </div>
              )}

              <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                <pre>{JSON.stringify(diagnosticData, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}