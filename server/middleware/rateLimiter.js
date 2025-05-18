// Rate limiter middleware to implement a simple rate limiting
// We'll use a simpler implementation without the queue package

// Keep track of ongoing requests
let activeRequests = 0;
const maxConcurrentRequests = 3; // Maximum of 3 concurrent requests
const requestDelay = 333; // ~3 requests per second (in ms)

// Keep track of successful/failed requests for logging
let requestCount = 0;
let successCount = 0;
let failureCount = 0;
let retryCount = 0;

// Import the logger
const { logger } = require('../utils/logger');

// Enhanced logger
const logRequest = (req, status, retried = false) => {
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
exports.logStats = () => {
  const statsMessage = `API Requests Stats: Total=${requestCount}, Successful=${successCount}, Failed=${failureCount}, Retries=${retryCount}`;
  
  logger.info(statsMessage, {
    stats: {
      totalRequests: requestCount,
      successfulRequests: successCount,
      failedRequests: failureCount,
      retriedRequests: retryCount,
      activeRequests: activeRequests
    }
  });
};

// Rate limiter middleware
exports.rateLimiter = (req, res, next) => {
  // Log the request
  logRequest(req, 'queued');
  
  if (activeRequests >= maxConcurrentRequests) {
    // Too many concurrent requests, add headers to suggest retry
    res.set('X-Queue-Length', activeRequests);
    res.set('Retry-After', '1');
    
    // Simple backoff strategy
    return setTimeout(() => {
      this.rateLimiter(req, res, next);
    }, requestDelay);
  }
  
  // Increment active requests counter
  activeRequests++;
  
  // Store the original res.end to capture status code and decrement counter
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    activeRequests--; // Decrement when request completes
    logRequest(req, res.statusCode);
    return originalEnd.call(res, chunk, encoding);
  };
    // Add delay for rate limiting
  setTimeout(() => {
    next();
  }, requestDelay);
};

// Global error handler
exports.errorHandler = (err, req, res, next) => {
  const { logger, captureError } = require('../utils/logger');
  
  // Log the error using our enhanced logger
  logger.error(`Global error handler caught: ${err.message}`, { 
    error: err.message,
    stack: err.stack
  });
  
  // Capture full error details for the API logs
  captureError(err, req, res);
  
  // Track in request stats
  logRequest(req, err.status || 500);
  
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: true,
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
