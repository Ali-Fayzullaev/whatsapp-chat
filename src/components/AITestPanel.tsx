// src/components/AITestPanel.tsx
"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAI } from '@/hooks/useAI';
import { useWhatsAppAPI } from '@/hooks/useWhatsAppAPI';

interface AITestPanelProps {
  chatId: string;
  onClose: () => void;
}

export function AITestPanel({ chatId, onClose }: AITestPanelProps) {
  const [testMessage, setTestMessage] = useState('Есть скидки на Samsung?');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { aiEnabled, getAIResponse, toggleAI } = useAI();
  const { sendMessage } = useWhatsAppAPI();

  const testAI = async () => {
    setIsLoading(true);
    setAiResponse(null);

    try {
      console.log('🧪 Testing AI with message:', testMessage);
      
      const response = await getAIResponse(testMessage, chatId, []);
      
      console.log('🧪 AI Test Response:', response);
      setAiResponse(response);

    } catch (error) {
      console.error('🧪 AI Test Error:', error);
      setAiResponse({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testFullFlow = async () => {
    setIsLoading(true);
    
    try {
      console.log('🧪 Testing full AI flow...');
      
      // Симулируем входящее сообщение
      const mockIncomingMessage = {
        id: 'test-' + Date.now(),
        chatId,
        author: 'them' as const,
        text: testMessage,
        time: new Date().toLocaleTimeString(),
        createdAt: Date.now(),
      };

      console.log('🧪 Mock message created:', mockIncomingMessage);

      const response = await getAIResponse(testMessage, chatId, [mockIncomingMessage]);
      
      if (response?.shouldReply) {
        console.log('🧪 ✅ AI would reply with:', response.response);
      } else {
        console.log('🧪 ❌ AI decided not to reply');
      }

      setAiResponse({
        ...response,
        testMode: true,
        mockMessage: mockIncomingMessage
      });

    } catch (error) {
      console.error('🧪 Full flow test error:', error);
      setAiResponse({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendAIResponse = async () => {
    if (!aiResponse?.response || !aiResponse?.shouldReply) {
      console.log('🚫 No AI response to send or AI decided not to reply');
      return;
    }

    setIsSending(true);
    try {
      console.log('📤 Sending AI response to WhatsApp:', aiResponse.response);
      
      const result = await sendMessage(chatId, aiResponse.response);
      
      if (result.success) {
        console.log('✅ AI response sent successfully!');
        setAiResponse({
          ...aiResponse,
          sent: true,
          sentAt: new Date().toISOString()
        });
      } else {
        console.error('❌ Failed to send AI response:', result.error);
        setAiResponse({
          ...aiResponse,
          sendError: result.error
        });
      }
    } catch (error) {
      console.error('❌ Error sending AI response:', error);
      setAiResponse({
        ...aiResponse,
        sendError: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="fixed top-4 right-4 w-96 z-50 shadow-lg bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🧪 AI Test Panel
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </CardTitle>
        <CardDescription>
          Протестируйте AI ответы перед использованием
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Status */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-sm">AI Status:</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${aiEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {aiEnabled ? '🟢 Включен' : '🔴 Выключен'}
            </span>
            <Button size="sm" onClick={toggleAI}>
              {aiEnabled ? 'Выключить' : 'Включить'}
            </Button>
          </div>
        </div>

        {/* Test Message Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Тестовое сообщение:</label>
          <Input
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Введите сообщение для тестирования AI"
          />
        </div>

        {/* Test Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={testAI}
            disabled={isLoading || !aiEnabled}
            className="flex-1"
          >
            {isLoading ? 'Тестируем...' : '🤖 Тест AI'}
          </Button>
          <Button 
            onClick={testFullFlow}
            disabled={isLoading || !aiEnabled}
            variant="secondary"
            className="flex-1"
          >
            {isLoading ? 'Тестируем...' : '🔄 Полный тест'}
          </Button>
        </div>

        {/* Send AI Response Button */}
        {aiResponse?.response && aiResponse?.shouldReply && !aiResponse?.sent && (
          <Button 
            onClick={sendAIResponse}
            disabled={isSending}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isSending ? '📤 Отправляем...' : '📤 Отправить ответ AI в WhatsApp'}
          </Button>
        )}

        {/* Results */}
        {aiResponse && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Результат:</div>
            <div className="bg-gray-50 p-3 rounded text-sm">
              {aiResponse.error ? (
                <div className="text-red-600">
                  ❌ Ошибка: {aiResponse.error}
                </div>
              ) : (
                <div className="space-y-2">
                  <div><strong>Намерение:</strong> {aiResponse.intent}</div>
                  <div><strong>Ответ:</strong> "{aiResponse.response}"</div>
                  <div><strong>Уверенность:</strong> {(aiResponse.confidence * 100).toFixed(1)}%</div>
                  <div><strong>Отвечать:</strong> {aiResponse.shouldReply ? '✅ Да' : '❌ Нет'}</div>
                  <div><strong>Срочность:</strong> {aiResponse.urgency}</div>
                  {aiResponse.sent && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <div className="text-green-800 font-medium">✅ Сообщение отправлено в {new Date(aiResponse.sentAt).toLocaleTimeString()}</div>
                    </div>
                  )}
                  {aiResponse.sendError && (
                    <div className="mt-2 p-2 bg-red-50 rounded">
                      <div className="text-red-800 font-medium">❌ Ошибка отправки: {aiResponse.sendError}</div>
                    </div>
                  )}
                  {aiResponse.testMode && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <div className="text-blue-800 font-medium">🧪 Тестовый режим активен</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="text-xs text-gray-500">
          Chat ID: {chatId}
        </div>
      </CardContent>
    </Card>
  );
}