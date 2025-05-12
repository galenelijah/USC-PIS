import React from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';

const LoadingState = ({ message = 'Loading...', fullScreen = false, height = 200 }) => {
  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            backgroundColor: 'white',
            minWidth: 250,
          }}
        >
          <CircularProgress size={50} color="primary" />
          <Typography variant="h6" color="text.secondary">
            {message}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
        width: '100%',
        gap: 2,
      }}
    >
      <CircularProgress color="primary" />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingState; 