import React, { useState, useRef } from 'react';
import { Box, TextField, IconButton, CircularProgress, Tooltip, Typography, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import { useSelector } from 'react-redux';
import { isMultimodalModel } from '../utils/modelUtils';

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { selectedModel } = useSelector((state) => state.ollama);
  const isModelMultimodal = isMultimodalModel(selectedModel);

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSend = () => {
    if ((message.trim() || selectedImage) && !isLoading) {
      onSendMessage(message.trim(), selectedImage);
      setMessage('');
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      mt: 2, 
      gap: 1,
      position: 'sticky',
      bottom: 0,
      backgroundColor: 'background.default',
      p: 2,
      borderTop: '1px solid',
      borderColor: 'divider'
    }}>      {imagePreview && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ 
            position: 'relative', 
            display: 'inline-block', 
            maxWidth: '200px',
          }}>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100px', 
                borderRadius: '4px',
                border: '1px solid #ddd'
              }} 
            />
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                backgroundColor: 'error.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'error.dark',
                },
                width: 20,
                height: 20,
                fontSize: '0.75rem'
              }}
              onClick={handleCancelImage}
            >
              ✕
            </IconButton>
          </Box>
          
          {selectedImage && !isModelMultimodal && (
            <Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem', py: 0 }}>
              Current model may not support images. Consider selecting a model with image capabilities.
            </Alert>
          )}
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
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
        <Tooltip title="Attach Image">
          <IconButton 
            color="primary" 
            onClick={handleImageSelect} 
            disabled={isLoading}
            sx={{ 
              height: 56, 
              width: 56
            }}
          >
            <ImageIcon />
          </IconButton>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
        <IconButton 
          color="primary" 
          onClick={handleSend} 
          disabled={(!message.trim() && !selectedImage) || isLoading}
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
    </Box>
  );
};

export default ChatInput;
