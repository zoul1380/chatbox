// filepath: g:\code\chatbox\server\docs\logging-system.md
# ChatBox Server Logging System Documentation

This document outlines the logging system implemented for the ChatBox server application.

## Overview

The logging system captures and stores error/failure events from the server application. It provides structured logging with different severity levels, log rotation, and an API endpoint to view logs.

## Features

1. **Structured Logging**
   - Timestamps for all log entries
   - Error messages and stack traces
   - Request details (method, path, headers, body)
   - Additional context information
   
2. **Log Storage**
   - JSON file format for machine readability
   - Log rotation to prevent excessive file size
   - Separate log files for different severity levels
   - Secure file permissions

3. **API Endpoint for Log Access**
   - Path: `http://localhost:3001/logs`
   - HTML view: `http://localhost:3001/logs/html`
   - Filtering by date range
   - Pagination support
   - Real-time updates (auto-refresh)
   - Most recent logs first

## Log Structure

Each log entry contains:

```json
{
  "timestamp": "2025-05-18T12:34:56.789Z",
  "level": "error",
  "message": "Error message",
  "stack": "Error stack trace...",
  "request": {
    "method": "GET",
    "path": "/api/path",
    "query": {},
    "params": {},
    "headers": {},
    "body": {},
    "ip": "127.0.0.1"
  },
  "response": {
    "statusCode": 500
  },
  "context": {
    "userId": "anonymous",
    "sessionId": "abc123"
  },
  "service": "chatbox-server"
}
```

## API Endpoints

### GET /logs

Returns a JSON array of log entries.

**Query Parameters:**
- `startDate` - ISO date string (e.g., "2025-05-01")
- `endDate` - ISO date string (e.g., "2025-05-18")
- `limit` - Number of logs to return (default: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "total": 5,
  "limit": 100,
  "offset": 0,
  "logs": [
    {
      "timestamp": "2025-05-18T12:34:56.789Z",
      "message": "Error message",
      "stack": "Error stack trace...",
      "request": { ... },
      "response": { ... },
      "context": { ... }
    },
    ...
  ]
}
```

### GET /logs/html

Returns an HTML page displaying logs in a user-friendly format.

**Query Parameters:**
- Same as `/logs` endpoint

## Security Considerations

1. **Privacy Protection**
   - Authorization headers are automatically redacted
   - Password fields in request bodies are redacted
   - IP addresses are logged for security auditing

2. **File Security**
   - Log files use appropriate permissions (0755 for directories)
   - JSON integrity validation

3. **Access Control**
   - In a production environment, additional authentication should be implemented to protect log access

## Technical Implementation

- Uses Winston logging library
- Uses winston-daily-rotate-file for log rotation
- Uses express-winston for HTTP request logging
- File rotation occurs at 20MB file size
- Error logs are kept for 14 days
- Combined logs are kept for 7 days

## Best Practices

1. **When to Log**
   - Always log unexpected errors with stack traces
   - Log API request/response data for debugging
   - Log security-related events (authentication failures, etc.)
   - Log application state changes

2. **What Not to Log**
   - Sensitive personal information
   - Authentication credentials
   - Payment information
   - Session tokens

## Extending the Logging System

To extend the logging system:

1. Import the logger in your file:
   ```javascript
   const { logger } = require('../utils/logger');
   ```

2. Use the appropriate logging level:
   ```javascript
   logger.info('Message', { additionalData });
   logger.warn('Warning', { additionalData });
   logger.error('Error', { error });
   ```

3. To capture API errors, use the captureError function:
   ```javascript
   const { captureError } = require('../utils/logger');
   captureError(err, req, res);
   ```
