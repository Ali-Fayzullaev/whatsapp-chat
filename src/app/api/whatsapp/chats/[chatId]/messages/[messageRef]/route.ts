// src/app/api/whatsapp/chats/[chatId]/messages/[messageRef]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiConfig } from '@/lib/api-config';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string; messageRef: string }> }
) {
  try {
    const resolvedParams = await params;
    const { chatId, messageRef } = resolvedParams;
    
    console.log('=== DELETE MESSAGE API ===');
    console.log('Chat ID:', chatId);
    console.log('Message Ref:', messageRef);

    if (!chatId || !messageRef) {
      return NextResponse.json(
        { error: 'Missing chatId or messageRef' },
        { status: 400 }
      );
    }

    // Получаем параметры запроса
    const { searchParams } = new URL(req.url);
    const remote = searchParams.get('remote') === 'true';
    const onlySender = searchParams.get('only_sender') === 'true';

    console.log('Parameters:', { remote, onlySender });

    // Получаем токен авторизации
    const authHeader = req.headers.get('authorization');
    let token = '';
    
    console.log("Auth header received:", authHeader ? `Bearer ${authHeader.substring(7, 17)}...` : 'missing');
    
    if (authHeader) {
      token = authHeader.replace('Bearer ', '');
    } else {
      // Fallback: пробуем получить из cookies
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'auth_token') {
            token = decodeURIComponent(value);
            console.log("Token found in cookies");
            break;
          }
        }
      }
      
      if (!token) {
        token = apiConfig.getAccessToken() || '';
        console.log("Using fallback token from apiConfig");
      }
    }

    console.log("Token to use:", token ? `${token.substring(0, 10)}...` : 'missing');

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

    // Формируем URL с параметрами
    const deleteUrl = new URL(`${baseUrl}/api/chats/${chatId}/messages/${messageRef}`);
    if (remote) {
      deleteUrl.searchParams.set('remote', 'true');
    }
    if (onlySender) {
      deleteUrl.searchParams.set('only_sender', 'true');
    }

    console.log('Making request to Green API:', deleteUrl.toString());

    // Выполняем запрос к Green API
    const response = await fetch(deleteUrl.toString(), {
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

      console.log('Delete message successful:', result);
      
      return NextResponse.json({
        success: true,
        deleted: true,
        messageRef,
        chatId,
        remote,
        onlySender,
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
          error: errorData.error || errorData.detail || `Failed to delete message`,
          status: response.status,
          messageRef,
          chatId
        },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('Delete message error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH: Обновить сообщение
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string; messageRef: string }> }
) {
  try {
    const resolvedParams = await params;
    const { chatId, messageRef } = resolvedParams;
    
    console.log('=== PATCH MESSAGE API ===');
    console.log('Chat ID:', chatId);
    console.log('Message Ref:', messageRef);

    if (!chatId || !messageRef) {
      return NextResponse.json(
        { error: 'Missing chatId or messageRef' },
        { status: 400 }
      );
    }

    // Получаем данные для обновления
    const body = await req.json();
    console.log('Update data:', body);

    // Получаем токен авторизации
    const authHeader = req.headers.get('authorization');
    let token = '';
    
    console.log("Auth header received:", authHeader ? `Bearer ${authHeader.substring(7, 17)}...` : 'missing');
    
    if (authHeader) {
      token = authHeader.replace('Bearer ', '');
    } else {
      // Fallback: пробуем получить из cookies
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'auth_token') {
            token = decodeURIComponent(value);
            console.log("Token found in cookies");
            break;
          }
        }
      }
    }

    if (!token) {
      console.error('No authorization token provided');
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Выполняем PATCH запрос к внешнему API
    const apiUrl = `${apiConfig.getBaseUrl()}/api/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageRef)}`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error response:', errorData);
      
      return NextResponse.json(
        { 
          error: `API error: ${response.status}`,
          details: errorData 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Message updated successfully:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Edit message error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}