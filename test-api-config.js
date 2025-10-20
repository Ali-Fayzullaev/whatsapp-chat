// Тест для проверки API конфигурации
import { apiConfig } from './src/lib/api-config.js';

console.log('=== API CONFIG TEST ===');
console.log('Base URL:', apiConfig.getBaseUrl());
console.log('Access Token:', apiConfig.getAccessToken() ? 'present' : 'missing');
console.log('Headers:', apiConfig.getHeaders());