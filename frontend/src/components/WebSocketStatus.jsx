import React, { useState, useEffect } from 'react';
import { Chip, Box } from '@mui/material';
import websocketService from '../services/websocket';

function WebSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);

    // Check initial state
    setIsConnected(websocketService.isConnected());

    return () => {
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
    };
  }, []);

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
      <Chip
        label={isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
        color={isConnected ? 'success' : 'default'}
        size="small"
      />
    </Box>
  );
}

export default WebSocketStatus;

