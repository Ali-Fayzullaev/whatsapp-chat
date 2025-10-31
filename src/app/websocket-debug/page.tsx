"use client";
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WebSocketConnectionStatus } from '@/components/WebSocketConnectionStatus';

export default function WebSocketDebugPage() {
  const { 
    isConnected, 
    connectionState, 
    lastMessage, 
    sendMessage, 
    reconnect, 
    startConnection 
  } = useWebSocket();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('auth_token'));
  }, []);

  useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev.slice(-9), lastMessage]);
    }
  }, [lastMessage]);

  const handleSendPing = () => {
    sendMessage({ type: 'ping', timestamp: Date.now() });
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">WebSocket Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <WebSocketConnectionStatus />
            </div>
            <div>
              <strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>State:</strong> {connectionState}
            </div>
            <div>
              <strong>Token Present:</strong> {token ? '✅ Yes' : '❌ No'}
            </div>
            {token && (
              <div className="text-xs">
                <strong>Token:</strong> {token.substring(0, 20)}...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls Card */}
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={reconnect} className="w-full">
              Reconnect WebSocket
            </Button>
            <Button onClick={startConnection} className="w-full">
              Start Connection
            </Button>
            <Button onClick={handleSendPing} disabled={!isConnected} className="w-full">
              Send Ping
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Messages Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent WebSocket Messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm"
              >
                <div className="font-mono text-xs text-gray-500">
                  {new Date().toLocaleTimeString()}
                </div>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(msg, null, 2)}
                </pre>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-gray-500 italic">
                No messages received yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}