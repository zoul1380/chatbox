import { Request } from 'express';

// Extend Express Request interface
export interface ExtendedRequest extends Request {
  ip: string;
  originalUrl: string;
}

// Ollama Types
export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
}

export interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

// Logging Types
export interface LogOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

export interface ErrorLog {
  timestamp: string;
  level: string;
  message: string;
  stack?: string;
  request?: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
    ip?: string;
  };
  response?: {
    statusCode: number;
    body?: any;
  };
  context?: Record<string, any>;
}

// Rate Limiter Types
export interface RateLimiterStats {
  requestCount: number;
  successCount: number;
  failureCount: number;
  retryCount: number;
}

// Image Processing Types
export interface ImageData {
  messageIndex: number;
  data: string;
}
