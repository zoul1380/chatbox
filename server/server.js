const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Will be needed for frontend to communicate
const path = require('path');
const fs = require('fs');
const { rateLimiter, errorHandler, logStats } = require('./middleware/rateLimiter');
const { logger } = require('./utils/logger');
const expressWinston = require('express-winston');

const app = express();
const PORT = process.env.PORT || 3001; // Backend server port

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Express Winston request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
}));

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({limit: '50mb'})); // for parsing application/json with increased limit for base64 images
app.use('/api/ollama', rateLimiter); // Apply rate limiting to all Ollama API routes

// Ollama routes
const ollamaRoutes = require('./routes/ollamaRoutes');
app.use('/api/ollama', ollamaRoutes);

// Logs routes - Make logs available via API
const logsRoutes = require('./routes/logsRoutes');
app.use('/logs', logsRoutes);

app.get('/', (req, res) => {
  res.send('ChatBox Backend Running');
});

// Simple health check for the backend server itself
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Backend is healthy' });
});

// Global error handler
app.use(errorHandler);

// Express Winston error logging - after routes, before error handler
app.use(expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{err.status || 500}} {{req.method}} {{req.url}}',
}));

const server = app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    startTime: new Date().toISOString()
  });
  logger.info(`Logs interface available at http://localhost:${PORT}/logs/html`);
});

// Handle process termination properly
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`, {
    reason: reason.stack || reason,
    promise
  });
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, {
    error: error.stack || error.toString()
  });
  
  // Give logger time to flush to disk before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Log API stats every 5 minutes
setInterval(logStats, 5 * 60 * 1000);
