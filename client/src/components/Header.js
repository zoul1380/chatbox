import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppBar, Toolbar, Typography, Chip, Select, MenuItem, FormControl, InputLabel, Box, IconButton, Menu, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Tooltip } from '@mui/material';
import { checkOllamaServerHealth, fetchOllamaModels, setSelectedModel, incrementConnectionRetries, resetConnectionRetries } from '../features/ollama/ollamaSlice';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ImageIcon from '@mui/icons-material/Image';
import { isMultimodalModel } from '../utils/modelUtils';

const MAX_CONNECTION_RETRIES = 5;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const MODEL_REFRESH_INTERVAL = 60000; // 60 seconds

const Header = () => {
  const dispatch = useDispatch();  
  const { ollamaStatus, connectionRetries, error, models, selectedModel } = useSelector((state) => state.ollama);

  const [anchorEl, setAnchorEl] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Initial and periodic health check
  useEffect(() => {
    const performHealthCheck = () => {
      if (ollamaStatus !== 'connected' && connectionRetries < MAX_CONNECTION_RETRIES) {
        dispatch(checkOllamaServerHealth()).then(result => {
          if (checkOllamaServerHealth.rejected.match(result)) {
            dispatch(incrementConnectionRetries());
            const delay = Math.pow(2, connectionRetries) * 1000; // Exponential backoff
            setTimeout(performHealthCheck, Math.min(delay, 30000)); // Max 30s delay
          }
        });
      } else if (ollamaStatus === 'connected') {
        dispatch(resetConnectionRetries());
      }
    };

    performHealthCheck(); // Initial check
    const healthInterval = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);
    return () => clearInterval(healthInterval);
  }, [dispatch, ollamaStatus, connectionRetries]);

  // Initial and periodic model fetching
  useEffect(() => {
    if (ollamaStatus === 'connected') {
      dispatch(fetchOllamaModels());
      const modelInterval = setInterval(() => dispatch(fetchOllamaModels()), MODEL_REFRESH_INTERVAL);
      return () => clearInterval(modelInterval);
    }
  }, [dispatch, ollamaStatus]);
  const handleModelChange = (event) => {
    dispatch(setSelectedModel(event.target.value));
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleClearClick = () => {
    setClearDialogOpen(true);
    handleMenuClose();
  };
  
  const handleClearCancel = () => {
    setClearDialogOpen(false);
  };
  
  const handleClearConfirm = () => {
    setClearDialogOpen(false);
    // Actual clearing is handled in App.js through the Dialog in App.js
  };
  
  const handleExportClick = () => {
    // Close menu - actual export is handled in App.js
    handleMenuClose();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    handleMenuClose();
  };

  const handleFileChange = () => {
    // Just reset the file input - actual import is handled in App.js
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  let statusChip;
  switch (ollamaStatus) {
    case 'connected':
      statusChip = <Chip label="Ollama: Connected" color="success" size="small" />;
      break;
    case 'disconnected':
      statusChip = <Chip label={`Ollama: Disconnected (retrying ${connectionRetries}/${MAX_CONNECTION_RETRIES})`} color="error" size="small" />;
      break;
    case 'checking':
      statusChip = <Chip label="Ollama: Checking..." color="warning" size="small" />;
      break;
    default:
      statusChip = <Chip label="Ollama: Unknown" color="default" size="small" />;
  }

  return (
    <AppBar position="fixed">
      <Toolbar variant="dense">
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          ChatBox
        </Typography>
        {statusChip}
        {ollamaStatus === 'connected' && (
          <FormControl size="small" sx={{ m: 1, minWidth: 120, backgroundColor: 'white', borderRadius: 1 }}>
            <InputLabel id="model-select-label">Model</InputLabel>            <Select
              labelId="model-select-label"
              id="model-select"
              value={selectedModel || ''}
              label="Model"
              onChange={handleModelChange}
              disabled={!models || models.length === 0}              renderValue={(selected) => {
                const supportsImages = isMultimodalModel(selected);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {selected} 
                    {supportsImages && (
                      <Tooltip title="Supports image input" arrow>
                        <ImageIcon fontSize="small" sx={{ ml: 0.5, color: 'primary.main' }} />
                      </Tooltip>
                    )}
                  </Box>
                );
              }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>              {models && models.map((model) => {
                // Check if model supports images using our utility function
                const supportsImages = isMultimodalModel(model.name);
                return (
                  <MenuItem key={model.name} value={model.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span>{model.name}</span>
                      {supportsImages && (
                        <Tooltip title="Supports image input" arrow>
                          <ImageIcon fontSize="small" sx={{ ml: 0.5, color: 'primary.main' }} />
                        </Tooltip>
                      )}
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        ({(new Date(model.modified_at)).toLocaleDateString()})
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        )}
        <Box sx={{ flexGrow: 0 }}>
          <IconButton
            size="large"
            aria-label="menu options"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >            {/* These menu items trigger UI actions, but the actual functionality
                is implemented in App.js. The Dialog in this component is redundant
                with the one in App.js and should be removed in a future refactoring. */}
            <MenuItem onClick={handleClearClick}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Clear Chat
            </MenuItem>
            <MenuItem onClick={handleExportClick}>
              <FileDownloadIcon fontSize="small" sx={{ mr: 1 }} />
              Export Chat
            </MenuItem>
            <MenuItem onClick={handleImportClick}>
              <FileUploadIcon fontSize="small" sx={{ mr: 1 }} />
              Import Chat
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      { (ollamaStatus === 'disconnected' || ollamaStatus === 'error') && error && 
        <Box sx={{ bgcolor: 'error.main', color: 'error.contrastText', p: 0.5, textAlign: 'center'}}>
            <Typography variant="caption">
                Failed to connect: {typeof error === 'string' ? error : error.message || 'Unknown error'}
            </Typography>
        </Box>
      }      {/* This Dialog is currently not used as App.js handles the actual clearing and confirmation */}
      <Dialog
        open={clearDialogOpen}
        onClose={handleClearCancel}
      >
        <DialogTitle>Clear Chat History</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear all messages for the current model? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearCancel}>Cancel</Button>
          <Button onClick={handleClearConfirm} color="error" autoFocus>
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Header;
