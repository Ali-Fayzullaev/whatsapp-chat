// src/app/api/whatsapp/chats/[chatId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiConfig } from '@/lib/api-config';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { chatId } = resolvedParams;
    
    console.log('=== DELETE CHAT API ===');
    console.log('Chat ID:', chatId);

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing chatId' },
        { status: 400 }
      );
    }

    // 🔹 Получаем токен авторизации из заголовка
    const authHeader = req.headers.get('authorization');
    let token = '';
    
    console.log("Auth header received:", authHeader ? 'present' : 'missing');
    
    if (authHeader) {
      token = authHeader.replace('Bearer ', '');
    } else {
      token = apiConfig.getAccessToken() || '';
    }

    console.log("Token to use:", token ? 'present' : 'missing');

    if (!token) {
      console.error('No access token available');
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Строим URL для Green API
    const baseUrl = apiConfig.getBaseUrl();
    console.log("Base URL from apiConfig:", baseUrl);
    
    if (!baseUrl) {
      console.error('GREEN_API_BASE_URL not configured');
      return NextResponse.json(
        { error: 'API configuration missing' },
        { status: 500 }
      );
    }

    // Формируем URL для удаления чата
    const deleteUrl = `${baseUrl}/api/chats/${chatId}`;

    console.log('Making request to Green API:', deleteUrl);

    // Выполняем запрос к Green API
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Green API response status:', response.status);

    // Обработка ответа
    if (response.ok) {
      let result;
      try {
        const responseText = await response.text();
        console.log('Green API response text:', responseText);
        
        // Пробуем распарсить как JSON
        if (responseText) {
          try {
            result = JSON.parse(responseText);
          } catch {
            result = responseText; // Если не JSON, возвращаем как строку
          }
        } else {
          result = { success: true, deleted: true };
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        result = { success: true, deleted: true };
      }

      console.log('Delete chat successful:', result);
      
      return NextResponse.json({
        success: true,
        deleted: true,
        chatId,
        result
      });
    } else {
      // Обработка ошибок
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }

      console.error('Green API error:', response.status, errorData);

      return NextResponse.json(
        {
          error: errorData.error || errorData.detail || `Failed to delete chat`,
          status: response.status,
          chatId
        },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('Delete chat error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}