import React from 'react';
import { Box, CssBaseline, Container, Paper } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, onSearch }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <CssBaseline />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header onSearch={onSearch || (() => {})} />
        <Container 
          maxWidth="xl" 
          sx={{ 
            mt: 10, 
            mb: 4, 
            pt: 2,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 2,
              backgroundColor: 'white',
              flexGrow: 1,
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
            }}
          >
            {children}
          </Paper>
          <Box 
            component="footer" 
            sx={{ 
              mt: 3, 
              py: 2, 
              textAlign: 'center', 
              fontSize: '0.875rem',
              color: 'text.secondary',
            }}
          >
            © {new Date().getFullYear()} USC Patient Information System
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 