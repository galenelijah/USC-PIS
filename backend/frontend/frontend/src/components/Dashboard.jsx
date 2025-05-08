import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalHospital as HospitalIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  Healing as HealingIcon,
  Medication as MedicationIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useDispatch } from 'react-redux';
import { logoutUser, logout } from '../features/authentication/authSlice';

const Dashboard = ({ user }) => {
  const dispatch = useDispatch();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalRecords: 0,
    recentPatients: [],
    visitsByMonth: [],
    appointmentsToday: 0,
    pendingRequests: 0,
    nextAppointment: null,
    recentHealthInfo: null,
    profileCompletion: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define role check constants based on the user prop
  const isAdminOrStaff = user && ['ADMIN', 'STAFF'].includes(user.role);
  const isDoctor = user && user.role === 'DOCTOR';
  const isNurse = user && user.role === 'NURSE';
  const isStudent = user && user.role === 'STUDENT';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await authService.getDashboardStats();
        
        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }

        setStats({
          totalPatients: response.data.total_patients || 0,
          totalRecords: response.data.total_records || 0,
          recentPatients: Array.isArray(response.data.recent_patients) ? response.data.recent_patients : [],
          visitsByMonth: Array.isArray(response.data.visits_by_month) ? response.data.visits_by_month : [],
          appointmentsToday: response.data.appointments_today || 0,
          pendingRequests: response.data.pending_requests || 0,
          nextAppointment: response.data.next_appointment,
          recentHealthInfo: response.data.recent_health_info,
          profileCompletion: response.data.profile_completion,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (error.response?.status === 401) {
          dispatch(logout());
        } else {
          setError(error.message || 'Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dispatch]);

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', bgcolor: color }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="white" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" color="white">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const QuickAction = ({ title, description, icon, to, color = "primary" }) => (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <Avatar sx={{ bgcolor: `${color}.main`, mb: 2, width: 56, height: 56 }}>
        {icon}
      </Avatar>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <Button
        component={Link}
        to={to}
        variant="contained"
        color={color}
        fullWidth
      >
        Access
      </Button>
    </Paper>
  );

  const renderRoleBasedActions = () => {
    switch (user?.role) {
      case 'STUDENT':
        return (
          <>
            <Grid item xs={12} md={4}>
              <QuickAction
                title="Medical Records"
                description="View and manage your medical records"
                icon={<MedicalIcon />}
                to="/health-records"
                color="primary"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <QuickAction
                title="Appointments"
                description="Schedule and manage your appointments"
                icon={<AssignmentIcon />}
                to="/appointments"
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <QuickAction
                title="Health Forms"
                description="Access and submit health-related forms"
                icon={<AssessmentIcon />}
                to="/forms"
                color="success"
              />
            </Grid>
          </>
        );
      case 'DOCTOR':
      case 'NURSE':
        return (
          <>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Patient Records"
                description="View and manage patient records"
                icon={<PeopleIcon />}
                to="/patients"
                color="primary"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Health Records"
                description="Manage health records & vital signs"
                icon={<HospitalIcon />}
                to="/health-records"
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Student Records"
                description="View student health information"
                icon={<SchoolIcon />}
                to="/students"
                color="success"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Dental Records"
                description="Manage dental records & procedures"
                icon={<HealingIcon />}
                to="/dental-records"
                color="info"
              />
            </Grid>
          </>
        );
      case 'STAFF':
      case 'ADMIN':
        return (
          <>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="User Management"
                description="Manage users and permissions"
                icon={<PeopleIcon />}
                to="/users"
                color="primary"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Health Records"
                description="View and manage health records"
                icon={<HospitalIcon />}
                to="/health-records"
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Database Monitor"
                description="Monitor database health and performance"
                icon={<AssessmentIcon />}
                to="/database-monitor"
                color="warning"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Health Information"
                description="Manage health advisories and information"
                icon={<MedicalIcon />}
                to="/health-info"
                color="info"
              />
            </Grid>
          </>
        );
      default:
        return null;
    }
  };

  const renderAdminDashboard = () => (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Welcome Header with Profile and Logout Buttons */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.dark', color: 'white' }}>
        <Box>
          <Typography variant="h5">
            Welcome, {user?.email?.split('@')[0] || 'Admin'}!
          </Typography>
          <Typography variant="body1">
            Role: {user?.role?.toUpperCase() || 'ADMIN'}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            component={Link}
            to="/profile"
            sx={{ mr: 1, color: 'white', borderColor: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.1)'} }}
          >
            Profile
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => dispatch(logout())}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ color: '#004d40', fontWeight: 'bold' }}>
        Admin Dashboard
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* System Statistics */}
      <Typography variant="h5" gutterBottom sx={{ color: '#00695c', mb: 2 }}>
        System Statistics
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Patients" value={stats.totalPatients} icon={<PeopleIcon />} color="#1e88e5" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Health Records" value={stats.totalRecords} icon={<HospitalIcon />} color="#43a047" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Appointments Today" value={stats.appointmentsToday} icon={<CalendarIcon />} color="#fb8c00" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Requests" value={stats.pendingRequests} icon={<AssignmentIcon />} color="#e53935" />
        </Grid>
      </Grid>
      
      {/* Health Records Breakdown - Using totalRecords from main stats for simplicity */}
      {/* If more specific medical/dental breakdown is needed, the backend dashboard_stats would need to provide it */}
      <Typography variant="h5" gutterBottom sx={{ color: '#00695c', mb: 2 }}>
        Health Records Breakdown (Overall)
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4} md={4}>
          <StatCard title="Total Medical Records" value={stats.totalRecords} icon={<MedicalIcon />} color="#5e35b1" /> 
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
           {/* Assuming totalRecords includes dental for now, or set to 0 if distinct data not available */}
          <StatCard title="Dental Records" value={0} icon={<HealingIcon />} color="#00acc1" /> 
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <StatCard title="Total Records (M+D)" value={stats.totalRecords} icon={<AssessmentIcon />} color="#6d4c41" />
        </Grid>
      </Grid>

      {/* Admin Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ color: '#00695c', mb: 2 }}>
        Admin Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {renderRoleBasedActions()}
      </Grid>
    </Box>
  );

  const renderStudentDashboard = () => (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Welcome Header - Reusing the Admin style for consistency */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.dark', color: 'white' }}>
        <Box>
          <Typography variant="h5">
            Welcome, {user?.email?.split('@')[0] || 'Student'}!
          </Typography>
          <Typography variant="body1">
            Role: STUDENT
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            component={Link}
            to="/profile"
            sx={{ mr: 1, color: 'white', borderColor: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.1)'} }}
          >
            Profile
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => dispatch(logout())}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ color: '#004d40', fontWeight: 'bold', mb: 3 }}>
        Student Dashboard
      </Typography>

      {/* Top Stats Cards in a Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Next Appointment"
            value={stats.nextAppointment || 'None'}
            icon={<CalendarIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Recent Health Info"
            value={stats.recentHealthInfo || 'None'}
            icon={<AssessmentIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Profile Completion"
            value={user?.completeSetup ? '100%' : 'Incomplete'}
            icon={<PeopleIcon />}
            color={user?.completeSetup ? "#ed6c02" : "#e53935"}
          />
        </Grid>
      </Grid>

      {/* Quick Actions in a Grid */}
      <Typography variant="h5" gutterBottom sx={{ color: '#00695c', mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {renderRoleBasedActions()}
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3, height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  if (isAdminOrStaff) {
    return renderAdminDashboard();
  } else if (isDoctor || isNurse) {
    return <Typography sx={{p:3}}>Doctor/Nurse Dashboard (Placeholder)</Typography>;
  } else if (isStudent) {
    return renderStudentDashboard();
  } else {
    return <Typography sx={{p:3}}>Loading dashboard or role not recognized...</Typography>;
  }
};

export default Dashboard; 