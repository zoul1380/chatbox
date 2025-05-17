// Rate limiter middleware to limit requests to 3 per second with queue
const queue = require('queue');

// Queue for API requests
const requestQueue = queue({
  concurrency: 3, // Only process 3 requests at a time
  autostart: true // Start processing as soon as items are added
});

// Keep track of successful/failed requests for logging
let requestCount = 0;
let successCount = 0;
let failureCount = 0;
let retryCount = 0;

// Simple logger
const logRequest = (req, status, retried = false) => {
  const now = new Date();
  const timestamp = now.toISOString();
  const endpoint = req.originalUrl;
  const method = req.method;
  const model = req.body?.model || 'none';
  
  console.log(`[${timestamp}] ${method} ${endpoint} | Status: ${status} | Model: ${model} ${retried ? '| RETRY' : ''}`);
  
  // Increment counters
  requestCount++;
  if (status >= 200 && status < 300) {
    successCount++;
  } else {
    failureCount++;
  }
  if (retried) {
    retryCount++;
  }
};

// Export periodic stats logging (can be hooked up to server.js)
exports.logStats = () => {
  console.log(`
API Requests Stats:
- Total: ${requestCount}
- Successful: ${successCount}
- Failed: ${failureCount}
- Retries: ${retryCount}
  `);
};

// Rate limiter and queue middleware
exports.rateLimiter = (req, res, next) => {
  // Create a promise for this request
  const processRequest = () => {
    return new Promise(resolve => {
      // Log the request
      logRequest(req, 'queued');
      // Process the request after a small delay to enforce rate limiting
      setTimeout(() => {
        // Store the original res.end to capture status code
        const originalEnd = res.end;
        res.end = function(chunk, encoding) {
          logRequest(req, res.statusCode);
          return originalEnd.call(res, chunk, encoding);
        };
        
        // Continue with middleware chain
        next();
        resolve();
      }, 333); // ~3 requests per second
    });
  };

  // Add to queue
  requestQueue.push(processRequest);
  
  // If the queue is too long, let the client know
  if (requestQueue.length > 10) {
    res.set('X-Queue-Length', requestQueue.length);
    res.set('Retry-After', Math.ceil(requestQueue.length / 3));
  }
};

// Global error handler
exports.errorHandler = (err, req, res, next) => {
  console.error('Global error handler caught:', err.message);
  logRequest(req, err.status || 500);
  
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: true,
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
