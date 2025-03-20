import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, onSearch }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          ml: '240px',
          mt: '64px',
        }}
      >
        <Header onSearch={onSearch} />
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 