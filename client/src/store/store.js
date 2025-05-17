import { configureStore } from '@reduxjs/toolkit';
// Import reducers here
import ollamaReducer from '../features/ollama/ollamaSlice';

export const store = configureStore({
  reducer: {
    ollama: ollamaReducer,
    // Add other reducers here
  },
});
