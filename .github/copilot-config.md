# GitHub Copilot Configuration File

# This configuration file instructs GitHub Copilot on how to interact with the ChatBox project.
# It provides guidelines, patterns, and project-specific knowledge to ensure consistency.

## Project: ChatBox - Ollama Chat Interface

### Architecture Overview
- Client-Server architecture with React frontend (port 3000) and Express backend (port 3001)
- Communication with Ollama server at port 11434
- Redux for state management using Redux Toolkit
- Material-UI v5 for styling and components
- Streaming responses using SSE (Server-Sent Events)

### Tech Stack
- Frontend: React 19, Redux Toolkit, Material-UI v5, React Markdown, React Syntax Highlighter
- Backend: Node.js, Express, Axios
- Communication: Axios, Fetch API with Streaming

### Coding Patterns & Standards

#### Component Structure
- Use functional components with hooks
- Keep components focused on single responsibility
- Extract complex logic to custom hooks
- Use JSX for component rendering

#### State Management
- Use Redux for global state (ollama connection, models, etc.)
- Use local React state for component-specific concerns
- Follow Redux Toolkit patterns with slices and thunks
- Keep reducers pure and side-effect free

#### Styling
- Use Material-UI's sx prop for component styling
- Follow Material Design principles
- Ensure mobile responsiveness
- Use theme variables for consistent colors and spacing

#### Error Handling
- Wrap async operations in try/catch
- Display user-friendly error messages
- Log detailed errors to console
- Implement proper error boundaries in React components

### Key Files & Their Purposes

#### Frontend
- `App.js`: Main component orchestrating the application, manages chat history
- `ChatMessage.js`: Renders individual messages with markdown/code support
- `Header.js`: App header with model selection, connection status
- `ChatInput.js`: User input interface for sending messages
- `ollamaSlice.js`: Redux slice for Ollama-related state management

#### Backend
- `server.js`: Express server configuration, middleware setup
- `ollamaController.js`: Handles API routes for communicating with Ollama
- `ollamaRoutes.js`: Defines API endpoints
- `rateLimiter.js`: Manages request rate limiting and error handling

### Message Format
```javascript
{
  id: String,           // UUID
  text: String,         // Message content
  sender: String,       // 'user' or 'bot'
  timestamp: String,    // ISO timestamp
  type: String,         // 'text', 'markdown', or 'code'
  isLoading: Boolean,   // Optional, indicates if message is loading
  isError: Boolean      // Optional, indicates if message has error
}
```

### New Feature Guidelines
- Maintain existing architecture patterns
- Add appropriate Redux state for new features
- Follow Material-UI styling conventions
- Add comprehensive error handling
- Update documentation in DOCUMENTATION.md
- Consider mobile responsiveness

### API Endpoints
- GET /api/ollama/health: Check Ollama server status
- GET /api/ollama/tags: Fetch available models
- POST /api/ollama/chat: Send chat request and receive streaming response

### Performance Guidelines
- Implement proper cleanup for resources (streams, connections)
- Optimize rendering of large chat histories
- Implement proper caching strategies
- Follow rate limiting patterns for API calls

# This file should be kept up to date with any changes to project architecture or patterns.
# Last updated: May 17, 2025