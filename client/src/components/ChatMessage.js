// filepath: g:\code\chatbox\client\src\components\ChatMessage.js
import React, { useState } from 'react';
import { Box, Paper, Typography, CircularProgress, Tooltip, IconButton } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import Avatar from '@mui/material/Avatar';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DownloadIcon from '@mui/icons-material/Download';

const ChatMessage = ({ message }) => {
  const { text, sender, timestamp, isLoading, isError, image } = message;
  const isUser = sender === 'user';
  const content = (typeof text === 'string') ? text : (text || '').toString();
  const [openImageDialog, setOpenImageDialog] = useState(false);
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };
  
  const handleOpenImage = () => {
    setOpenImageDialog(true);
  };
  
  const handleCloseImage = () => {
    setOpenImageDialog(false);
  };
  
  const handleDownloadImage = () => {
    if (image) {
      const link = document.createElement('a');
      link.href = image;
      link.download = `image-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 2,
        gap: 1,
        alignItems: 'flex-start'
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Avatar 
          sx={{ 
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            width: 36,
            height: 36
          }}
        >
          {isUser ? <PersonIcon /> : <SmartToyIcon />}
        </Avatar>
        {isLoading && (
          <CircularProgress 
            size={16} 
            sx={{ 
              position: 'absolute',
              bottom: -4,
              right: -4
            }} 
          />
        )}
      </Box>
      
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          maxWidth: '80%',
          backgroundColor: isUser ? 'primary.light' : 'background.paper',
          borderRadius: 2,
          overflowX: 'auto'
        }}
      >
        {image && (
          <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
            <Box 
              component="img"
              src={image}
              alt="Attached image"
              sx={{ 
                maxWidth: '100%', 
                maxHeight: '200px', 
                borderRadius: 1,
                cursor: 'pointer'
              }}
              onClick={handleOpenImage}
            />
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 5, 
                right: 5, 
                display: 'flex',
                gap: 0.5,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 1,
                p: 0.5
              }}
            >
              <Tooltip title="View Full Size">
                <IconButton size="small" onClick={handleOpenImage} sx={{ color: 'white' }}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton size="small" onClick={handleDownloadImage} sx={{ color: 'white' }}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
        
        {(text && text.trim() !== '') && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={nord}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ node, ...props }) => (
                <Typography variant="body1" component="p" sx={{ my: 1 }} {...props} />
              ),
              h1: ({ node, ...props }) => (
                <Typography variant="h4" component="h1" sx={{ mt: 3, mb: 2 }} {...props} />
              ),
              h2: ({ node, ...props }) => (
                <Typography variant="h5" component="h2" sx={{ mt: 2, mb: 1.5 }} {...props} />
              ),
              h3: ({ node, ...props }) => (
                <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }} {...props} />
              ),
              ul: ({ node, ...props }) => (
                <Box component="ul" sx={{ pl: 4, my: 1 }} {...props} />
              ),
              ol: ({ node, ...props }) => (
                <Box component="ol" sx={{ pl: 4, my: 1 }} {...props} />
              ),
              li: ({ node, ...props }) => (
                <Box component="li" sx={{ my: 0.5 }} {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <Box 
                  component="blockquote"
                  sx={{
                    pl: 2,
                    borderLeft: 4,
                    borderColor: 'grey.400',
                    fontStyle: 'italic',
                    my: 2
                  }}
                  {...props}
                />
              )
            }}
          >
            {content}
          </ReactMarkdown>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, alignItems: 'center', opacity: 0.7 }}>
          <Typography variant="caption" color={isUser ? 'inherit' : 'text.secondary'}>
            {new Date(timestamp).toLocaleTimeString()}
          </Typography>
          {!isUser && content && content.trim() !== '' && (
            <Tooltip title="Copy message">
              <IconButton size="small" onClick={handleCopyToClipboard} color="inherit">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isError && (
            <Typography variant="caption" color="error">
              Error
            </Typography>
          )}
        </Box>
      </Paper>
      
      {/* Full-size image dialog */}
      <Dialog
        open={openImageDialog}
        onClose={handleCloseImage}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 1 }}>
          <Box 
            component="img"
            src={image}
            alt="Full size image"
            sx={{ maxWidth: '100%', maxHeight: '90vh' }}
          />
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Download">
              <IconButton onClick={handleDownloadImage}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ChatMessage;
