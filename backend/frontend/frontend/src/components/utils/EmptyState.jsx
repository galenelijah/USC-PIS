import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { InboxOutlined as InboxIcon } from '@mui/icons-material';

const EmptyState = ({
  title = 'No Data Found',
  description = 'There are no items to display at the moment.',
  icon = <InboxIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.7 }} />,
  actionLabel = null,
  onAction = null,
  height = 300,
  paperProps = {},
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
        width: '100%',
        p: 3,
        backgroundColor: 'background.default',
        border: '1px dashed',
        borderColor: 'grey.300',
        borderRadius: 2,
        ...paperProps,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 450,
          textAlign: 'center',
        }}
      >
        {icon}
        
        <Typography variant="h6" color="text.primary" sx={{ mt: 2, fontWeight: 600 }}>
          {title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          {description}
        </Typography>
        
        {actionLabel && onAction && (
          <Button
            variant="contained"
            color="primary"
            onClick={onAction}
            sx={{ mt: 2 }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default EmptyState; 