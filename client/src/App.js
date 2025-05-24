import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Paper, Typography, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ChatPanel, { drawerWidth } from './components/ChatPanel';
import { v4 as uuidv4 } from 'uuid';
import { isMultimodalModel } from './utils/modelUtils';
import { createNewChat, updateChatMessages, setActiveChat, updateChatTitle } from './features/chats/chatsSlice';

// Helper function to convert image file to base64 string
const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const API_BASE_URL = 'http://localhost:3001/api/ollama';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const chatHistoryRef = useRef(null);
  const dispatch = useDispatch();
  const { selectedModel, ollamaStatus } = useSelector((state) => state.ollama);
  const { activeChatId, chats } = useSelector((state) => state.chats);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Initialize a new chat when model changes and no active chat exists
  useEffect(() => {
    if (selectedModel && !activeChatId) {
      // Check if there are existing chats for this model
      const modelChats = chats[selectedModel];
      if (modelChats && modelChats.length > 0) {
        // Set the first chat as active
        dispatch(setActiveChat(modelChats[0].id));
      } else {
        // Create a new chat for this model
        dispatch(createNewChat({ modelName: selectedModel }));
      }
    }
  }, [selectedModel, activeChatId, chats, dispatch]);

  // Load messages from the active chat
  useEffect(() => {
    if (activeChatId) {
      let foundChat = null;
      // Find the active chat in all models
      for (const modelName in chats) {
        const chat = chats[modelName].find(c => c.id === activeChatId);
        if (chat) {
          foundChat = chat;
          break;
        }
      }
      
      // If found, set the messages
      if (foundChat) {
        setMessages(foundChat.messages);
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [activeChatId, chats]);

  // Scroll to bottom of chat history
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text, imageFile) => {
    if (!selectedModel || ollamaStatus !== 'connected' || !activeChatId) {
      console.error("Cannot send message: No model selected, no active chat, or Ollama disconnected.");
      return;
    }

    let imageDataUrl = null;
    if (imageFile) {
      imageDataUrl = await convertImageToBase64(imageFile);
    }

    const userMessage = { 
      id: uuidv4(), 
      text, 
      sender: 'user', 
      timestamp: new Date().toISOString(), 
      type: 'text',
      image: imageDataUrl
    };
    // Prepare messages for Ollama API
    const apiMessages = messages
        .map(msg => ({ 
            role: msg.sender === 'user' ? 'user' : 'assistant', 
            content: msg.text 
        }))
        .concat([{ role: 'user', content: text }]);
        
    // Prepare images for Ollama API (for multimodal models)
    let apiImages = [];
    if (imageDataUrl) {
      // Add the image data to the images array with its corresponding message index
      apiImages.push({
        messageIndex: apiMessages.length - 1, // Index of the last message (the one we just added)
        data: imageDataUrl
      });
    }

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Update the chat in the store
    dispatch(updateChatMessages({
      chatId: activeChatId,
      messages: updatedMessages
    }));
    
    setIsSending(true);

    const botMessageId = uuidv4();
    const botMessagePlaceholder = {
      id: botMessageId,
      text: '',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      isLoading: true,
      type: 'markdown' // Default type, can change based on content
    };
    
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, botMessagePlaceholder];
      
      // Update the chat in the store
      dispatch(updateChatMessages({
        chatId: activeChatId,
        messages: updatedMessages
      }));
      
      return updatedMessages;
    });

    let accumulatedResponse = '';
    let responseType = 'markdown';
    
    // Determine if we need to warn about sending images to a possibly non-multimodal model
    if (imageDataUrl && apiImages.length > 0) {
      const modelSupportsImages = isMultimodalModel(selectedModel);
      
      // Append an appropriate note to the assistant's response about images
      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage.sender === 'bot' && lastMessage.isLoading) {
          let warningText = "";
          
          if (!modelSupportsImages) {
            warningText = "⚠️ You've attached an image, but the current model doesn't appear to support image input. " +
                          "Please select a multimodal model (like llava, bakllava or others that support images) for best results.\n\n";
          } else {
            warningText = "📷 Image attached. This model supports image input and should respond to the image content.\n\n";
          }
          
          const updatedMessages = [...prevMessages.slice(0, -1), {
            ...lastMessage,
            text: warningText
          }];
          
          // Update the chat in the store
          dispatch(updateChatMessages({
            chatId: activeChatId,
            messages: updatedMessages
          }));
          
          return updatedMessages;
        }
        return prevMessages;
      });
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ 
          model: selectedModel, 
          messages: apiMessages,
          images: apiImages.length > 0 ? apiImages : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to connect to chat stream' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const processStreamedResponse = (parsedData) => {
        if (parsedData.done) {
          // This is the final "done" signal
          setMessages(prev => {
            const updatedMessages = prev.map(msg =>
              msg.id === botMessageId ? { ...msg, isLoading: false, text: accumulatedResponse, type: responseType } : msg
            );
            
            // Update the chat in the store
            dispatch(updateChatMessages({
              chatId: activeChatId,
              messages: updatedMessages
            }));
            
            return updatedMessages;
          });
          setIsSending(false);
          return true;
        }

        if (parsedData.message && parsedData.message.content) {
          accumulatedResponse += parsedData.message.content;
          // Check for code blocks
          if (accumulatedResponse.includes('```')) {
            responseType = 'code';
          }

          setMessages(prev => {
            const updatedMessages = prev.map(msg =>
              msg.id === botMessageId ? { ...msg, text: accumulatedResponse, type: responseType, isLoading: true } : msg
            );
            
            // Update the chat in the store
            dispatch(updateChatMessages({
              chatId: activeChatId,
              messages: updatedMessages
            }));
            
            return updatedMessages;
          });
        }
        return false;
      };

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          // SSE data is prefixed with "data: " and ends with "\n\n"
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonString = line.substring(5);
              if (jsonString.trim()) {
                try {
                  const parsedData = JSON.parse(jsonString);
                  if (processStreamedResponse(parsedData)) {
                    return;
                  }
                } catch (e) {
                  console.error("Error parsing streamed JSON:", e);
                }
              }
            }
          }
        }
      }

      // Stream finished but no "done" message received
      if (isSending) {
        setMessages(prev => {
          const updatedMessages = prev.map(msg =>
            msg.id === botMessageId ? { ...msg, isLoading: false, text: accumulatedResponse, type: responseType } : msg
          );
          
          // Update the chat in the store
          dispatch(updateChatMessages({
            chatId: activeChatId,
            messages: updatedMessages
          }));
          
          return updatedMessages;
        });
        setIsSending(false);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => {
        const updatedMessages = prev.map(msg =>
          msg.id === botMessageId ? { ...msg, text: `Error: ${error.message}`, isError: true, isLoading: false } : msg
        );
        
        // Update the chat in the store
        dispatch(updateChatMessages({
          chatId: activeChatId,
          messages: updatedMessages
        }));
        
        return updatedMessages;
      });
      setIsSending(false);
    }
  };

  const handleClearConversation = () => {
    setClearConfirmOpen(true);
  };

  const handleConfirmClear = () => {
    // Create a new chat with the current model
    if (selectedModel) {
      dispatch(createNewChat({ modelName: selectedModel }));
      setClearConfirmOpen(false);
    }
  };

  const handleCancelClear = () => {
    setClearConfirmOpen(false);
  };
  
  const handleExportChat = () => {
    if (!messages.length) return;
    
    // Find the active chat to get its title
    let chatTitle = "chat";
    for (const modelName in chats) {
      const chat = chats[modelName].find(c => c.id === activeChatId);
      if (chat) {
        chatTitle = chat.title.replace(/\s+/g, '_').toLowerCase();
        break;
      }
    }
    
    const fileName = `${chatTitle}_${selectedModel}_${new Date().toISOString().split('T')[0]}.json`;
    // Filter out role/content properties if they exist
    // Keep image data in the exported file
    const exportableMessages = messages.map(({role, content, ...rest}) => rest);
    const jsonStr = JSON.stringify(exportableMessages, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleImportChat = (event) => {
    const file = event.target.files[0];
    if (file && selectedModel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedMessages = JSON.parse(e.target.result);
          if (Array.isArray(importedMessages)) {
            // Ensure imported messages have the necessary fields
            const validatedMessages = importedMessages.map(msg => ({
                id: msg.id || uuidv4(),
                text: msg.text || '',
                sender: msg.sender || 'unknown',
                timestamp: msg.timestamp || new Date().toISOString(),
                type: msg.type || 'text',
                image: msg.image || null, // Preserve any image data
            }));
            
            // Create a new chat for the imported messages
            dispatch(createNewChat({ modelName: selectedModel }));
            
            // Wait a brief moment for the new chat to be created and selected
            setTimeout(() => {
              if (activeChatId) {
                // Update the messages in the new chat
                dispatch(updateChatMessages({
                  chatId: activeChatId,
                  messages: validatedMessages
                }));
                
                // Update the title based on the first user message
                const firstUserMessage = validatedMessages.find(msg => msg.sender === 'user');
                if (firstUserMessage) {
                  const titleText = firstUserMessage.text.length > 30 
                    ? firstUserMessage.text.substring(0, 30) + '...' 
                    : firstUserMessage.text;
                  dispatch(updateChatTitle({
                    chatId: activeChatId,
                    title: titleText
                  }));
                }
              }
            }, 100);
          } else {
            alert("Invalid chat history file format.");
          }
        } catch (err) {
          alert("Error importing chat history: " + err.message);
        }
      };
      reader.readAsText(file);
    }
    event.target.value = null; 
  };

  return (
    <Box sx={{  height: '100vh', bgcolor: 'grey.50' }}>
      <Header />
      <ChatPanel />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          pl: 0, // Remove left padding completely
          bgcolor: '#ffffff', // White background for main content
        }}
      >
        <Container 
          maxWidth="lg" 
          disableGutters // Remove default gutters
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            pt: '64px', 
            pb: 2, 
            px: {xs: 0.5, sm: 1},
            ml: 0 // Ensure no left margin on container
          }}>
          <Paper 
            ref={chatHistoryRef} 
            elevation={0} 
            sx={{ 
              flexGrow: 1, 
              p: {xs: 1, sm: 1.25}, 
              overflowY: 'auto', 
              mb: 1, 
              backgroundColor: 'white',
              borderRadius: 1,
              border: '1px solid rgba(0, 0, 0, 0.05)',
              mx: 0.5 // Add small margin on sides
            }}
          >
            {messages.length === 0 && (
              <Typography variant="body1" color="textSecondary" sx={{textAlign: 'center', mt: 3}}>
                {selectedModel ? `No messages yet. Start chatting with ${selectedModel}!` : 'Please select a model to begin.'}
              </Typography>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </Paper>
          <Box sx={{display: 'flex', justifyContent:'space-between', alignItems: 'center', mb:0.75, mx:1}}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button size="small" onClick={handleClearConversation} disabled={messages.length === 0 || isSending} sx={{ textTransform: 'none', minWidth: 0, py: 0.5 }}>New Chat</Button>
                  <Button size="small" onClick={handleExportChat} disabled={messages.length === 0 || isSending} sx={{ textTransform: 'none', minWidth: 0, py: 0.5 }}>Export Chat</Button>
                  <Button size="small" component="label" disabled={!selectedModel || isSending} sx={{ textTransform: 'none', minWidth: 0, py: 0.5 }}>
                      Import Chat
                      <input type="file" accept=".json" hidden onChange={handleImportChat} />
                  </Button>
              </Box>
          </Box>
          <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />
        </Container>
      </Box>

      <Dialog 
        open={clearConfirmOpen} 
        onClose={handleCancelClear}
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle>Start New Chat?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to start a new chat? Your current chat will be saved in the history panel.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClear}>Cancel</Button>
          <Button onClick={handleConfirmClear} color="primary">New Chat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default App;
