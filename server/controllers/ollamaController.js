const axios = require('axios');
const { logger } = require('../utils/logger');

const OLLAMA_API_URL = 'http://localhost:11434';

// Helper function to process messages with images for multimodal models
function processMessagesWithImages(messages, images) {
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
exports.checkOllamaHealth = async (req, res) => {
  try {
    // Ollama's health check is typically just the root endpoint returning 200 OK
    await axios.get(OLLAMA_API_URL);
    
    logger.info('Ollama health check succeeded', {
      service: 'ollama',
      action: 'health-check',
      status: 'success'
    });
    
    res.status(200).json({ ollamaStatus: 'Ollama server is responsive' });
  } catch (error) {
    // Use the logger to capture the error
    logger.error('Ollama server health check failed', {
      service: 'ollama',
      action: 'health-check',
      error: error.message,
      status: 'error',
      stack: error.stack
    });
    
    res.status(503).json({ 
      ollamaStatus: 'Ollama server is not responding', 
      error: error.message 
    });
  }
};

// Controller to get available models (tags)
exports.getOllamaTags = async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_API_URL}/api/tags`);
    
    logger.info('Successfully fetched Ollama tags', {
      service: 'ollama',
      action: 'get-tags',
      modelCount: response.data?.models?.length || 0
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    // Use the logger to capture the error
    logger.error('Error fetching Ollama tags', {
      service: 'ollama',
      action: 'get-tags',
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      message: 'Failed to fetch models from Ollama server',
      error: error.message
    });
  }
};

// Controller to stream chat responses from Ollama
exports.streamChat = async (req, res) => {
  const { model, messages, images } = req.body; // Expecting model name, message history, images

  if (!model || !messages) {
    return res.status(400).json({ message: 'Model and messages are required.' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Flush the headers to establish the connection

  // Process messages to include images if any
  const processedMessages = processMessagesWithImages(messages, images);

  let ollamaResponse;
  try {
    const ollamaPayload = {
      model: model,
      messages: processedMessages,
      stream: true, // Ensure streaming is enabled
    };

    ollamaResponse = await axios.post(`${OLLAMA_API_URL}/api/chat`, ollamaPayload, {
      responseType: 'stream' // Important for handling streaming responses with Axios
    });

    ollamaResponse.data.on('data', (chunk) => {
      // Each chunk from Ollama is a JSON object on its own line (or multiple in one chunk)
      const chunkStr = chunk.toString();
      
      // Split by newlines in case multiple JSON objects are in one chunk
      const lines = chunkStr.split('\n').filter(line => line.trim());
      
      for (const line of lines) {        try {
          const parsedChunk = JSON.parse(line);
          // Send the chunk to the client as an SSE event
          res.write(`data: ${JSON.stringify(parsedChunk)}\n\n`);
        } catch (error) {
          logger.error('Error parsing Ollama response chunk', {
            service: 'ollama',
            action: 'parse-chunk',
            model,
            error: error.message,
            chunk: line.substring(0, 200) // Log only first 200 chars to avoid huge logs
          });
          
          // If we can't parse the chunk, still try to send it in case the client can handle it
          res.write(`data: ${JSON.stringify({ error: 'Parse error', line })}\n\n`);
        }
      }
    });    ollamaResponse.data.on('end', () => {
      // Send a final event to mark the end of the stream
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      
      logger.info('Chat stream completed successfully', {
        service: 'ollama',
        action: 'stream-chat',
        model,
        messageCount: messages.length,
        success: true
      });
    });

    ollamaResponse.data.on('error', (err) => {
      logger.error('Error in Ollama stream', {
        service: 'ollama',
        action: 'stream-chat',
        model,
        error: err.message,
        stack: err.stack,
        messageCount: messages.length
      });
      
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });
  } catch (error) {
    // Log the detailed error with our structured logger
    logger.error('Error initiating Ollama chat stream', {
      service: 'ollama',
      action: 'stream-chat',
      model,
      error: error.message,
      responseData: error.response ? JSON.stringify(error.response.data) : undefined,
      stack: error.stack,
      messageCount: messages.length
    });
    
    // If the stream hasn't started, we can send a proper error status
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Failed to initiate chat stream with Ollama server',
        error: error.message
      });
    } else {
      // If headers are already sent, we need to send the error as an event
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
  // Handle client disconnects
  req.on('close', () => {
    logger.info('Client disconnected from chat stream', {
      service: 'ollama',
      action: 'client-disconnect',
      model,
      clientIp: req.ip
    });
    
    // Clean up any resources if necessary
    if (ollamaResponse && ollamaResponse.data) {
      ollamaResponse.data.destroy();
    }
    if (!res.writableEnded) {
      res.end();
    }
  });
};
