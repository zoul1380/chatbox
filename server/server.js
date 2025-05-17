const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Will be needed for frontend to communicate
const { rateLimiter, errorHandler, logStats } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001; // Backend server port

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({limit: '50mb'})); // for parsing application/json with increased limit for base64 images
app.use('/api/ollama', rateLimiter); // Apply rate limiting to all Ollama API routes

// Ollama routes
const ollamaRoutes = require('./routes/ollamaRoutes');
app.use('/api/ollama', ollamaRoutes);

app.get('/', (req, res) => {
  res.send('ChatBox Backend Running');
});

// Simple health check for the backend server itself
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Backend is healthy' });
});

// Global error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Log API stats every 5 minutes
setInterval(logStats, 5 * 60 * 1000);
