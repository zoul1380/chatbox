import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box,
  List, 
  Typography, 
  Divider, 
  Button,
  ListSubheader,
  ListItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChatListItem from './ChatListItem';
import { createNewChat } from '../../features/chats/chatsSlice';

const ChatList = () => {
  const dispatch = useDispatch();
  const { chats, activeChatId } = useSelector(state => state.chats);
  const { selectedModel } = useSelector(state => state.ollama);
  
  // Get chats for the currently selected model
  const modelChats = selectedModel && chats[selectedModel] ? chats[selectedModel] : [];
  
  const handleNewChat = () => {
    if (selectedModel) {
      dispatch(createNewChat({ modelName: selectedModel }));
    }
  };
  
  if (!selectedModel) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Please select a model to start chatting
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 1 }}>
        <Button 
          variant="contained" 
          fullWidth 
          startIcon={<AddIcon />}
          onClick={handleNewChat}
          size="small"
          sx={{ 
            borderRadius: 1.5,
            textTransform: 'none',
            py: 0.75,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 3
            }
          }}
        >
          New Chat
        </Button>
      </Box>
      
      <Divider sx={{ mx: 1 }} />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 0.5 }}>
        {modelChats.length === 0 ? (
          <Box sx={{ p: 1.5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              No chats yet. Start a new chat!
            </Typography>
          </Box>
        ) : (
          <List
            dense
            sx={{ pt: 0, pb: 1 }}
            subheader={
              <ListSubheader component="div" id="chats-list-subheader" sx={{ lineHeight: '28px', fontSize: '0.75rem', fontWeight: 500, pl: 1 }}>
                {`Chats for ${selectedModel}`}
              </ListSubheader>
            }
          >
            {modelChats.map(chat => (
              <ChatListItem 
                key={chat.id} 
                chat={chat} 
                isActive={chat.id === activeChatId} 
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ChatList;
