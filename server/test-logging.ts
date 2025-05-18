/**
 * Test script to validate the logging functionality
 * Run this script to generate test log entries that will
 * appear in the logging interface
 */

import { logger } from './utils/logger';

console.log('Starting logging system test...');

// Generate some test logs
logger.info('Test info log message', { testId: 1, category: 'test' });
logger.warn('Test warning message', { testId: 2, category: 'test' });
logger.error('Test error message', { 
  testId: 3, 
  category: 'test',
  error: new Error('Test error'),
  stack: new Error('Test error').stack
});

// Test API error
logger.error('API Error Test', {
  timestamp: new Date().toISOString(),
  message: 'Test API Error',
  stack: new Error('Test API Error').stack,
  request: {
    method: 'GET',
    path: '/api/test',
    headers: {
      'user-agent': 'Test Agent',
      'authorization': 'Bearer REDACTED'
    },
    body: {},
    ip: '127.0.0.1',
  },
  response: {
    statusCode: 500,
  },
  context: {
    userId: 'test-user',
    sessionId: 'test-session',
  },
});

console.log('Test logs generated.');
console.log('You can now access the logs at: http://localhost:3001/logs');
console.log('Or view them in HTML format at: http://localhost:3001/logs/html');

// Exit the script
setTimeout(() => {
  process.exit(0);
}, 1000);
