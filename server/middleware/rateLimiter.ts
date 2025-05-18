import { Request, Response, NextFunction } from 'express';
import { ExtendedRequest, RateLimiterStats } from '../types';
import { logger } from '../utils/logger';

// Keep track of ongoing requests
let activeRequests = 0;
const maxConcurrentRequests = 3; // Maximum of 3 concurrent requests
const requestDelay = 333; // ~3 requests per second (in ms)

// Keep track of successful/failed requests for logging
let requestCount = 0;
let successCount = 0;
let failureCount = 0;
let retryCount = 0;

// Enhanced logger
const logRequest = (req: ExtendedRequest, status: number, retried = false): void => {
  const endpoint = req.originalUrl;
  const method = req.method;
  const model = req.body?.model || 'none';
  
  const logData = {
    method,
    endpoint,
    status,
    model,
    retried: retried || false,
    ip: req.ip,
  };
  
  if (status >= 200 && status < 300) {
    logger.info(`${method} ${endpoint} | Status: ${status} | Model: ${model} ${retried ? '| RETRY' : ''}`, logData);
    successCount++;
  } else {
    logger.warn(`${method} ${endpoint} | Status: ${status} | Model: ${model} ${retried ? '| RETRY' : ''}`, logData);
    failureCount++;
  }
  
  // Increment counters
  requestCount++;
  if (retried) {
    retryCount++;
  }
};

// Export periodic stats logging (can be hooked up to server.js)
export const logStats = (): void => {
  const statsMessage = `API Requests Stats: Total=${requestCount}, Successful=${successCount}, Failed=${failureCount}, Retries=${retryCount}`;
  logger.info(statsMessage, {
    stats: {
      total: requestCount,
      success: successCount,
      failed: failureCount,
      retries: retryCount
    }
  });
};

// Reset API stats (useful for testing)
export const resetStats = (): RateLimiterStats => {
  const stats = {
    requestCount,
    successCount,
    failureCount,
    retryCount
  };
  
  // Reset counters
  requestCount = 0;
  successCount = 0;
  failureCount = 0;
  retryCount = 0;
  
  return stats;
};

// Get current stats without resetting
export const getStats = (): RateLimiterStats => ({
  requestCount,
  successCount,
  failureCount,
  retryCount
});

// The actual rate limiter middleware
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  if (activeRequests >= maxConcurrentRequests) {
    // Queue up this request by delaying it
    setTimeout(() => {
      rateLimiter(req, res, next);
    }, requestDelay);
    return;
  }
  
  // Allow this request through
  activeRequests++;
  
  // Once the response finishes, decrement the active request count
  res.on('finish', () => {
    activeRequests--;
    // Log the request status
    logRequest(req as ExtendedRequest, res.statusCode);
  });
  
  next();
};

// Error handler middleware with retry logic
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  // Log the error
  logger.error(`API Error: ${err.message}`, {
    error: err.stack,
    request: {
      method: req.method,
      path: req.originalUrl,
      body: req.body,
      ip: req.ip
    }
  });
  
  // Send error response
  res.status(500).json({
    error: true,
    message: 'Internal Server Error',
    details: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
};
