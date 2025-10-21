// src/hooks/useAI.ts
import { useState, useEffect, useCallback } from 'react';
import type { AIResponse, ChatContext } from '@/lib/deepseek';
import type { Message } from '@/components/chat/types';

export interface AISettings {
  enabled: boolean;
  autoReplyDelay: number;
  maxResponseLength: number;
  temperature: number;
  confidence_threshold: number;
}

export function useAI() {
  // 🔧 AI включен по умолчанию для тестирования
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<AISettings>({
    enabled: true, // 🔧 Включен по умолчанию
    autoReplyDelay: 2000,
    maxResponseLength: 300,
    temperature: 0.7,
    confidence_threshold: 0.7,
  });

  // Загрузка настроек при инициализации
  useEffect(() => {
    loadAISettings();
  }, []);

  /**
   * Загрузить настройки AI
   */
  const loadAISettings = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/deepseek');
      
      if (response.ok) {
        const data = await response.json();
        setAiEnabled(data.enabled);
        setSettings(prev => ({ ...prev, ...data.settings }));
        console.log('🤖 AI settings loaded:', data);
      } else {
        console.log('🤖 AI API not available, using default settings (AI enabled)');
        // Если API недоступен, оставляем AI включенным
        setAiEnabled(true);
      }
    } catch (error) {
      console.log('🤖 AI API error, using default settings (AI enabled):', error);
      // При ошибке API оставляем AI включенным
      setAiEnabled(true);
    }
  }, []);

  /**
   * Обновить настройки AI
   */
  const updateAISettings = useCallback(async (newSettings: Partial<AISettings>) => {
    try {
      const response = await fetch('/api/ai/deepseek', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: newSettings.enabled,
          settings: newSettings,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiEnabled(data.enabled);
        setSettings(prev => ({ ...prev, ...newSettings }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to update AI settings:', error);
      return false;
    }
  }, []);

  /**
   * Получить AI ответ на сообщение
   */
  const getAIResponse = useCallback(async (
    message: string,
    chatId: string,
    messages: Message[] = []
  ): Promise<AIResponse | null> => {
    
    if (!aiEnabled || isProcessing) {
      return null;
    }

    setIsProcessing(true);

    try {
      // Подготавливаем контекст из сообщений
      const chatContext: Partial<ChatContext> = {
        messages: messages.slice(-10).map(msg => ({
          text: msg.text,
          author: msg.author,
          timestamp: msg.createdAt,
        })),
        chatId,
      };

      const response = await fetch('/api/ai/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          chatId,
          context: chatContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('🤖 AI response received:', data.aiResponse);
        return data.aiResponse;
      }

      return null;

    } catch (error) {
      console.error('🤖 AI request failed:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [aiEnabled, isProcessing]);

  /**
   * Автоматический ответ с задержкой
   */
  const processAutoReply = useCallback(async (
    message: string,
    chatId: string,
    messages: Message[],
    onReply: (text: string) => Promise<void>
  ): Promise<boolean> => {
    
    if (!aiEnabled) return false;

    console.log('🤖 Processing auto-reply for:', message);

    const aiResponse = await getAIResponse(message, chatId, messages);
    
    if (!aiResponse?.shouldReply) {
      console.log('🤖 AI decided not to reply');
      return false;
    }

    // Задержка перед ответом (имитация человека)
    await new Promise(resolve => setTimeout(resolve, settings.autoReplyDelay));

    try {
      await onReply(aiResponse.response);
      console.log('🤖 Auto-reply sent:', aiResponse.response);
      return true;
    } catch (error) {
      console.error('🤖 Failed to send auto-reply:', error);
      return false;
    }
  }, [aiEnabled, getAIResponse, settings.autoReplyDelay]);

  /**
   * Переключить состояние AI
   */
  const toggleAI = useCallback(() => {
    updateAISettings({ enabled: !aiEnabled });
  }, [aiEnabled, updateAISettings]);

  return {
    // Состояние
    aiEnabled,
    isProcessing,
    settings,
    
    // Действия
    getAIResponse,
    processAutoReply,
    toggleAI,
    updateAISettings,
    loadAISettings,
  };
}