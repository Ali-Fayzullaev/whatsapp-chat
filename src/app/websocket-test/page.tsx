"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/providers/WebSocketProvider";

export default function WebSocketTestPage() {
  const { 
    isConnected, 
    connectionState, 
    lastMessage, 
    reconnect, 
    sendMessage 
  } = useWebSocket();
  
  const [connectionHistory, setConnectionHistory] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('auth_token'));
  }, []);

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionHistory(prev => 
      [`${timestamp}: ${connectionState}`, ...prev.slice(0, 9)]
    );
  }, [connectionState]);

  const handleTestPing = () => {
    sendMessage({ type: 'test_ping', timestamp: Date.now() });
  };

  const handleForceReconnect = () => {
    reconnect();
    setConnectionHistory(prev => 
      [`${new Date().toLocaleTimeString()}: Manual reconnect triggered`, ...prev.slice(0, 8)]
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">WebSocket Test</h1>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          ← Назад к чатам
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Connection:</span>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {connectionState}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Token Present:</span>
              <Badge variant={token ? "default" : "secondary"}>
                {token ? "Yes" : "No"}
              </Badge>
            </div>
            
            {token && (
              <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <strong>Token:</strong> {token.substring(0, 30)}...
              </div>
            )}
            
            <div className="space-y-2">
              <Button onClick={handleForceReconnect} className="w-full">
                🔄 Force Reconnect
              </Button>
              <Button 
                onClick={handleTestPing} 
                disabled={!isConnected}
                variant="secondary"
                className="w-full"
              >
                📤 Send Test Ping
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connection History */}
        <Card>
          <CardHeader>
            <CardTitle>Connection History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {connectionHistory.map((entry, idx) => (
                <div 
                  key={idx} 
                  className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  {entry}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Message */}
      {lastMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Last WebSocket Message</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
              {JSON.stringify(lastMessage, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      
      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>WebSocket URL:</strong><br/>
              <code className="text-xs">wss://socket.eldor.kz/api/ws</code>
            </div>
            <div>
              <strong>Features:</strong><br/>
              <code className="text-xs">WEBSOCKET_ENABLED: true</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}