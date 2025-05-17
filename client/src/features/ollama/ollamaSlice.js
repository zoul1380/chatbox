import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/ollama'; // Your backend API

export const checkOllamaServerHealth = createAsyncThunk(
  'ollama/checkHealth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { ollamaStatus: 'Ollama server is not responding', error: error.message });
    }
  }
);

export const fetchOllamaModels = createAsyncThunk(
  'ollama/fetchModels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tags`);
      return response.data.models; // Assuming the backend returns { models: [...] }
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch models', error: error.message });
    }
  }
);

const initialState = {
  ollamaStatus: 'checking', // checking, connected, disconnected, error
  models: [],
  selectedModel: null,
  modelStatus: 'idle', // idle, loading, ready, error
  error: null,
  connectionRetries: 0,
};

const ollamaSlice = createSlice({
  name: 'ollama',
  initialState,
  reducers: {
    setOllamaStatus: (state, action) => {
      state.ollamaStatus = action.payload;
    },
    setSelectedModel: (state, action) => {
      state.selectedModel = action.payload;
      // Optionally, reset chat history or model status when model changes
      state.modelStatus = 'idle'; 
    },
    setModelStatus: (state, action) => {
      state.modelStatus = action.payload;
    },
    incrementConnectionRetries: (state) => {
      state.connectionRetries += 1;
    },
    resetConnectionRetries: (state) => {
      state.connectionRetries = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Health Check
      .addCase(checkOllamaServerHealth.pending, (state) => {
        state.ollamaStatus = 'checking';
      })
      .addCase(checkOllamaServerHealth.fulfilled, (state, action) => {
        // Assuming your backend returns { ollamaStatus: 'Ollama server is responsive' } on success
        if (action.payload.ollamaStatus === 'Ollama server is responsive') {
          state.ollamaStatus = 'connected';
          state.error = null;
          state.connectionRetries = 0; // Reset retries on successful connection
        } else {
          state.ollamaStatus = 'disconnected'; // Or some other status based on payload
          state.error = action.payload.error || 'Unknown health check issue';
        }
      })
      .addCase(checkOllamaServerHealth.rejected, (state, action) => {
        state.ollamaStatus = 'disconnected';
        state.error = action.payload?.error || 'Failed to connect to Ollama server';
      })
      // Fetch Models
      .addCase(fetchOllamaModels.pending, (state) => {
        state.modelStatus = 'loading';
      })
      .addCase(fetchOllamaModels.fulfilled, (state, action) => {
        state.models = action.payload;
        state.modelStatus = 'idle'; // Or 'ready' if you want to indicate models are loaded
        state.error = null;
      })
      .addCase(fetchOllamaModels.rejected, (state, action) => {
        state.modelStatus = 'error';
        state.error = action.payload?.message || 'Failed to fetch models';
      });
  },
});

export const {
  setOllamaStatus,
  setSelectedModel,
  setModelStatus,
  incrementConnectionRetries,
  resetConnectionRetries
} = ollamaSlice.actions;

export default ollamaSlice.reducer;
