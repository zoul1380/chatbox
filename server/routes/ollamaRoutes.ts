import express from 'express';
import * as ollamaController from '../controllers/ollamaController';

const router = express.Router();

// Route for Ollama server health check
router.get('/health', ollamaController.checkOllamaHealth);

// Route for fetching available models
router.get('/tags', ollamaController.getOllamaTags);

// Route for streaming chat responses
router.post('/chat', ollamaController.streamChat);

export default router;
