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
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalHospital as HospitalIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
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
                to="/medical-records"
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
            <Grid item xs={12} md={4}>
              <QuickAction
                title="Patient Records"
                description="View and manage patient records"
                icon={<PeopleIcon />}
                to="/patients"
                color="primary"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <QuickAction
                title="Medical Records"
                description="Access detailed medical records"
                icon={<HospitalIcon />}
                to="/medical-records"
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <QuickAction
                title="Student Records"
                description="View student health information"
                icon={<SchoolIcon />}
                to="/students"
                color="success"
              />
            </Grid>
          </>
        );
      default:
        return null;
    }
  };

  // Helper: Admin/Staff dashboard
  const renderAdminDashboard = () => (
    <>
      {/* Stats Section */}
      <Grid item xs={12} md={3}>
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<PeopleIcon />}
          color="#1976d2"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <StatCard
          title="Total Records"
          value={stats.totalRecords}
          icon={<AssessmentIcon />}
          color="#2e7d32"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <StatCard
          title="Appointments Today"
          value={stats.appointmentsToday || 0}
          icon={<AssignmentIcon />}
          color="#ed6c02"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests || 0}
          icon={<AssignmentIcon />}
          color="#ab47bc"
        />
      </Grid>
      {/* Quick Actions */}
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Admin Quick Actions
        </Typography>
        <Divider sx={{ mb: 3 }} />
      </Grid>
      <Grid item xs={12} md={3}>
        <QuickAction
          title="Add Patient"
          description="Register a new patient"
          icon={<PeopleIcon />}
          to="/patients/add"
          color="primary"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <QuickAction
          title="Add Health Info"
          description="Publish new health information"
          icon={<AssessmentIcon />}
          to="/health-info"
          color="success"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <QuickAction
          title="Review Submissions"
          description="Review recent health form submissions"
          icon={<AssignmentIcon />}
          to="/forms/review"
          color="secondary"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <QuickAction
          title="User Management"
          description="Manage users and roles"
          icon={<PeopleIcon />}
          to="/admin/users"
          color="warning"
        />
      </Grid>
    </>
  );

  // Helper: Student/Patient dashboard
  const renderStudentDashboard = () => (
    <>
      {/* Next Appointment */}
      <Grid item xs={12} md={4}>
        <StatCard
          title="Next Appointment"
          value={stats.nextAppointment || 'None'}
          icon={<AssignmentIcon />}
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
          value={stats.profileCompletion ? `${stats.profileCompletion}%` : '100%'}
          icon={<PeopleIcon />}
          color="#ed6c02"
        />
      </Grid>
      {/* Quick Actions */}
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Quick Actions
        </Typography>
        <Divider sx={{ mb: 3 }} />
      </Grid>
      <Grid item xs={12} md={3}>
        <QuickAction
          title="View Medical Records"
          description="Access your medical records"
          icon={<MedicalIcon />}
          to="/medical-records"
          color="primary"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <QuickAction
          title="Book Appointment"
          description="Schedule a new appointment"
          icon={<AssignmentIcon />}
          to="/appointments"
          color="secondary"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <QuickAction
          title="Health Info"
          description="Read health announcements"
          icon={<AssessmentIcon />}
          to="/health-info"
          color="success"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <QuickAction
          title="Submit Health Form"
          description="Submit a new health form"
          icon={<AssignmentIcon />}
          to="/forms"
          color="info"
        />
      </Grid>
    </>
  );

  // Main render
  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: user?.role === 'ADMIN' || user?.role === 'STAFF'
                ? 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)'
                : 'linear-gradient(45deg, #388e3c 30%, #81c784 90%)',
              color: 'white'
            }}
          >
            <Box>
              <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
                Welcome, {user?.email?.split('@')[0]}
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Role: {user?.role || 'User'}
              </Typography>
            </Box>
            <Box>
              <Button
                component={Link}
                to="/profile"
                variant="outlined"
                sx={{ 
                  mr: 2, 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Profile
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => dispatch(logoutUser())}
              >
                Logout
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Role-based Dashboard Sections */}
        {loading ? (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : error ? (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        ) : (
          <>
            {user?.role === 'ADMIN' || user?.role === 'STAFF'
              ? renderAdminDashboard()
              : renderStudentDashboard()}
          </>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard; 