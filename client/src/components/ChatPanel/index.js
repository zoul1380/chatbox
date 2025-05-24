import React, { useState } from 'react';
import { 
  Box, 
  Drawer, 
  IconButton, 
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ChatList from './ChatList';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

// Drawer width for the chat panel
const drawerWidth = 200;

const ChatPanel = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // For mobile: control whether the drawer is open
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const drawer = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      pt: '64px', // To account for header height
      bgcolor: 'rgba(0, 0, 0, 0.01)', // Subtle background color
    }}>
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      <ChatList />
    </Box>
  );
  
  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open chat panel"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ position: 'absolute', top: 10, left: 8, zIndex: 1100 }}
        >
          <MenuIcon />
        </IconButton>
      )}
      
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            height: '100%',
            zIndex: 1099, // Below app bar but above other content
            borderRight: '1px solid rgba(0, 0, 0, 0.09)',
            mr: -1.5,  // Increased negative margin
            bgcolor: 'rgba(0, 0, 0, 0.01)', // Subtle background color
            boxShadow: '1px 0 5px rgba(0, 0, 0, 0.03)', // Subtle shadow
            '& > .MuiBox-root': {
              px: 0.5 // Reduce internal padding
            }
          },
        }}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default ChatPanel;

// Export the drawer width for use in other components for layout calculations
export { drawerWidth };
