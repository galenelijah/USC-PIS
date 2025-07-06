import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  InputBase,
  IconButton,
  Box,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Avatar,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Help as HelpIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, logoutUser } from '../../features/authentication/authSlice';
import { notificationService } from '../../services/api';

const Header = ({ onSearch }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth?.user);
  
  const [searchValue, setSearchValue] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const open = Boolean(anchorEl);
  
  // Load unread notification count
  useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Refresh count every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadNotifications();
      setUnreadCount(response.data?.length || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // First dispatch the async thunk to call the logout API
      await dispatch(logoutUser()).unwrap();
      // Then dispatch the sync action to clear the Redux state
      dispatch(logout());
      // Finally navigate to login page
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the API call fails, we should still clear the local state
      dispatch(logout());
      navigate('/');
    }
    handleMenuClose();
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchValue('');
    onSearch('');
  };

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
            borderRadius: 2,
            p: '2px 16px',
            display: 'flex',
            alignItems: 'center',
            width: 400,
            boxShadow: 'inset 0px 0px 5px rgba(0,0,0,0.05)',
          }}
        >
          <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
          <InputBase
            placeholder="Search patients..."
            value={searchValue}
            onChange={handleSearchChange}
            sx={{ ml: 1, flex: 1 }}
            fullWidth
          />
          {searchValue && (
            <IconButton size="small" onClick={clearSearch}>
              <ClearIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Help">
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit" 
              sx={{ mr: 2 }}
              onClick={() => navigate('/notifications')}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user && (
              <>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', mr: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.role}
                  </Typography>
                </Box>
                
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    size="small"
                    sx={{ ml: 1 }}
                    aria-controls={open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                  >
                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#4caf50' }}>
                      {user.first_name ? user.first_name[0] : user.email ? user.email[0].toUpperCase() : 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </Toolbar>
      
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            width: 220,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {user?.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          My Profile
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header; 