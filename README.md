# ChatBox - Ollama Chat Interface

A modern UI for interacting with local Ollama language models.

## Features

- Real-time connection to Ollama server at `http://localhost:11434`
- Model management (view available models)
- Image attachment support for multimodal models
- Visual indicators for models supporting image input
- Streaming chat responses
- Syntax-highlighted code blocks
- Markdown rendering
- Multi-chat management with streamlined sidebar
- Persistent chat history across browser sessions with redux-persist
- Export/import conversation history with image support
- Responsive design with optimized spacing for all screen sizes
- Modern UI with subtle visual cues and consistent styling

## Prerequisites

- [Node.js](https://nodejs.org) (v14+)
- [Ollama](https://ollama.ai) running locally
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- 2GB RAM minimum (4GB recommended for optimal performance)

## Getting Started

1. Start your Ollama server (ensure it's accessible at http://localhost:11434)
2. Clone this repository
3. Install dependencies:

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install
cd ..

# Optional: Install development tools
npm install -D prettier eslint
```

4. Start the development servers:

```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend development server (port 3000).

### Optimizing Performance

For the best experience:
- Use a modern browser with localStorage support
- Clear browser cache if you experience UI inconsistencies
- Keep chat history size manageable (export older chats if needed)
- Consider using a Chromium-based browser for optimal performance

## Usage

1. Open your browser to `http://localhost:3000`
2. Select a model from the dropdown in the header
3. Use the left sidebar to navigate between previous chats or start a new one
4. Start chatting!

### Interface

The user interface consists of:
- A header with model selection dropdown and status indicators
- A streamlined left sidebar (220px) showing your chat history for the selected model
- The main chat area where conversations happen, with optimized spacing
- A footer with input area for your messages and attachment options

You can:
- Start a new chat with the "New Chat" button in the sidebar or footer
- Switch between previous chats using the compact sidebar
- Rename or delete chats using the options menu (three dots)
- Export and import chat history with a single click
- Attach images to messages when using multimodal models

### Interface Styling

The interface has been carefully designed with attention to detail:

#### Layout & Spacing
- Ultra-compact 200px sidebar with minimal spacing
- Optimized padding that scales with screen size
- Clean visual separation between components
- Maximum use of vertical space with dense UI elements
- Reduced margins and gutters for content focus

#### Visual Design
- Light background colors for visual hierarchy
- Subtle shadows and borders for depth
- Consistent typography with improved readability
- Smooth transitions and hover effects
- Clean button styling without uppercase text

#### Customization
You can customize the interface by modifying the theme in `src/theme.js`. Common customizations include:
- Changing the color scheme
- Adjusting the sidebar width
- Modifying spacing and padding
- Updating typography settings

### Keyboard Shortcuts

For efficient navigation and operation:
- `Ctrl/Cmd + N`: Start a new chat
- `Ctrl/Cmd + Up/Down`: Navigate between chats
- `Ctrl/Cmd + E`: Export current chat
- `Ctrl/Cmd + I`: Import chat
- `Enter`: Send message
- `Shift + Enter`: Add new line in message

### Server Logs

The server includes a comprehensive logging system:

- View logs in your browser: `http://localhost:3001/logs/html`
- Access logs via API: `http://localhost:3001/logs`
- Filter logs by date range and access advanced features
- Log rotation and management built-in

## Chat Persistence

ChatBox now includes robust chat persistence features:

#### Local Storage
- Chat history automatically saved to browser's localStorage
- Persists across page refreshes and browser restarts
- Separate history maintained for each model
- Automatic cleanup of old data to prevent storage overflow

#### Import/Export
- Export individual chats or entire history
- JSON format with support for:
  - Chat messages and timestamps
  - Image attachments (base64 encoded)
  - Chat titles and metadata
- Import previously exported chats
- Automatic validation of imported data

#### Data Management
- Rename chats for better organization
- Delete individual chats or clear all
- Automatic title generation from first message
- Last updated timestamps for easy reference

## Application Structure

### Client Side (`/client`)
- `/src/components` - React UI components
  - `/ChatInput` - Message input and attachments
  - `/ChatMessage` - Message display and formatting
  - `/ChatPanel` - Sidebar and chat management
  - `/Header` - App header and controls
- `/src/features` - Redux feature slices
  - `/chats` - Chat state management
  - `/ollama` - Ollama API integration
- `/src/store` - Redux store configuration
- `/src/utils` - Helper functions and utilities

### Server Side (`/server`)
- `/controllers` - Request handlers
- `/middleware` - Custom middleware (rate limiting, etc.)
- `/routes` - API route definitions
- `/utils` - Server utilities
- `server.js` - Main Express server

### Configuration
- `DOCUMENTATION.md` - Comprehensive documentation
- `.github/copilot-config.md` - GitHub Copilot setup
- `.vscode/settings.json` - VS Code configuration
- `.copilotignore` - Copilot context exclusions
- Various configuration files (package.json, etc.)

## Documentation & Copilot Integration

This project includes comprehensive documentation and GitHub Copilot integration:

- **DOCUMENTATION.md**: Detailed information about the application architecture, coding standards, and development guidelines.

- **GitHub Copilot Configuration**: 
  - `.github/copilot-config.md`: Contains project patterns and architecture details
  - `.vscode/settings.json`: Configures VS Code to use the Copilot context
  - `.copilotignore`: Excludes irrelevant files from Copilot context

These configurations ensure that GitHub Copilot automatically understands the project structure and provides context-aware code suggestions without requiring manual reference to documentation.

## Recent Updates (May 2025)

- **Enhanced Chat Persistence** - Implemented Redux persistence using localStorage to maintain chat history across browser refreshes and sessions
- **UI Improvements** 
  - Reduced sidebar width and optimized spacing between components
  - Added visual separation with subtle background colors and shadows
  - Implemented responsive padding for different screen sizes
  - Enhanced button and list item styling for better usability
  - Made typography more compact while maintaining readability
- **Bug Fixes** - Addressed various UI glitches and layout problems, particularly with responsive designs

For more details on these and other updates, please refer to the DOCUMENTATION.md file.

## Troubleshooting

Common issues and solutions:

#### UI Issues
- **Sidebar spacing looks incorrect**: Clear browser cache and reload
- **Chat history not showing**: Check localStorage permissions
- **Images not displaying**: Ensure using a supported model for images
- **UI elements misaligned**: Try a hard refresh (Ctrl/Cmd + Shift + R)

#### Performance
- **Slow response times**: Check Ollama server status and connection
- **Chat list laggy**: Consider exporting and clearing old chats
- **High memory usage**: Reduce number of stored chats
- **Delayed updates**: Verify browser's localStorage quota isn't full

#### Connection
- **Can't connect to Ollama**: Verify server is running on port 11434
- **API errors**: Check server logs for detailed error messages
- **Streaming issues**: Ensure stable network connection
- **CORS errors**: Verify server configuration and allowed origins

## License

MIT
