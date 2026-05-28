import React from 'react';
import { Alert, AlertTitle, List, ListItem, ListItemText, Collapse, Box } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

/**
 * A reusable hard validation banner for blocking form layouts.
 * Used to display exhaustive validation errors from react-hook-form.
 * 
 * @param {Object} errors - The errors object from react-hook-form
 * @param {boolean} show - Whether to show the banner
 */
const ValidationBanner = ({ errors, show }) => {
  if (!show || !errors || Object.keys(errors).length === 0) return null;

  // Recursively flatten errors to get all messages
  const getErrorMessages = (obj, prefix = '') => {
    let messages = [];
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object' && !obj[key].message) {
        messages = [...messages, ...getErrorMessages(obj[key], `${prefix}${key} `)];
      } else if (obj[key] && obj[key].message) {
        messages.push(obj[key].message);
      }
    }
    return messages;
  };

  const messages = getErrorMessages(errors);

  return (
    <Collapse in={show}>
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity="error" 
          variant="filled"
          icon={<ErrorOutline fontSize="inherit" />}
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 20px 0 rgba(211, 47, 47, 0.25)',
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <AlertTitle sx={{ fontWeight: 'bold' }}>Form Validation Failed</AlertTitle>
          <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
            Please resolve the following critical errors before submitting:
          </Typography>
          <List size="small" sx={{ py: 0 }}>
            {messages.map((msg, index) => (
              <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                <ListItemText 
                  primary={`• ${msg}`} 
                  primaryTypographyProps={{ 
                    variant: 'caption', 
                    sx: { fontWeight: 'medium', fontSize: '0.75rem' } 
                  }} 
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      </Box>
    </Collapse>
  );
};

// Import Typography since it's used in the component
import { Typography } from '@mui/material';

export default ValidationBanner;
