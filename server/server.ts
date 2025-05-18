import express, { Request, Response } from 'express';
import cors from 'cors'; // Will be needed for frontend to communicate
import path from 'path';
import fs from 'fs';
import { rateLimiter, errorHandler, logStats } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import expressWinston from 'express-winston';

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

// Import routes
import ollamaRoutes from './routes/ollamaRoutes';
import logsRouter from './routes/logsRoutes';

// Apply routes
app.use('/api/ollama', ollamaRoutes);
app.use('/logs', logsRouter);

app.get('/', (_req: Request, res: Response) => {
  res.send('ChatBox Backend Running');
});

// Simple health check for the backend server itself
app.get('/health', (_req: Request, res: Response) => {
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

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`, {
    reason: reason.stack || reason,
    promise
  });
});

process.on('uncaughtException', (error: Error) => {
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
