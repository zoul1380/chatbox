import React, { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'flex-end', 
      mt: 2, 
      gap: 1,
      position: 'sticky',
      bottom: 0,
      backgroundColor: 'background.default',
      p: 2,
      borderTop: '1px solid',
      borderColor: 'divider'
    }}>
      <TextField
        fullWidth
        multiline
        label="Ask a question..."
        variant="outlined"
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxRows={4}
        disabled={isLoading}
        InputProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      />
      <IconButton 
        color="primary" 
        onClick={handleSend} 
        disabled={!message.trim() || isLoading}
        sx={{ 
          height: 56, 
          width: 56,
          backgroundColor: 'primary.main',
          color: 'white',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
          '&.Mui-disabled': {
            backgroundColor: 'action.disabledBackground',
            color: 'action.disabled',
          }
        }}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
      </IconButton>
    </Box>
  );
};

export default ChatInput;
