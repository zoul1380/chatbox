import winston from 'winston';
import { format, transports } from 'winston';
import 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';
import { LogOptions, ErrorLog } from '../types';

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// API Error JSON file transport
const apiErrorLogPath = path.join(logDir, 'api-errors.json');

// Ensure the API error log file exists
if (!fs.existsSync(apiErrorLogPath)) {
  fs.writeFileSync(apiErrorLogPath, JSON.stringify([], null, 2));
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
  format.printf((info: any) => {
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

// Custom format that also writes API errors to the JSON file
const apiErrorFormat = format((info: any) => {
  if (info.level === 'error' && info.request) {
    try {
      // Read existing logs
      const logs: ErrorLog[] = JSON.parse(fs.readFileSync(apiErrorLogPath, 'utf8'));
      
      // Add new log entry to the beginning for easier access to latest logs
      logs.unshift({
        timestamp: info.timestamp || new Date().toISOString(),
        level: info.level,
        message: info.message,
        stack: info.stack || (info.error && info.error.stack),
        request: info.request,
        response: info.response,
        context: info.context
      });
      
      // Limit to 1000 entries to prevent file size issues
      const limitedLogs = logs.slice(0, 1000);
      
      // Write back to file
      fs.writeFileSync(apiErrorLogPath, JSON.stringify(limitedLogs, null, 2));
    } catch (error) {
      console.error('Error writing to API errors log file:', error);
    }
  }
  return info;
});

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
  maxSize: '20m',
  maxFiles: '14d',
  format: jsonLogFormat,
});

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json(),
    apiErrorFormat()
  ),
  defaultMeta: { service: 'chatbox-server' },
  transports: [
    new transports.Console({
      level: 'info',
      format: consoleFormat,
    }),
    combinedRotateTransport,
    errorRotateTransport
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// Utility function to get API error logs
export const getApiErrorLogs = async (options: LogOptions = {}): Promise<ErrorLog[]> => {
  try {
    // Read the API errors log file
    const logs: ErrorLog[] = JSON.parse(fs.readFileSync(apiErrorLogPath, 'utf8'));
    
    // Apply filtering
    let filteredLogs = [...logs];
    
    // Filter by date if provided
    if (options.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(options.startDate as string)
      );
    }
    
    if (options.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(options.endDate as string)
      );
    }
    
    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    
    return filteredLogs.slice(offset, offset + limit);
  } catch (error) {
    console.error('Error reading API errors log file:', error);
    return [];
  }
};
