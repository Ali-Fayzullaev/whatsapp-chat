// WebSocket Connection Test Script
// Вставьте этот код в консоль браузера для тестирования

console.log('🚀 Starting WebSocket connection test...');

// Получаем токен из localStorage
const token = localStorage.getItem('auth_token');
if (!token) {
    console.error('❌ No token found in localStorage');
} else {
    console.log('🎫 Token found:', token.substring(0, 20) + '...');
}

// Тестируем WebSocket подключение
const wsUrl = `wss://socket.eldor.kz/api/ws?token=${token}`;
console.log('🔗 Connecting to:', wsUrl.replace(/token=[^&]+/, 'token=***'));

const ws = new WebSocket(wsUrl);

// Таймаут для теста
const timeout = setTimeout(() => {
    console.log('⏰ Connection timeout (10s)');
    ws.close();
}, 10000);

ws.onopen = function(event) {
    console.log('✅ WebSocket Connected!', event);
    clearTimeout(timeout);
    
    // Отправляем тестовое сообщение
    ws.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
    }));
    
    // Закрываем через 5 секунд
    setTimeout(() => {
        ws.close();
    }, 5000);
};

ws.onmessage = function(event) {
    console.log('📨 Message received:', event.data);
    try {
        const data = JSON.parse(event.data);
        console.log('📋 Parsed data:', data);
    } catch (e) {
        console.log('📄 Raw message:', event.data);
    }
};

ws.onerror = function(error) {
    console.error('❌ WebSocket Error:', error);
    clearTimeout(timeout);
};

ws.onclose = function(event) {
    console.log('🔚 WebSocket Closed:', {
        code: event.code,
        reason: event.reason || 'No reason provided',
        wasClean: event.wasClean
    });
    clearTimeout(timeout);
    
    // Коды закрытия
    const closeCodes = {
        1000: 'Normal closure',
        1001: 'Going away',
        1002: 'Protocol error',
        1003: 'Unsupported data',
        1006: 'Abnormal closure',
        1007: 'Invalid frame payload data',
        1008: 'Policy violation',
        1009: 'Message too big',
        1010: 'Mandatory extension',
        1011: 'Internal server error',
        1015: 'TLS handshake failure'
    };
    
    console.log('📋 Close code meaning:', closeCodes[event.code] || 'Unknown');
};

console.log('⏳ Waiting for connection...');