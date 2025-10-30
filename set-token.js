// Скрипт для установки правильного токена
// Выполните в консоли браузера

console.log('🎫 Устанавливаем правильный токен...');

const correctToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxfbmFtZSI6IkphaG9uZ2lyIiwidXNlcl9pZCI6Ijk5IiwiZXhwIjoxNzYxNzI1MjUwfQ.nA-NmjABdTGTNBBvjfHCsOf95Ogz-M2sbr0-2Bt0ajw';

// Сохраняем в localStorage
localStorage.setItem('auth_token', correctToken);

console.log('✅ Токен сохранен в localStorage');

// Проверяем токен
console.log('🔍 Проверяем токен...');

// Парсим JWT для информации
function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

const payload = parseJWT(correctToken);
console.log('📋 Token payload:', payload);

if (payload) {
    const expDate = new Date(payload.exp * 1000);
    console.log('⏰ Token expires:', expDate.toLocaleString());
    console.log('👤 User:', payload.sub, '- ID:', payload.user_id);
    
    if (expDate > new Date()) {
        console.log('✅ Token is valid');
    } else {
        console.log('❌ Token is expired');
    }
}

// Тестируем WebSocket с новым токеном
console.log('🧪 Тестируем WebSocket с новым токеном...');

const wsUrl = `wss://socket.eldor.kz/api/ws?token=${correctToken}`;
const ws = new WebSocket(wsUrl);

const timeout = setTimeout(() => {
    console.log('⏰ WebSocket timeout');
    ws.close();
}, 15000);

ws.onopen = function() {
    console.log('🎉 WebSocket подключен успешно!');
    clearTimeout(timeout);
    
    // Отправляем пинг
    ws.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
    }));
    
    // Закрываем через 5 секунд
    setTimeout(() => ws.close(), 5000);
};

ws.onmessage = function(event) {
    console.log('📨 WebSocket сообщение:', event.data);
};

ws.onerror = function(error) {
    console.log('❌ WebSocket ошибка:', error);
    clearTimeout(timeout);
};

ws.onclose = function(event) {
    console.log('🔚 WebSocket закрыт:', event.code, event.reason);
    clearTimeout(timeout);
    
    if (event.code === 1000) {
        console.log('✅ Нормальное закрытие - WebSocket работает!');
    } else {
        console.log('❌ Проблема с подключением, код:', event.code);
    }
};

console.log('⏳ Ждем подключения WebSocket...');