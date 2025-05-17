# ChatBox - Ollama Chat Interface

A modern UI for interacting with local Ollama language models.

## Features

- Real-time connection to Ollama server at `http://localhost:11434`
- Model management (view available models)
- Streaming chat responses
- Syntax-highlighted code blocks
- Markdown rendering
- Chat history management (localStorage)
- Export/import conversation history
- Mobile-responsive design

## Prerequisites

- [Node.js](https://nodejs.org) (v14+)
- [Ollama](https://ollama.ai) running locally

## Getting Started

1. Start your Ollama server
2. Clone this repository
3. Install dependencies:

```
npm install
cd client && npm install
cd ..
```

4. Start the development servers:

```
npm run dev
```

This will start both the backend server (port 3001) and frontend development server (port 3000).

## Usage

1. Open your browser to `http://localhost:3000`
2. Select a model from the dropdown in the header
3. Start chatting!

## Application Structure

- `/client` - React frontend
- `/server` - Express backend API
  - Proxies requests to Ollama
  - Handles streaming responses
  - Provides health checks
- `DOCUMENTATION.md` - Comprehensive project documentation
- `.github/copilot-config.md` - GitHub Copilot configuration file
- `.vscode/settings.json` - VS Code settings including Copilot integration
- `.copilotignore` - Exclusions for Copilot context

## Documentation & Copilot Integration

This project includes comprehensive documentation and GitHub Copilot integration:

- **DOCUMENTATION.md**: Detailed information about the application architecture, coding standards, and development guidelines.

- **GitHub Copilot Configuration**: 
  - `.github/copilot-config.md`: Contains project patterns and architecture details
  - `.vscode/settings.json`: Configures VS Code to use the Copilot context
  - `.copilotignore`: Excludes irrelevant files from Copilot context

These configurations ensure that GitHub Copilot automatically understands the project structure and provides context-aware code suggestions without requiring manual reference to documentation.

## License

MIT
