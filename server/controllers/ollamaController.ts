import axios from 'axios';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { OllamaMessage, OllamaRequest, OllamaResponse, OllamaModel, ImageData } from '../types';

const OLLAMA_API_URL = 'http://localhost:11434';

// Helper function to process messages with images for multimodal models
function processMessagesWithImages(messages: OllamaMessage[], images?: ImageData[]): OllamaMessage[] {
  // If no images were provided, return messages as is
  if (!images || images.length === 0) {
    return messages;
  }

  // Process messages to include images using Ollama's multimodal format
  const processedMessages = [...messages];
  
  // For each image, find the corresponding message and add the image
  images.forEach(imageData => {
    if (imageData && imageData.messageIndex !== undefined) {
      const index = imageData.messageIndex;
      if (processedMessages[index]) {
        // Store the original text content
        const textContent = processedMessages[index].content;
        
        // Add the image data to the message using Ollama's expected format
        // Ollama expects an "images" array with base64 encoded image data
        if (imageData.data) {
          // Split off the data:image/jpeg;base64, prefix
          const base64Image = imageData.data.split(',')[1];
          
          // Add images array to the message
          processedMessages[index].images = [base64Image];
          
          // Keep the original text content as is
          processedMessages[index].content = textContent;
        }
      }
    }
  });
  
  return processedMessages;
}

// Controller to check Ollama server health
export const checkOllamaHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Ollama's health check is typically just the root endpoint returning 200 OK
    await axios.get(OLLAMA_API_URL);
    
    logger.info('Ollama health check succeeded', {
      service: 'ollama',
      action: 'health-check',
      status: 'success'
    });
    
    res.status(200).json({ 
      status: 'Ollama server is available',
      url: OLLAMA_API_URL
    });
  } catch (error) {
    logger.error('Ollama server health check failed', {
      service: 'ollama',
      action: 'health-check',
      status: 'failed',
      error: (error as Error).message
    });
    
    // Send a more detailed error response
    res.status(503).json({
      status: 'Ollama server is unavailable',
      error: (error as Error).message,
      url: OLLAMA_API_URL,
      details: 'Please ensure Ollama is running with the command: ollama serve'
    });
  }
};

// Controller to get available models
export const getOllamaTags = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Call Ollama's list endpoint
    const response = await axios.get(`${OLLAMA_API_URL}/api/tags`);
    const data = response.data as { models: OllamaModel[] };
    const models = data.models;
    
    logger.info(`Retrieved ${models.length} models from Ollama`, {
      service: 'ollama',
      action: 'get-models',
      count: models.length
    });
    
    res.status(200).json(models);
  } catch (error) {
    logger.error('Failed to fetch Ollama models', {
      service: 'ollama',
      action: 'get-models',
      error: (error as Error).message
    });
    
    res.status(503).json({
      error: true,
      message: 'Failed to fetch models from Ollama',
      details: (error as Error).message
    });
  }
};

// Controller to handle chat streaming
export const streamChat = async (req: Request, res: Response): Promise<void> => {
  // Extract the request body
  const { messages, model, images, options } = req.body as {
    messages: OllamaMessage[];
    model: string;
    images?: ImageData[];
    options?: Record<string, any>;
  };
  
  // Validate required parameters
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ 
      error: true,
      message: 'Messages array is required' 
    });
    return;
  }
  
  if (!model) {
    res.status(400).json({ 
      error: true,
      message: 'Model name is required' 
    });
    return;
  }
  
  // Process messages with images if present
  const processedMessages = processMessagesWithImages(messages, images);
  
  try {
    // Set up headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Prepare the request to Ollama
    const ollamaRequest: OllamaRequest = {
      model,
      messages: processedMessages,
      stream: true,
      options
    };
    
    logger.info(`Streaming chat request to model: ${model}`, {
      service: 'ollama',
      action: 'stream-chat',
      model,
      messageCount: processedMessages.length
    });
      // Make the request to Ollama with streaming response
    const response = await axios.post(`${OLLAMA_API_URL}/api/chat`, ollamaRequest, {
      responseType: 'stream'
    });
    
    // Handle the streaming data
    const stream = response.data as any;
    
    stream.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      
      lines.forEach(line => {
        try {
          // Parse as JSON and send as event
          const data = JSON.parse(line) as OllamaResponse;
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          
          // Flush the response to ensure streaming (if available)
          const resWithFlush = res as any;
          if (resWithFlush.flush && typeof resWithFlush.flush === 'function') {
            resWithFlush.flush();
          }
        } catch (e) {
          logger.warn(`Error parsing streaming response: ${line}`, {
            error: (e as Error).message
          });
        }
      });
    });
    
    // Handle end of stream
    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
      
      logger.info('Chat streaming completed successfully', {
        service: 'ollama',
        action: 'stream-chat',
        model,
        status: 'completed'
      });
    });
    
    // Handle errors in streaming
    stream.on('error', (err: Error) => {
      logger.error('Error in chat stream from Ollama', {
        service: 'ollama',
        action: 'stream-chat',
        error: err.message,
        stack: err.stack
      });
      
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });
  } catch (error) {
    // Handle errors in setting up the streaming
    logger.error('Failed to initialize chat streaming', {
      service: 'ollama',
      action: 'stream-chat',
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    
    // If headers haven't been sent, send a JSON error
    if (!res.headersSent) {
      res.status(500).json({
        error: true,
        message: 'Failed to connect to Ollama service',
        details: (error as Error).message
      });
    } else {
      // If headers have been sent, send the error as an event
      res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
      res.end();
    }
  }
};
