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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalHospital as LocalHospitalIcon,
  ExitToApp as ExitToAppIcon,
  Storage as StorageIcon,
  HealthAndSafety as HealthInfoIcon,
  Feedback as FeedbackIcon,
  Person as PersonIcon,
  MedicalInformation as MedicalInformationIcon,
  Notifications as NotificationsIcon,
  Campaign as CampaignIcon,
  Assessment as ReportsIcon,
  Email as EmailIcon,
  AdminPanelSettings as UserManagementIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, logoutUser } from '../../features/authentication/authSlice';

// Custom Dental Icon Component
const DentalIcon = () => (
  <LocalHospitalIcon />
);

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const userFromRedux = useSelector(state => state.auth && state.auth.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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

  const isAdminOrStaffOrDoctor = user && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST'].includes(user.role);
  const isDoctor = user && (user.role === 'DOCTOR' || user.role === 'DENTIST');
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
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients', requiredRole: ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'] },
    { text: 'Patient Medical Dashboard', icon: <MedicalInformationIcon />, path: '/patient-dashboard' },
    { text: 'Health Insights & History', icon: <LocalHospitalIcon />, path: '/health-insights', description: 'Patient history timeline with health insights' },
    {
      text: user && user.role === 'STUDENT' ? 'My Health Records' : 'Medical Records (Manage)',
      icon: <LocalHospitalIcon />,
      path: '/health-records',
      description: user && user.role === 'STUDENT'
        ? 'View your medical records and visit details'
        : 'Create and manage medical (clinic) records'
    },
    { text: 'Dental Records', icon: <DentalIcon />, path: '/dental-records', description: 'Manage dental procedures and records' },
    { text: 'Medical Certificates', icon: <MedicalInformationIcon />, path: '/medical-certificates', requiredRole: ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE', 'STUDENT'] },
  ];

  const infoItems = [
    { text: 'Health Information', icon: <HealthInfoIcon />, path: '/health-info' },
    { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    { text: 'Feedback', icon: <FeedbackIcon />, path: '/feedback', isFeedback: true },
  ];

  const reportItems = [
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports', requiredRole: ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'] },
  ];

  const fileItems = [
    // File upload/download functionality removed from navigation
  ];

  const adminItems = [
    { text: 'Database Monitor', icon: <StorageIcon />, path: '/database-monitor', requiredRole: ['ADMIN', 'STAFF'] },
    { text: 'Email Administration', icon: <EmailIcon />, path: '/email-administration', requiredRole: ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST'] },
    { text: 'User Management', icon: <UserManagementIcon />, path: '/user-management', requiredRole: ['ADMIN'] },
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
          <Typography 
            variant="caption" 
            sx={{ 
              px: { xs: 2, sm: 3 }, 
              py: 1, 
              color: 'rgba(255, 255, 255, 0.7)', 
              display: 'block',
              fontSize: { xs: '0.65rem', sm: '0.75rem' }
            }}
          >
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
                    navigate(isAdminOrStaffOrDoctor ? '/admin-feedback' : '/feedback');
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
                  pl: { xs: 1.5, sm: 2 },
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: { xs: 32, sm: 40 } }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    fontWeight: isActive(item.path) ? 'bold' : 'normal'
                  }}
                />
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </>
    );
  };

  const drawer = (
    <div>
      <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          component="div" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold', 
            textAlign: 'center',
            fontSize: { xs: '0.9rem', sm: '1.25rem' }
          }}
        >
          USC Patient Info System
        </Typography>
      </Box>

      {user && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2, px: { xs: 1, sm: 0 } }}>
          <Avatar sx={{ width: { xs: 48, sm: 64 }, height: { xs: 48, sm: 64 }, mb: 1, bgcolor: '#4caf50' }}>
            {user.first_name ? user.first_name[0] : user.email ? user.email[0].toUpperCase() : 'U'}
          </Avatar>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'white',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              textAlign: 'center'
            }}
          >
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.email}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}
          >
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
      {/* File upload/download section removed */}
      {isAdminOrStaffOrDoctor && renderMenuSection(adminItems, "ADMINISTRATION")}

      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
      {renderMenuSection(userItems)}
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: '#1a5e20',
            color: 'white',
          },
        }}
      >
        {drawer}
      </Drawer>
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: '#1a5e20',
            color: 'white',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar; 
