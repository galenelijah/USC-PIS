import React, { useEffect, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalHospital as LocalHospitalIcon,
  ExitToApp as ExitToAppIcon,
  Storage as StorageIcon,
  HealthAndSafety as HealthInfoIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const userFromRedux = useSelector(state => state.authentication && state.authentication.user);
  
  // NEW: Add state to track user data
  const [user, setUser] = useState(null);
  
  // Use effect to load user data from Redux or localStorage
  useEffect(() => {
    if (userFromRedux) {
      setUser(userFromRedux);
    } else {
      // Try to load from localStorage as fallback
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
      }
    }
  }, [userFromRedux]);

  // Check for admin/staff role once we have valid user data
  const isAdminOrStaff = user && ['ADMIN', 'STAFF'].includes(user.role);
  
  const handleLogout = () => {
    localStorage.removeItem('Token');
    navigate('/');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/home' },
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
    { text: 'Medical Records', icon: <LocalHospitalIcon />, path: '/records' },
    { text: 'Health Information', icon: <HealthInfoIcon />, path: '/health-info' },
    { text: 'Feedback', icon: <FeedbackIcon />, path: '/feedback', isFeedback: true },
    { text: 'Database Monitor', icon: <StorageIcon />, path: '/database-monitor' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#2e7d32',
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
          Patient Info System
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              if (item.isFeedback) {
                if (user && ['ADMIN', 'STAFF'].includes(user.role)) {
                  navigate('/admin-feedback');
                } else {
                  navigate('/feedback');
                }
              } else {
                navigate(item.path);
              }
            }}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              mb: 1,
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
      <List>
        {user && (
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar; 