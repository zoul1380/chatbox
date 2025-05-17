const express = require('express');
const router = express.Router();
const ollamaController = require('../controllers/ollamaController');

// Route for Ollama server health check
router.get('/health', ollamaController.checkOllamaHealth);

// Route for fetching available models
router.get('/tags', ollamaController.getOllamaTags);

// Route for streaming chat responses
router.post('/chat', ollamaController.streamChat);

module.exports = router;
