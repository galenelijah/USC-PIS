import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import eventBus from '../utils/eventBus';

/**
 * Global notification component that listens for 'app_notification' events.
 * Provides a non-intrusive way to show errors/success messages from anywhere.
 */
const AppNotification = () => {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState({
    message: '',
    severity: 'info', // 'error', 'warning', 'info', 'success'
  });

  useEffect(() => {
    const handleNotification = (data) => {
      setNotification({
        message: data.message || 'An update occurred',
        severity: data.severity || 'info',
      });
      setOpen(true);
    };

    eventBus.on('app_notification', handleNotification);

    return () => {
      eventBus.remove('app_notification', handleNotification);
    };
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={notification.severity} 
        variant="filled"
        sx={{ width: '100%', boxShadow: 3 }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default AppNotification;
