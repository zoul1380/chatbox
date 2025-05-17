const axios = require('axios');

const OLLAMA_API_URL = 'http://localhost:11434';

// Controller to check Ollama server health
exports.checkOllamaHealth = async (req, res) => {
  try {
    // Ollama's health check is typically just the root endpoint returning 200 OK
    await axios.get(OLLAMA_API_URL);
    res.status(200).json({ ollamaStatus: 'Ollama server is responsive' });
  } catch (error) {
    console.error('Error checking Ollama server health:', error.message);
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
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching Ollama tags:', error.message);
    res.status(500).json({
      message: 'Failed to fetch models from Ollama server',
      error: error.message
    });
  }
};

// Controller to stream chat responses from Ollama
exports.streamChat = async (req, res) => {
  const { model, messages, stream } = req.body; // Expecting model name, message history, and stream flag

  if (!model || !messages) {
    return res.status(400).json({ message: 'Model and messages are required.' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Flush the headers to establish the connection

  let ollamaResponse;
  try {
    const ollamaPayload = {
      model: model,
      messages: messages,
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
      
      for (const line of lines) {
        try {
          const parsedChunk = JSON.parse(line);
          // Send the chunk to the client as an SSE event
          res.write(`data: ${JSON.stringify(parsedChunk)}\n\n`);
        } catch (error) {
          console.error('Error parsing chunk:', line, error);
          // If we can't parse the chunk, still try to send it in case the client can handle it
          res.write(`data: ${JSON.stringify({ error: 'Parse error', line })}\n\n`);
        }
      }
    });

    ollamaResponse.data.on('end', () => {
      // Send a final event to mark the end of the stream
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      console.log('Chat stream completed successfully');
    });

    ollamaResponse.data.on('error', (err) => {
      console.error('Error in Ollama stream:', err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Error initiating Ollama chat stream:', error.response ? error.response.data : error.message);
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
    console.log('Client disconnected from chat stream');
    // Clean up any resources if necessary
    if (ollamaResponse && ollamaResponse.data) {
      ollamaResponse.data.destroy();
    }
    if (!res.writableEnded) {
      res.end();
    }
  });
};
