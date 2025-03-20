import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  InputBase,
  IconButton,
  Box,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
} from '@mui/icons-material';

const Header = ({ onSearch }) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        ml: '240px',
        width: 'calc(100% - 240px)',
        backgroundColor: 'white',
        color: 'black',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Toolbar>
        <Box
          sx={{
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: 400,
          }}
        >
          <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
          <InputBase
            placeholder="Search patients..."
            onChange={(e) => onSearch(e.target.value)}
            sx={{ ml: 1, flex: 1 }}
          />
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color="inherit">
          <NotificationsIcon />
        </IconButton>
        <IconButton color="inherit">
          <AccountCircle />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 