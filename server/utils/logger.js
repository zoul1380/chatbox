const winston = require('winston');
const { format, transports } = winston;
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf(({ level, message, timestamp, ...rest }) => {
    const restString = Object.keys(rest).length ? ` | ${JSON.stringify(rest)}` : '';
    return `${timestamp} ${level}: ${message}${restString}`;
  })
);

// Custom format for JSON logs
const jsonLogFormat = format.combine(
  format.timestamp(),
  format.json(),
  format.printf(info => {
    // Sanitize sensitive data
    const sanitizedInfo = { ...info };
    if (sanitizedInfo.request && sanitizedInfo.request.headers && sanitizedInfo.request.headers.authorization) {
      sanitizedInfo.request.headers.authorization = '[REDACTED]';
    }
    if (sanitizedInfo.request && sanitizedInfo.request.body && sanitizedInfo.request.body.password) {
      sanitizedInfo.request.body.password = '[REDACTED]';
    }
    return JSON.stringify(sanitizedInfo);
  })
);

// File rotation transport for errors
const errorRotateTransport = new transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m', // Rotate if file size exceeds 20MB
  maxFiles: '14d', // Keep logs for 14 days
  level: 'error',
  format: jsonLogFormat,
});

// File rotation transport for all logs
const combinedRotateTransport = new transports.DailyRotateFile({
  filename: path.join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m', // Rotate if file size exceeds 20MB
  maxFiles: '7d', // Keep logs for 7 days
  format: jsonLogFormat,
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonLogFormat,
  defaultMeta: { service: 'chatbox-server' },
  transports: [
    new transports.Console({ format: consoleFormat }),
    errorRotateTransport,
    combinedRotateTransport,
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// Create a separate transport for the error logs that will be exposed via the API
const errorLogsTransport = new transports.File({
  filename: path.join(logDir, 'api-errors.json'),
  level: 'error',
  format: jsonLogFormat,
});

logger.add(errorLogsTransport);

// Log error events
errorRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info(`Log file rotated from ${oldFilename} to ${newFilename}`);
});

// Log combined events
combinedRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info(`Log file rotated from ${oldFilename} to ${newFilename}`);
});

// Ensure logs directory has proper permissions
try {
  fs.chmodSync(logDir, 0o755); // rwxr-xr-x
} catch (err) {
  console.error('Failed to set permissions on logs directory:', err);
}

/**
 * Capture express API errors
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const captureError = (err, req, res) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params,
      headers: req.headers,
      body: req.body,
      ip: req.ip,
    },
    response: {
      statusCode: res.statusCode,
    },
    context: {
      userId: req.user?.id || 'anonymous',
      sessionId: req.sessionID,
    },
  };

  logger.error('API Error:', errorLog);
  return errorLog;
};

/**
 * Read error logs for the API endpoint
 * @param {Object} options - Options for log retrieval
 * @returns {Promise<Array<Object>>} - Array of log entries
 */
const getApiErrorLogs = async (options = {}) => {
  const {
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = options;

  try {
    // Read the API errors log file
    const logFilePath = path.join(logDir, 'api-errors.json');
    
    if (!fs.existsSync(logFilePath)) {
      return [];
    }

    // Read log file content
    const fileContent = fs.readFileSync(logFilePath, 'utf-8');
    
    // Parse logs - each line is a separate JSON object
    const logs = fileContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (err) {
          logger.warn(`Failed to parse log line: ${line}`);
          return null;
        }
      })
      .filter(log => log !== null);

    // Apply date filtering if provided
    let filteredLogs = logs;
    if (startDate || endDate) {
      filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const isAfterStart = startDate ? logDate >= new Date(startDate) : true;
        const isBeforeEnd = endDate ? logDate <= new Date(endDate) : true;
        return isAfterStart && isBeforeEnd;
      });
    }

    // Sort by timestamp descending (most recent first)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    return filteredLogs.slice(offset, offset + limit);
  } catch (err) {
    logger.error('Error reading API error logs:', err);
    return [];
  }
};

module.exports = {
  logger,
  captureError,
  getApiErrorLogs,
};
