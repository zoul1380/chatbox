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
