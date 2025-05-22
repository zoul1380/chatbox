import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  IconButton, 
  Tooltip,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { setActiveChat, updateChatTitle, deleteChat } from '../../features/chats/chatsSlice';

const ChatListItem = ({ chat, isActive }) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Format the date as just the time if today, otherwise show date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };
  
  const handleClick = () => {
    dispatch(setActiveChat(chat.id));
  };
  
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };
  
  const handleEditClick = (event) => {
    handleMenuClose(event);
    setNewTitle(chat.title);
    setEditDialogOpen(true);
  };
  
  const handleEditClose = () => {
    setEditDialogOpen(false);
  };
  
  const handleTitleSave = () => {
    if (newTitle.trim()) {
      dispatch(updateChatTitle({ chatId: chat.id, title: newTitle.trim() }));
    }
    setEditDialogOpen(false);
  };
  
  const handleDeleteClick = (event) => {
    handleMenuClose(event);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleDeleteConfirm = () => {
    dispatch(deleteChat(chat.id));
    setDeleteDialogOpen(false);
  };
  
  return (
    <>
      <ListItem 
        disablePadding 
        secondaryAction={
          <IconButton 
            edge="end" 
            onClick={handleMenuOpen}
            size="small"
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        }
      >
        <ListItemButton 
          selected={isActive} 
          onClick={handleClick}
          sx={{ 
            borderRadius: 1,
            "&.Mui-selected": {
              backgroundColor: "primary.light",
              "&:hover": {
                backgroundColor: "primary.light",
              }
            }
          }}
        >
          <ListItemText 
            primary={chat.title} 
            secondary={formatDate(chat.updated)}
            primaryTypographyProps={{
              noWrap: true,
              style: { fontWeight: isActive ? "bold" : "normal" }
            }}
            secondaryTypographyProps={{
              noWrap: true,
              style: { fontSize: "0.75rem" }
            }}
          />
        </ListItemButton>
      </ListItem>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEditClick}>Rename</MenuItem>
        <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
      </Menu>
      
      <Dialog open={editDialogOpen} onClose={handleEditClose}>
        <DialogTitle>Rename Chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chat Title"
            type="text"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleTitleSave}>Save</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>Delete Chat</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this chat? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatListItem;
