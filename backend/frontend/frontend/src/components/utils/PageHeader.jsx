import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link, Divider } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const PageHeader = ({
  title,
  subtitle = null,
  breadcrumbs = [],
  action = null,
  actionIcon = null,
  actionLabel = null,
  onAction = null,
  children,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (isLast) {
              return (
                <Typography key={index} color="text.primary" fontWeight={500}>
                  {crumb.label}
                </Typography>
              );
            }
            
            return (
              <Link
                key={index}
                component={RouterLink}
                to={crumb.path}
                underline="hover"
                color="inherit"
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {(action || (actionLabel && onAction)) && (
          <Box>
            {action || (
              <Button
                variant="contained"
                color="primary"
                startIcon={actionIcon}
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            )}
          </Box>
        )}
      </Box>
      
      {children && (
        <Box sx={{ mt: 3 }}>
          {children}
        </Box>
      )}
      
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
};

export default PageHeader; 