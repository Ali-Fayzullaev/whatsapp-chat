// src/components/TestApi.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TestApi() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testChats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/chats');
      const data = await res.json();
      setResult({ type: 'chats', data });
    } catch (error) {
      setResult({ type: 'chats', error });
    } finally {
      setLoading(false);
    }
  };

  const testMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/chats/77751101800@c.us/messages');
      const data = await res.json();
      setResult({ type: 'messages', data });
    } catch (error) {
      setResult({ type: 'messages', error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Тест API</h3>
      <div className="flex gap-2 mb-4">
        <Button onClick={testChats} disabled={loading}>Тест чатов</Button>
        <Button onClick={testMessages} disabled={loading}>Тест сообщений</Button>
      </div>
      {result && (
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}