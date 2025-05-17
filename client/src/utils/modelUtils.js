/**
 * Utility functions for working with LLM models
 */

/**
 * Check if a model supports multimodal input (images)
 * @param {string} modelName - The name of the model
 * @returns {boolean} - Whether the model likely supports image input
 */
export const isMultimodalModel = (modelName) => {
  if (!modelName) return false;
  
  // Common multimodal model name patterns
  const multimodalPatterns = [
    /llava/i,      // LLaVA models
    /bakllava/i,   // BakLLaVA
    /moondream/i,  // Moondream
    /cogvlm/i,     // CogVLM
    /blip/i,       // BLIP
    /fuyu/i,       // Fuyu
    /qwen/i,       // Qwen-VL
    /vision/i,     // Models with 'vision' in name
    /vl[-_]/i,     // VL (Vision-Language) models
    /clip/i,       // CLIP-based models
    /claude3/i,    // Claude 3 models (when they come to Ollama)
    /gpt4v/i       // GPT4 Vision models (when they come to Ollama)
  ];
  
  return multimodalPatterns.some(pattern => pattern.test(modelName));
};

/**
 * Get a human-readable description of a model's capabilities
 * @param {string} modelName - The name of the model
 * @returns {object} - Object with capabilities flags
 */
export const getModelCapabilities = (modelName) => {
  return {
    supportsImages: isMultimodalModel(modelName),
    // Add other capabilities as needed
  };
};