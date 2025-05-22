import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  chats: {}, // Object to store chats by model (modelName -> array of chat objects)
  activeChatId: null,
};

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    // Create a new chat for a model
    createNewChat: (state, action) => {
      const { modelName } = action.payload;
      const chatId = uuidv4();
      
      // Initialize model's chats array if it doesn't exist
      if (!state.chats[modelName]) {
        state.chats[modelName] = [];
      }
      
      // Create a new chat
      const newChat = {
        id: chatId,
        title: `Chat ${state.chats[modelName].length + 1}`,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        messages: [],
        modelName,
      };
      
      // Add to the beginning of the array for that model
      state.chats[modelName].unshift(newChat);
      
      // Set as active chat
      state.activeChatId = chatId;
    },
    
    // Set active chat by ID
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;
    },
    
    // Update chat messages
    updateChatMessages: (state, action) => {
      const { chatId, messages } = action.payload;
      
      // Find the chat in all models
      for (const modelName in state.chats) {
        const chatIndex = state.chats[modelName].findIndex(chat => chat.id === chatId);
        if (chatIndex !== -1) {
          // Update messages and last updated time
          state.chats[modelName][chatIndex].messages = messages;
          state.chats[modelName][chatIndex].updated = new Date().toISOString();
          
          // Update chat title from first user message if it exists
          const firstUserMessage = messages.find(msg => msg.sender === 'user');
          if (firstUserMessage && state.chats[modelName][chatIndex].title === `Chat ${chatIndex + 1}`) {
            // Truncate long messages for the title
            const titleText = firstUserMessage.text.length > 30 
              ? firstUserMessage.text.substring(0, 30) + '...' 
              : firstUserMessage.text;
            state.chats[modelName][chatIndex].title = titleText;
          }
          break;
        }
      }
    },
    
    // Update chat title
    updateChatTitle: (state, action) => {
      const { chatId, title } = action.payload;
      
      // Find the chat in all models
      for (const modelName in state.chats) {
        const chatIndex = state.chats[modelName].findIndex(chat => chat.id === chatId);
        if (chatIndex !== -1) {
          state.chats[modelName][chatIndex].title = title;
          break;
        }
      }
    },
    
    // Delete a chat
    deleteChat: (state, action) => {
      const chatId = action.payload;
      
      // Find and remove the chat from its model
      for (const modelName in state.chats) {
        const chatIndex = state.chats[modelName].findIndex(chat => chat.id === chatId);
        if (chatIndex !== -1) {
          // Remove the chat
          state.chats[modelName].splice(chatIndex, 1);
          
          // If this was the active chat, set active chat to the next available one
          if (state.activeChatId === chatId) {
            state.activeChatId = state.chats[modelName].length > 0 
              ? state.chats[modelName][0].id 
              : null;
          }
          break;
        }
      }
    },
    
    // Clear all chats for a model
    clearAllChatsForModel: (state, action) => {
      const modelName = action.payload;
      if (state.chats[modelName]) {
        // Get active chat for this model
        const activeChat = state.chats[modelName].find(chat => chat.id === state.activeChatId);
        
        // Clear chats for this model
        state.chats[modelName] = [];
        
        // Reset active chat ID if it was for this model
        if (activeChat) {
          state.activeChatId = null;
        }
      }
    }
  }
});

export const { 
  createNewChat, 
  setActiveChat, 
  updateChatMessages, 
  updateChatTitle,
  deleteChat,
  clearAllChatsForModel
} = chatsSlice.actions;

export default chatsSlice.reducer;
