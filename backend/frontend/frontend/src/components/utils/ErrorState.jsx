import React from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

const ErrorState = ({ 
  message = 'Something went wrong', 
  details = null,
  onRetry = null,
  fullScreen = false,
  height = 200
}) => {
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
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
            maxWidth: 500,
            width: '90%',
          }}
        >
          <ErrorIcon color="error" sx={{ fontSize: 60 }} />
          <Typography variant="h5" color="error" align="center" gutterBottom>
            {message}
          </Typography>
          
          {details && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {details}
            </Alert>
          )}
          
          {onRetry && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={onRetry}
              sx={{ mt: 3 }}
            >
              Try Again
            </Button>
          )}
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
        p: 3,
      }}
    >
      <ErrorIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
      <Typography variant="h6" color="error" align="center" gutterBottom>
        {message}
      </Typography>
      
      {details && (
        <Typography variant="body2" color="text.secondary" align="center">
          {details}
        </Typography>
      )}
      
      {onRetry && (
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={onRetry}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
};

export default ErrorState; 