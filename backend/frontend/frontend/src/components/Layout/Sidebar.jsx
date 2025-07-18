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
  Notifications as NotificationsIcon,
  Campaign as CampaignIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, logoutUser } from '../../features/authentication/authSlice';

// Custom Dental Icon Component
const DentalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-32 0 512 512" fill="currentColor">
    <path d="M443.98 96.25c-11.01-45.22-47.11-82.06-92.01-93.72c-32.19-8.36-63 5.1-89.14 24.33c-3.25 2.39-6.96 3.73-10.5 5.48l28.32 18.21c7.42 4.77 9.58 14.67 4.8 22.11c-4.46 6.95-14.27 9.86-22.11 4.8L162.83 12.84c-20.7-10.85-43.38-16.4-66.81-10.31c-44.9 11.67-81 48.5-92.01 93.72c-10.13 41.62-.42 80.81 21.5 110.43c23.36 31.57 32.68 68.66 36.29 107.35c4.4 47.16 10.33 94.16 20.94 140.32l7.8 33.95c3.19 13.87 15.49 23.7 29.67 23.7c13.97 0 26.15-9.55 29.54-23.16l34.47-138.42c4.56-18.32 20.96-31.16 39.76-31.16s35.2 12.85 39.76 31.16l34.47 138.42c3.39 13.61 15.57 23.16 29.54 23.16c14.18 0 26.48-9.83 29.67-23.7l7.8-33.95c10.61-46.15 16.53-93.16 20.94-140.32c3.61-38.7 12.93-75.78 36.29-107.35c21.95-29.61 31.66-68.8 21.53-110.43"/>
  </svg>
);

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
    { text: 'Patient Medical Dashboard', icon: <MedicalInformationIcon />, path: '/patient-dashboard' },
    { text: 'Medical History', icon: <LocalHospitalIcon />, path: '/medical-records', description: 'View patient medical timeline and history' },
    { text: 'Clinical Records', icon: <LocalHospitalIcon />, path: '/health-records', description: 'Comprehensive clinical record management', requiredRole: ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'] },
    { text: 'Dental Records', icon: <DentalIcon />, path: '/dental-records' },
    { text: 'Consultations', icon: <LocalHospitalIcon />, path: '/consultations' },
    { text: 'Medical Certificates', icon: <MedicalInformationIcon />, path: '/medical-certificates', requiredRole: ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE', 'STUDENT'] },
  ];

  const infoItems = [
    { text: 'Health Information', icon: <HealthInfoIcon />, path: '/health-info' },
    { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    { text: 'Feedback', icon: <FeedbackIcon />, path: '/feedback', isFeedback: true },
  ];

  const reportItems = [
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports', requiredRole: ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'] },
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
            <Tooltip 
              title={item.description || item.text} 
              placement="right" 
              key={item.text}
              arrow
            >
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
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 'bold' : 'normal'
                  }}
                />
              </ListItem>
            </Tooltip>
          ))
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
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', my: 1 }} />
      {renderMenuSection(reportItems, 'ANALYTICS')}
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', my: 1 }} />
      {renderMenuSection(fileItems, "FILES")}
      {isAdminOrStaff && renderMenuSection(adminItems, "ADMINISTRATION")}
      
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
      {renderMenuSection(userItems)}
    </Drawer>
  );
};

export default Sidebar; 