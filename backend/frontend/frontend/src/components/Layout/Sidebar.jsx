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
  Avatar,
  Tooltip,
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
  Person as PersonIcon,
  MedicalInformation as MedicalInformationIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, logoutUser } from '../../features/authentication/authSlice';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const userFromRedux = useSelector(state => state.auth && state.auth.user);
  
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    if (userFromRedux) {
      setUser(userFromRedux);
    } else {
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

  const isAdminOrStaff = user && ['ADMIN', 'STAFF'].includes(user.role);
  const isDoctor = user && user.role === 'DOCTOR';
  const isNurse = user && user.role === 'NURSE';
  
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
  };

  // Group menu items by category
  const dashboardItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/home' },
  ];

  const patientItems = [
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients', requiredRole: ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'] },
    { text: 'Medical Records', icon: <LocalHospitalIcon />, path: '/health-records' },
    { text: 'Consultations', icon: <LocalHospitalIcon />, path: '/consultations' },
    { text: 'Medical Certificates', icon: <MedicalInformationIcon />, path: '/medical-certificates', requiredRole: ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'] },
  ];

  const infoItems = [
    { text: 'Health Information', icon: <HealthInfoIcon />, path: '/health-info' },
    { text: 'Feedback', icon: <FeedbackIcon />, path: '/feedback', isFeedback: true },
  ];

  const fileItems = [
    { text: 'File Uploads', icon: <UploadIcon />, path: '/uploads' },
    { text: 'File Downloads', icon: <DownloadIcon />, path: '/downloads' },
  ];

  const adminItems = [
    { text: 'Database Monitor', icon: <StorageIcon />, path: '/database-monitor', requiredRole: ['ADMIN', 'STAFF'] },
  ];

  const userItems = [
    { text: 'My Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Logout', icon: <ExitToAppIcon />, action: handleLogout },
  ];

  // Check if a menu item should be visible based on user role
  const isVisible = (item) => {
    if (!item.requiredRole) return true;
    if (!user || !user.role) return false;
    return item.requiredRole.includes(user.role);
  };

  // Check if a route is active
  const isActive = (path) => {
    if (path === '/home' && location.pathname === '/home') return true;
    if (path !== '/home' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Render a menu section
  const renderMenuSection = (items, sectionTitle = null) => {
    const filteredItems = items.filter(isVisible);
    if (filteredItems.length === 0) return null;
    
    return (
      <>
        {sectionTitle && (
          <Typography variant="caption" sx={{ px: 3, py: 1, color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
            {sectionTitle}
          </Typography>
        )}
        <List>
          {filteredItems.map((item) => (
            <Tooltip title={item.text} placement="right" key={item.text}>
              <ListItem
                button
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.isFeedback) {
                    navigate(isAdminOrStaff ? '/admin-feedback' : '/feedback');
                  } else {
                    navigate(item.path);
                  }
                }}
                sx={{
                  backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  borderLeft: isActive(item.path) ? '4px solid #fff' : '4px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  mb: 0.5,
                  pl: 2,
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1a5e20', // Slightly darker green for better contrast
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
          USC Patient Info System
        </Typography>
      </Box>
      
      {user && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 64, height: 64, mb: 1, bgcolor: '#4caf50' }}>
            {user.first_name ? user.first_name[0] : user.email ? user.email[0].toUpperCase() : 'U'}
          </Avatar>
          <Typography variant="subtitle2" sx={{ color: 'white' }}>
            {user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}`
              : user.email}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {user.role}
          </Typography>
        </Box>
      )}
      
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)', mb: 1 }} />
      
      {renderMenuSection(dashboardItems, "MAIN")}
      {renderMenuSection(patientItems, "PATIENTS")}
      {renderMenuSection(infoItems, "INFORMATION")}
      {renderMenuSection(fileItems, "FILES")}
      {isAdminOrStaff && renderMenuSection(adminItems, "ADMINISTRATION")}
      
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
      {renderMenuSection(userItems)}
    </Drawer>
  );
};

export default Sidebar; 