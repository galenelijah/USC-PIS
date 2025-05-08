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
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
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
  const isDoctor = user && user.role === 'DOCTOR';
  const isNurse = user && user.role === 'NURSE';
  
  const handleLogout = () => {
    localStorage.removeItem('Token');
    navigate('/');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/home' },
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
    { text: 'Medical Records', icon: <LocalHospitalIcon />, path: '/health-records' },
    { text: 'Consultations', icon: <LocalHospitalIcon />, path: '/consultations' },
    { text: 'Health Information', icon: <HealthInfoIcon />, path: '/health-info' },
    { text: 'Feedback', icon: <FeedbackIcon />, path: '/feedback', isFeedback: true },
    { text: 'File Uploads', icon: <UploadIcon />, path: '/uploads' },
    { text: 'File Downloads', icon: <DownloadIcon />, path: '/downloads' },
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
        {menuItems.map((item) => {
          if (item.path === '/patients' && !(isAdminOrStaff || isDoctor || isNurse)) {
             return null;
          }
          if (item.path === '/database-monitor' && !isAdminOrStaff) {
            return null;
          }
          
          return (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                if (item.isFeedback) {
                  navigate(isAdminOrStaff ? '/admin-feedback' : '/feedback');
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
          );
        })}
        {isAdminOrStaff && (
             <ListItem
                 button
                 key="Database Monitor"
                 onClick={() => navigate('/database-monitor')}
                 sx={{
                   '&:hover': {
                     backgroundColor: 'rgba(255, 255, 255, 0.1)',
                   },
                 }}
             >
                 <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                     <StorageIcon />
                 </ListItemIcon>
                 <ListItemText primary="Database Monitor" />
             </ListItem>
        )}
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