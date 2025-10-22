const DEEPSEEK_API_KEY = 'sk-2e7bb79b255a4f279b281cc7138e5c19';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// src/lib/deepseek.ts
export interface Message {
  text: string;
  author: 'me' | 'them';
  timestamp: number;
}

export interface ChatContext {
  messages: Message[];
  customerName?: string;
  chatId: string;
}

export interface AIResponse {
  intent: 'question' | 'complaint' | 'order' | 'support' | 'greeting' | 'other';
  response?: string;
  confidence: number;
  shouldReply: boolean;
  urgency: 'low' | 'medium' | 'high';
  tags?: string[];
  suggestedActions?: string[];
}

export interface DeepSeekSettings {
  autoReplyDelay: number;
  maxResponseLength: number;
  temperature: number;
  confidence_threshold: number;
}

class DeepSeekAI {
  private enabled: boolean = true;
  private apiKey: string;
  private baseUrl: string = 'https://api.deepseek.com/v1';
  private settings: DeepSeekSettings = {
    autoReplyDelay: 2000,
    maxResponseLength: 300,
    temperature: 0.7,
    confidence_threshold: 0.7,
  };

  constructor() {
    // 🔧 Используем hardcoded ключ для тестирования
    this.apiKey = DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ DeepSeek API key not found');
      this.enabled = false;
    } else {
      console.log('🤖 DeepSeek AI initialized with API key:', this.apiKey.substring(0, 10) + '...');
      this.enabled = true; // 🔧 Включаем по умолчанию если есть ключ
    }
  }

  isEnabled(): boolean {
    return this.enabled && !!this.apiKey;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  updateSettings(newSettings: Partial<DeepSeekSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): DeepSeekSettings {
    return { ...this.settings };
  }

  private async callDeepSeekAPI(messages: any[]): Promise<any> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key is not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: this.settings.temperature,
        max_tokens: this.settings.maxResponseLength,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  private analyzeIntent(message: string): AIResponse['intent'] {
    const text = message.toLowerCase();
    
    if (text.includes('?') || text.includes('как') || text.includes('где') || text.includes('когда') || text.includes('что')) {
      return 'question';
    }
    
    if (text.includes('жалоб') || text.includes('проблем') || text.includes('не работает') || text.includes('плохо')) {
      return 'complaint';
    }
    
    if (text.includes('заказ') || text.includes('купить') || text.includes('цена') || text.includes('стоимость')) {
      return 'order';
    }
    
    if (text.includes('помощь') || text.includes('поддержк') || text.includes('помогите')) {
      return 'support';
    }
    
    if (text.includes('привет') || text.includes('здравствуй') || text.includes('добрый день') || text.includes('добро пожаловать')) {
      return 'greeting';
    }
    
    return 'other';
  }

  private calculateUrgency(message: string, intent: AIResponse['intent']): AIResponse['urgency'] {
    const text = message.toLowerCase();
    
    const urgentWords = ['срочно', 'немедленно', 'критично', 'аварийно', 'экстренно'];
    const highPriorityWords = ['проблема', 'не работает', 'ошибка', 'сломан'];
    
    if (urgentWords.some(word => text.includes(word))) {
      return 'high';
    }
    
    if (intent === 'complaint' || highPriorityWords.some(word => text.includes(word))) {
      return 'high';
    }
    
    if (intent === 'support' || intent === 'question') {
      return 'medium';
    }
    
    return 'low';
  }

  private shouldAutoReply(intent: AIResponse['intent'], urgency: AIResponse['urgency']): boolean {
    console.log('🤖 DeepSeek: Evaluating shouldAutoReply for intent:', intent, 'urgency:', urgency);
    
    // Автоматически отвечаем на приветствия
    if (intent === 'greeting') {
      console.log('🤖 DeepSeek: ✅ Will reply - greeting detected');
      return true;
    }
    
    // Автоматически отвечаем на срочные сообщения
    if (urgency === 'high') {
      console.log('🤖 DeepSeek: ✅ Will reply - high urgency');
      return true;
    }
    
    // Автоматически отвечаем на вопросы о заказах
    if (intent === 'order') {
      console.log('🤖 DeepSeek: ✅ Will reply - order intent');
      return true;
    }
    
    // Автоматически отвечаем на вопросы
    if (intent === 'question') {
      console.log('🤖 DeepSeek: ✅ Will reply - question intent');
      return true;
    }
    
    // Автоматически отвечаем на запросы поддержки
    if (intent === 'support') {
      console.log('🤖 DeepSeek: ✅ Will reply - support intent');
      return true;
    }
    
    // Автоматически отвечаем на жалобы
    if (intent === 'complaint') {
      console.log('🤖 DeepSeek: ✅ Will reply - complaint intent');
      return true;
    }
    
    // 🆕 ДЛЯ ТЕСТИРОВАНИЯ: отвечаем даже на "other" сообщения
    console.log('🤖 DeepSeek: ✅ Will reply - default behavior for testing');
    return true;
    
    // Закомментировано для тестирования
    // console.log('🤖 DeepSeek: ❌ Will not reply - no matching conditions');
    // return false;
  }

  private generateSystemPrompt(context: ChatContext): string {
    return `Ты - ИИ-помощник для службы поддержки WhatsApp чата. 

Контекст:
- Чат ID: ${context.chatId}
- Имя клиента: ${context.customerName || 'Неизвестно'}
- Количество сообщений в истории: ${context.messages.length}

Твоя задача:
1. Анализировать входящие сообщения клиентов
2. Предлагать подходящие ответы на русском языке
3. Определять намерения клиента и уровень срочности
4. Быть вежливым, полезным и профессиональным

Правила:
- Отвечай кратко и по делу (максимум 2-3 предложения)
- Используй дружелюбный, но профессиональный тон
- Если не знаешь ответа, предложи связаться с оператором
- Всегда заканчивай предложением помощи

История чата (последние сообщения):
${context.messages.slice(-5).map(msg => 
  `${msg.author === 'me' ? 'Оператор' : 'Клиент'}: ${msg.text}`
).join('\n')}`;
  }

  async generateResponse(message: string, context: ChatContext): Promise<AIResponse> {
    console.log('🤖 DeepSeek: Analyzing message:', message.substring(0, 100));

    if (!this.isEnabled()) {
      console.log('🤖 DeepSeek: AI disabled, returning minimal response');
      return {
        intent: 'other',
        confidence: 0,
        shouldReply: false,
        urgency: 'low',
      };
    }

    try {
      const intent = this.analyzeIntent(message);
      const urgency = this.calculateUrgency(message, intent);
      const shouldReply = this.shouldAutoReply(intent, urgency);

      console.log('🤖 DeepSeek: Intent analysis:', { intent, urgency, shouldReply });

      let response: string | undefined;
      let confidence = 0.5;

      if (shouldReply) {
        try {
          const systemPrompt = this.generateSystemPrompt(context);
          
          const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ];

          console.log('🤖 DeepSeek: Calling API...');
          const apiResponse = await this.callDeepSeekAPI(messages);
          
          if (apiResponse.choices && apiResponse.choices[0]) {
            response = apiResponse.choices[0].message?.content?.trim();
            confidence = 0.8; // Высокая уверенность для успешных API вызовов
            console.log('🤖 DeepSeek: API response generated successfully');
          }
        } catch (error) {
          console.error('🤖 DeepSeek API error:', error);
          
          // Fallback к простым шаблонным ответам
          response = this.generateFallbackResponse(intent, context.customerName);
          confidence = 0.3;
        }
      }

      const result: AIResponse = {
        intent,
        response,
        confidence,
        shouldReply,
        urgency,
        tags: this.generateTags(message, intent),
        suggestedActions: this.generateSuggestedActions(intent, urgency),
      };

      console.log('🤖 DeepSeek: Analysis complete:', {
        intent: result.intent,
        confidence: result.confidence,
        shouldReply: result.shouldReply,
        urgency: result.urgency,
        hasResponse: !!result.response
      });

      return result;

    } catch (error) {
      console.error('🤖 DeepSeek: Unexpected error:', error);
      
      return {
        intent: 'other',
        confidence: 0,
        shouldReply: false,
        urgency: 'low',
        tags: ['error'],
      };
    }
  }

  private generateFallbackResponse(intent: AIResponse['intent'], customerName?: string): string {
    const name = customerName ? customerName : '';
    
    switch (intent) {
      case 'greeting':
        return `Здравствуйте${name ? `, ${name}` : ''}! Как дела? Чем могу помочь?`;
      
      case 'question':
        return `${name ? `${name}, ` : ''}я постараюсь помочь с вашим вопросом. Сейчас уточню информацию у коллег.`;
      
      case 'complaint':
        return `${name ? `${name}, ` : ''}приношу извинения за доставленные неудобства. Передам ваше обращение специалисту для решения.`;
      
      case 'order':
        return `${name ? `${name}, ` : ''}с радостью помогу с заказом. Сейчас проверю актуальную информацию.`;
      
      case 'support':
        return `${name ? `${name}, ` : ''}конечно помогу! Опишите подробнее вашу ситуацию.`;
      
      default:
        return `${name ? `${name}, ` : ''}спасибо за сообщение! Чем могу быть полезен?`;
    }
  }

  private generateTags(message: string, intent: AIResponse['intent']): string[] {
    const tags: string[] = [intent];
    const text = message.toLowerCase();
    
    if (text.includes('цена') || text.includes('стоимость')) tags.push('pricing');
    if (text.includes('доставка')) tags.push('delivery');
    if (text.includes('возврат')) tags.push('refund');
    if (text.includes('гарантия')) tags.push('warranty');
    if (text.includes('техподдержка')) tags.push('technical');
    
    return tags;
  }

  private generateSuggestedActions(intent: AIResponse['intent'], urgency: AIResponse['urgency']): string[] {
    const actions: string[] = [];
    
    if (urgency === 'high') {
      actions.push('notify_manager');
    }
    
    switch (intent) {
      case 'complaint':
        actions.push('escalate_to_support', 'log_complaint');
        break;
      case 'order':
        actions.push('check_inventory', 'prepare_quote');
        break;
      case 'support':
        actions.push('gather_details', 'check_knowledge_base');
        break;
    }
    
    return actions;
  }
}

// Экспортируем единственный экземпляр
export const deepSeekAI = new DeepSeekAI();