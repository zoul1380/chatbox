import { configureStore } from '@reduxjs/toolkit';
// Import reducers here
import ollamaReducer from '../features/ollama/ollamaSlice';
import chatsReducer from '../features/chats/chatsSlice';

export const store = configureStore({
  reducer: {
    ollama: ollamaReducer,
    chats: chatsReducer,
    // Add other reducers here
  },
});
