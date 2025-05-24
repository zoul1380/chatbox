import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage
import { combineReducers } from 'redux';
// Import reducers here
import ollamaReducer from '../features/ollama/ollamaSlice';
import chatsReducer from '../features/chats/chatsSlice';

// Configure persistence for chats reducer
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['chats'] // Only persist chats data
};

const rootReducer = combineReducers({
  ollama: ollamaReducer,
  chats: chatsReducer,
  // Add other reducers here
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/FLUSH', 'persist/PAUSE', 'persist/REGISTER'],
      },
    }),
});

export const persistor = persistStore(store);
