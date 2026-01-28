import React, { useState } from 'react';
import { Box, CssBaseline, Container, Paper } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <CssBaseline />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - 240px)` },
          ml: { md: '240px' },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header handleDrawerToggle={handleDrawerToggle} />
        <Container 
          maxWidth="xl" 
          sx={{ 
            mt: { xs: 8, sm: 10 }, 
            mb: { xs: 2, sm: 4 }, 
            pt: { xs: 1, sm: 2 },
            px: { xs: 1, sm: 3 },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: { xs: 1, sm: 2 },
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