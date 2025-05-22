# ChatBox - Ollama Chat Interface Documentation

This comprehensive documentation provides detailed information about the ChatBox application architecture, coding standards, features, and guidelines for future development. It serves as a reference for developers to understand how the project is built and how to maintain consistency when adding new features.

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Application Components](#application-components)
   - [Server Components](#server-components)
   - [Client Components](#client-components)
6. [Development Workflow](#development-workflow)
7. [Feature Specifications](#feature-specifications)
8. [Coding Standards](#coding-standards)
9. [State Management](#state-management)
10. [API Communication](#api-communication)
11. [Error Handling](#error-handling)
12. [Performance Considerations](#performance-considerations)
13. [Security Measures](#security-measures)
14. [Future Enhancements](#future-enhancements)
15. [GitHub Copilot Integration](#github-copilot-integration)

## Project Overview

ChatBox is a modern web application that provides a user-friendly interface for interacting with locally hosted Ollama language models. It allows users to have conversational interactions with various AI models, with features such as streaming responses, markdown rendering, code syntax highlighting, and conversation history management.

### Key Features

- Real-time connection to Ollama server at `http://localhost:11434`
- Model selection from available Ollama models
- Image attachment support for multimodal models
- Visual indicators for models supporting image input
- Streaming chat responses with real-time updates
- Syntax-highlighted code blocks
- Markdown rendering
- Chat history management using localStorage
- Export/import conversation history with image support
- Mobile-responsive design
- Rate limiting and error handling

## System Architecture

ChatBox follows a client-server architecture:

```
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│               │        │               │        │               │
│   React UI    │◄─────► │  Express API  │◄─────► │ Ollama Server │
│  (Port 3000)  │        │  (Port 3001)  │        │ (Port 11434)  │
│               │        │               │        │               │
└───────────────┘        └───────────────┘        └───────────────┘
```

- **React Frontend (Port 3000)**: Handles the user interface, state management, and presentation logic.
- **Express Backend (Port 3001)**: Acts as a middleware/proxy between the frontend and Ollama, providing API endpoints, handling streaming, and implementing rate limiting.
- **Ollama Server (Port 11434)**: Provides the language model capabilities that power the chat functionality.

## Tech Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web server framework
- **Axios**: HTTP client for API requests
- **CORS**: Cross-origin resource sharing middleware

### Frontend
- **React**: UI library
- **React Redux & Redux Toolkit**: State management
- **Material-UI v5**: Component library for styling
- **Axios**: HTTP client for API requests
- **React Markdown**: Markdown rendering
- **React Syntax Highlighter**: Code block syntax highlighting
- **UUID**: Unique ID generation for messages

## Project Structure

```
chatbox/
├── client/                  # Frontend React application
│   ├── public/              # Static files
│   └── src/
│       ├── components/      # React components
│       ├── features/        # Redux slices (feature-based organization)
│       └── store/           # Redux store configuration
├── server/                  # Backend Express server
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Custom middleware
│   ├── routes/              # API routes
│   └── server.js            # Main server file
├── .github/                 # GitHub configurations
│   └── copilot-config.md    # GitHub Copilot configuration
├── .vscode/                 # VS Code configurations
│   └── settings.json        # Editor settings including Copilot config
└── .copilotignore           # Files to exclude from Copilot context
```

## Application Components

### Server Components

#### Server.js
Main entry point for the Express server. Sets up middleware, routes, and error handling.

#### Controllers
- **ollamaController.js**
  - `checkOllamaHealth`: Verifies if the Ollama server is accessible
  - `getOllamaTags`: Fetches available models from Ollama
  - `streamChat`: Handles streaming chat responses from Ollama to the client

#### Middleware
- **rateLimiter.js**
  - Implements request rate limiting to prevent overloading the Ollama server
  - Tracks active requests and enforces limits
  - Provides error handling
  - Logs API usage statistics

#### Routes
- **ollamaRoutes.js**
  - Defines API endpoints:
    - `GET /health`: Ollama server health check
    - `GET /tags`: Fetch available models
    - `POST /chat`: Stream chat responses

### Client Components

#### State Management
- **ollamaSlice.js**: Redux slice for managing Ollama-related state:
  - Server connection status
  - Available models
  - Selected model
  - Error handling
  - Connection retries

#### React Components

- **App.js**
  - Main component that orchestrates the application
  - Manages chat history using localStorage
  - Handles message sending, receiving, and streaming
  - Implements export/import functionality

- **Header.js**
  - Displays application title
  - Shows Ollama connection status
  - Provides model selection dropdown
  - Contains menu for chat actions (clear, export, import)

- **ChatMessage.js**
  - Renders individual chat messages
  - Handles different message types (text, markdown, code)
  - Provides copy functionality
  - Displays loading indicators and timestamps

- **ChatInput.js**
  - Text input for user messages
  - Send button with loading state
  - Support for keyboard shortcuts (Ctrl+Enter)

## Development Workflow

1. **Installation**:
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install
   ```

2. **Development**:
   ```bash
   # Start both client and server with hot reload
   npm run dev
   ```

3. **Production**:
   ```bash
   # Build the client
   cd client && npm run build
   
   # Start the production server
   npm start
   ```

## Feature Specifications

### Chat System

1. **Message Format**:
   ```javascript
   {
     id: String,           // UUID
     text: String,         // Message content
     sender: String,       // 'user' or 'bot'
     timestamp: String,    // ISO timestamp
     type: String,         // 'text', 'markdown', or 'code'
     isLoading: Boolean,   // Optional, indicates if message is loading
     isError: Boolean,     // Optional, indicates if message has error
     image: String         // Optional, base64-encoded image data
   }
   ```

2. **Chat History**:
   - Stored per-model in localStorage
   - Key format: `chatHistory_${modelName}`
   - Automatically loaded/saved when model changes or messages update

3. **Message Streaming**:
   - Uses Server-Sent Events (SSE) protocol
   - Progressive updates to message content as chunks arrive
   - Type detection for markdown vs code content
   - Loading indicator during streaming

### Model Management

1. **Model Selection**:
   - Dropdown in header displays available models
   - Models are fetched on initial load and periodically refreshed
   - Selecting a model loads corresponding chat history

2. **Server Health**:
   - Automatic health checks with exponential backoff retries
   - Visual indicator of connection status
   - Error messages when connection fails

### Export/Import

1. **Export Format**:
   - JSON file with array of message objects
   - Filename format: `chat_history_${modelName}_${date}.json`

2. **Import Process**:
   - File input accepts .json files
   - Validates message structure
   - Replaces current chat history with imported messages

## Coding Standards

### Frontend Coding Standards

1. **Component Structure**:
   - Use functional components with hooks
   - Keep components focused on a single responsibility
   - Extract complex logic to custom hooks
   - Use JSX for component rendering

2. **State Management**:
   - Use Redux for global state
   - Use local state (useState) for component-specific state
   - Implement Redux using the Redux Toolkit pattern
   - Keep reducers pure and side-effect free

3. **Styling**:
   - Use Material-UI's sx prop for component styling
   - Follow Material Design principles
   - Ensure mobile responsiveness
   - Use theme variables for consistent colors and spacing

4. **Error Handling**:
   - Implement proper error boundaries
   - Display user-friendly error messages
   - Log detailed errors to console
   - Handle network errors gracefully

### Backend Coding Standards

1. **API Structure**:
   - Follow RESTful principles
   - Use controllers to separate logic from routes
   - Implement middleware for cross-cutting concerns
   - Use proper HTTP status codes

2. **Error Handling**:
   - Use try/catch blocks around async operations
   - Implement global error handler middleware
   - Return meaningful error messages to the client
   - Log detailed errors server-side

3. **Security**:
   - Validate and sanitize all inputs
   - Implement proper CORS settings
   - Avoid exposing sensitive information
   - Rate limit to prevent abuse

## State Management

### Redux Store Structure

```javascript
{
  ollama: {
    ollamaStatus: String,     // 'checking', 'connected', 'disconnected', 'error'
    models: Array,            // List of available models
    selectedModel: String,    // Currently selected model
    modelStatus: String,      // 'idle', 'loading', 'ready', 'error'
    error: String | Object,   // Error information
    connectionRetries: Number // Connection retry count
  }
}
```

### Redux Actions

- `checkOllamaServerHealth`: Async thunk to verify Ollama server status
- `fetchOllamaModels`: Async thunk to fetch available models
- `setSelectedModel`: Action to update the selected model
- `setOllamaStatus`: Action to update connection status
- `setModelStatus`: Action to update model loading status
- `incrementConnectionRetries`: Action to increment retry counter
- `resetConnectionRetries`: Action to reset retry counter

## API Communication

### Endpoint Specifications

1. **GET /api/ollama/health**
   - Purpose: Check if Ollama server is accessible
   - Response: `{ ollamaStatus: String }`

2. **GET /api/ollama/tags**
   - Purpose: Fetch available models
   - Response: `{ models: Array }`

3. **POST /api/ollama/chat**
   - Purpose: Send a chat message and get streaming response
   - Request Body: `{ model: String, messages: Array }`
   - Response: Server-Sent Events (SSE) stream
   - SSE Format: `data: { message: { content: String }, done: Boolean }`

### Streaming Implementation

1. **Server-side**:
   - Set proper SSE headers
   - Process Ollama API response stream
   - Parse and forward JSON chunks to client
   - Handle disconnections and cleanup

2. **Client-side**:
   - Use fetch API with proper headers
   - Process response with ReadableStream and TextDecoder
   - Parse SSE format and update UI accordingly
   - Handle connection errors and retry if needed

## Error Handling

### Types of Errors

1. **Connection Errors**:
   - Ollama server unavailable
   - Network issues
   - Retry with exponential backoff

2. **API Errors**:
   - Invalid model
   - Invalid message format
   - Server overload
   - Display error message to user

3. **Streaming Errors**:
   - Connection dropped during streaming
   - Invalid JSON in stream
   - Complete message with error indicator

### Error Presentation

- Use appropriate UI components (Chip, Alert, etc.)
- Color coding (red for errors, yellow for warnings)
- Detailed error messages when appropriate
- Graceful fallbacks for unexpected failures

## Performance Considerations

1. **Rate Limiting**:
   - Server-side limiting of concurrent requests
   - Backoff strategy for retries
   - Queue for managing request flow

2. **Resource Usage**:
   - Efficient message rendering and updates
   - Cleanup for streams and connections
   - Proper memory management for large chat histories

3. **Caching**:
   - Local storage for chat histories
   - In-memory cache for frequently accessed data
   - Refresh strategy for periodically updated data

## Security Measures

### Content Security Policy (CSP)
The application implements a Content Security Policy to mitigate cross-site scripting (XSS) attacks by controlling which resources can be loaded and executed:

```javascript
app.use((_req: Request, res: Response, next: Function) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:*;"
  );
  next();
});
```

This policy:
- Restricts scripts and styles to same-origin or inline code
- Allows images from the same origin or data URIs
- Permits connections to same-origin endpoints and local development servers

### Rate Limiting
API routes, especially those communicating with the Ollama service, are protected with rate limiting to prevent abuse.

### TypeScript Migration
The server codebase is being migrated to TypeScript to improve type safety, catch errors at build time, and provide better developer tooling.

### Dependency Management
Regular security audits are conducted on dependencies. See `DEPENDENCY_UPDATE_NOTES.md` for the current status of package updates and known vulnerabilities.

### Future Security Improvements
For planned security enhancements, refer to the `MIGRATION_PLAN.md` file, which outlines a roadmap for addressing dependency vulnerabilities and improving overall application security.

## Future Enhancements

1. **User Experience**:
   - Theme customization
   - Font size options
   - Message search functionality
   - Message editing

2. **Advanced Features**:
   - Multiple concurrent chats
   - Model parameters customization
   - File upload support
   - Session management

3. **Performance Improvements**:
   - Worker threads for intensive operations
   - Virtual scrolling for large chat histories
   - Progressive web app capabilities
   - Offline support

## GitHub Copilot Integration

### Automatic Configuration

GitHub Copilot is configured to automatically understand the ChatBox project structure and coding patterns through several configuration files:

1. **Copilot Configuration File**:
   - Located at `.github/copilot-config.md`
   - Contains essential information about:
     - Project architecture
     - Tech stack
     - Coding standards
     - Key file purposes
     - Message formats
     - API endpoints

2. **VS Code Settings**:
   - Located at `.vscode/settings.json`
   - Configures Copilot to use the project context
   - Sets appropriate editor settings for consistency

3. **Copilot Ignore File**:
   - Located at `.copilotignore`
   - Excludes irrelevant files like node_modules from Copilot's context
   - Helps Copilot focus on relevant code patterns

### Using Copilot with this Project

With this configuration, GitHub Copilot will automatically:

1. **Understand Project Context**: Copilot has immediate knowledge of project structure and patterns
2. **Generate Consistent Code**: Suggestions will follow established coding standards
3. **Use Appropriate Dependencies**: Recommended imports will match the project's tech stack
4. **Implement Error Handling**: Follow established error handling patterns

### Maintaining the Configuration

When making significant changes to the project:

1. Update the `.github/copilot-config.md` file to reflect new architecture or patterns
2. Keep the `.copilotignore` file current if directory structure changes
3. Update this documentation with new features or standards

### Documentation Update Protocol

When a new feature is implemented, this documentation should be updated as follows:

1. Add the feature description to the relevant section
2. Document any new components or APIs
3. Update the state management section if applicable
4. Add any new coding standards or patterns
5. Document potential error scenarios and handling
6. Update future enhancements section to reflect completed items

---

*This documentation was last updated on: May 17, 2025*

*Note: Keep this documentation up-to-date as the project evolves. When implementing new features or making significant changes, ensure this document is revised accordingly.*