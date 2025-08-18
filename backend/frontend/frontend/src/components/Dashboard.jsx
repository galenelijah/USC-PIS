import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
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
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  PersonAdd as PersonAddIcon,
  EventNote as EventNoteIcon,
  Storage as StorageIcon,
  Campaign as CampaignIcon,
  Announcement as AnnouncementIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { authService, campaignService } from '../services/api';
import { useDispatch } from 'react-redux';
import { logout } from '../features/authentication/authSlice';
import LoadingState from './utils/LoadingState';
import ErrorState from './utils/ErrorState';
import PageHeader from './utils/PageHeader';

const Dashboard = memo(({ user }) => {
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
    featuredCampaigns: [],
    announcements: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define role check constants based on the user prop
  const isAdminOrStaffOrDoctor = user && ['ADMIN', 'STAFF', 'DOCTOR'].includes(user.role);
  const isDoctor = user && user.role === 'DOCTOR';
  const isNurse = user && user.role === 'NURSE';
  const isStudent = user && user.role === 'STUDENT';

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data for user role:', user?.role);
      const [dashboardResponse, campaignsResponse] = await Promise.all([
        authService.getDashboardStats(),
        campaignService.getFeaturedCampaigns().catch(() => ({ data: [] }))
      ]);
      
      if (!dashboardResponse || !dashboardResponse.data) {
        throw new Error('Invalid response from server');
      }

      console.log('Dashboard data received:', dashboardResponse.data);
      console.log('Campaigns data received:', campaignsResponse.data);
      
      // Safely handle the response data with fallbacks for all properties
      setStats({
        totalPatients: dashboardResponse.data.total_patients || 0,
        totalRecords: dashboardResponse.data.total_records || 0,
        recentPatients: Array.isArray(dashboardResponse.data.recent_patients) ? dashboardResponse.data.recent_patients : [],
        visitsByMonth: Array.isArray(dashboardResponse.data.visits_by_month) ? dashboardResponse.data.visits_by_month : [],
        appointmentsToday: dashboardResponse.data.appointments_today || 0,
        pendingRequests: dashboardResponse.data.pending_requests || 0,
        nextAppointment: dashboardResponse.data.next_appointment || null,
        recentHealthInfo: dashboardResponse.data.recent_health_info || null,
        profileCompletion: dashboardResponse.data.profile_completion || 0,
        featuredCampaigns: Array.isArray(campaignsResponse.data) ? campaignsResponse.data.slice(0, 3) : [],
        announcements: Array.isArray(dashboardResponse.data.announcements) ? dashboardResponse.data.announcements : [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        console.error('Authentication error - logging out');
        dispatch(logout());
      } else {
        setError(error.message || 'Failed to load dashboard data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.role, dispatch]);

  useEffect(() => {
    if (user && user.role) {
      fetchDashboardData();
    } else {
      console.error('No user or user role found');
      setError('User information is missing. Please log out and log in again.');
      setLoading(false);
    }
  }, [user, dispatch]);

  useEffect(() => {
    // Mark that the user has visited the dashboard
    localStorage.setItem('hasVisitedDashboard', 'true');
  }, []);

  const StatCard = memo(({ title, value, icon, color, subtitle = null }) => (
    <Card 
      sx={{ 
        height: '100%', 
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="white" variant="h6" fontWeight="medium" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" color="white" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  ));

  const QuickAction = memo(({ title, description, icon, to, color = "primary" }) => (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        borderRadius: 3,
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Avatar sx={{ bgcolor: `${color}.main`, mb: 2, width: 64, height: 64 }}>
        {icon}
      </Avatar>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
        {description}
      </Typography>
      <Button
        component={Link}
        to={to}
        variant="contained"
        color={color}
        endIcon={<ArrowForwardIcon />}
        sx={{ borderRadius: 2, px: 3 }}
      >
        Access
      </Button>
    </Paper>
  ));

  const renderRoleBasedActions = () => {
    switch (user?.role) {
      case 'STUDENT':
        return (
          <>
            <Grid item xs={12} md={4}>
              <QuickAction
                title="Medical Records"
                description="View and manage your medical records and consultation history"
                icon={<MedicalIcon />}
                to="/health-records"
                color="primary"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <QuickAction
                title="Health Information"
                description="Access important health information and resources"
                icon={<AssessmentIcon />}
                to="/health-info"
                color="success"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <QuickAction
                title="Health Campaigns"
                description="View active health campaigns and wellness programs"
                icon={<HealingIcon />}
                to="/campaigns"
                color="secondary"
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
                description="Access and update medical records"
                icon={<HospitalIcon />}
                to="/health-records"
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Health Information"
                description="Manage health information resources"
                icon={<AssessmentIcon />}
                to="/health-info"
                color="success"
              />
            </Grid>
          </>
        );
      case 'ADMIN':
      case 'STAFF':
        return (
          <>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Patient Management"
                description="Add, view, and manage patient records"
                icon={<PeopleIcon />}
                to="/patients"
                color="primary"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Health Records"
                description="Access and update medical records"
                icon={<HospitalIcon />}
                to="/health-records"
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Feedback Analytics"
                description="View and analyze patient feedback"
                icon={<AssessmentIcon />}
                to="/admin-feedback"
                color="info"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Database Monitor"
                description="Monitor database health and performance"
                icon={<StorageIcon />}
                to="/database-monitor"
                color="warning"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Email Administration"
                description="Manage email automation and notifications"
                icon={<EmailIcon />}
                to="/email-administration"
                color="primary"
              />
            </Grid>
          </>
        );
      default:
        return null;
    }
  };

  const renderAdminDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<PeopleIcon />}
          color="#4caf50"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Medical Records"
          value={stats.totalRecords}
          icon={<HospitalIcon />}
          color="#2196f3"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Today's Appointments"
          value={stats.appointmentsToday}
          icon={<CalendarIcon />}
          color="#ff9800"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={<NotificationsIcon />}
          color="#f44336"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          Quick Actions
        </Typography>
      </Grid>

      {renderRoleBasedActions()}

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Recent Patients
            </Typography>
            <Button
              component={Link}
              to="/patients"
              size="small"
              endIcon={<ArrowForwardIcon />}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {stats.recentPatients.length > 0 ? (
            <List>
              {stats.recentPatients.map((patient, index) => (
                <React.Fragment key={patient.id || index}>
                  <ListItem 
                    sx={{ 
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                    }}
                    secondaryAction={
                      <Tooltip title="View Patient">
                        <IconButton 
                          component={Link} 
                          to={`/patients/${patient.id}`}
                          edge="end" 
                          aria-label="view"
                          size="small"
                        >
                          <ArrowForwardIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {patient.first_name ? patient.first_name[0] : 'P'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="medium">
                          {patient.first_name} {patient.last_name}
                        </Typography>
                      }
                      secondary={
                        <>
                          {patient.email} • {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                        </>
                      }
                    />
                  </ListItem>
                  {index < stats.recentPatients.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={3}>
              <Typography color="text.secondary">No recent patients found</Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              System Status
            </Typography>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={fetchDashboardData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Database Status
            </Typography>
            <Chip
              label="Healthy"
              color="success"
              size="small"
              sx={{ fontWeight: 'medium' }}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              API Status
            </Typography>
            <Chip
              label="Operational"
              color="success"
              size="small"
              sx={{ fontWeight: 'medium' }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Last Updated
            </Typography>
            <Typography>
              {new Date().toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button 
              variant="outlined" 
              fullWidth 
              component={Link} 
              to="/database-monitor"
              endIcon={<ArrowForwardIcon />}
            >
              View Detailed Status
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderStudentDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <StatCard
          title="Medical Records"
          value={stats.totalRecords}
          icon={<HospitalIcon />}
          color="#4caf50"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          title="Consultations"
          value={stats.visitsByMonth.length}
          icon={<MedicationIcon />}
          color="#2196f3"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          title="Profile Completion"
          value={`${stats.profileCompletion || 0}%`}
          icon={<AssessmentIcon />}
          color="#ff9800"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          Quick Actions
        </Typography>
      </Grid>

      {renderRoleBasedActions()}

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Recent Health Information
            </Typography>
            <Button
              component={Link}
              to="/health-info"
              size="small"
              endIcon={<ArrowForwardIcon />}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {stats.recentHealthInfo ? (
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                {stats.recentHealthInfo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {stats.recentHealthInfo.content?.substring(0, 200)}
                {stats.recentHealthInfo.content?.length > 200 ? '...' : ''}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip
                  size="small"
                  label={stats.recentHealthInfo.category}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Box>
          ) : (
            <Box textAlign="center" py={3}>
              <Typography color="text.secondary">No health information available</Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Campaigns & Announcements
            </Typography>
            <Button
              component={Link}
              to="/health-info"
              size="small"
              endIcon={<ArrowForwardIcon />}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {/* Featured Campaigns */}
          {stats.featuredCampaigns.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
                Featured Campaigns
              </Typography>
              {stats.featuredCampaigns.map((campaign, index) => (
                <Box key={campaign.id || index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', mr: 1.5 }}>
                      <CampaignIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ lineHeight: 1.2 }}>
                        {campaign.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {campaign.category}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 5 }}>
                    {campaign.description?.substring(0, 80)}
                    {campaign.description?.length > 80 ? '...' : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Announcements */}
          {stats.announcements.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1, fontWeight: 'bold' }}>
                Announcements
              </Typography>
              {stats.announcements.slice(0, 2).map((announcement, index) => (
                <Box key={announcement.id || index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'warning.main', mr: 1.5 }}>
                      <AnnouncementIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ lineHeight: 1.2 }}>
                        {announcement.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 5 }}>
                    {announcement.content?.substring(0, 80)}
                    {announcement.content?.length > 80 ? '...' : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Empty State */}
          {stats.featuredCampaigns.length === 0 && stats.announcements.length === 0 && (
            <Box textAlign="center" py={3}>
              <Typography color="text.secondary" variant="body2">
                No campaigns or announcements available
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Next Appointment
            </Typography>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={fetchDashboardData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {stats.nextAppointment ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <CalendarIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {new Date(stats.nextAppointment.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.nextAppointment.time}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Reason:</strong> {stats.nextAppointment.reason}
              </Typography>
              <Typography variant="body2">
                <strong>Doctor:</strong> {stats.nextAppointment.doctor}
              </Typography>
            </Box>
          ) : (
            <Box textAlign="center" py={3}>
              <Typography color="text.secondary">No upcoming appointments</Typography>
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                startIcon={<CalendarIcon />}
              >
                Schedule Appointment
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  if (loading) {
    return <LoadingState message="Loading dashboard..." height={400} />;
  }

  if (error) {
    return (
      <ErrorState 
        message="Could not load dashboard" 
        details={error} 
        onRetry={fetchDashboardData} 
        height={400} 
      />
    );
  }

  const welcomeMessage = user?.first_name 
    ? `Welcome back, ${user.first_name}!` 
    : 'Welcome to USC Patient Information System';

  return (
    <>
      <PageHeader
        title={welcomeMessage}
        subtitle={`You are logged in as ${user?.role?.toLowerCase() || 'a user'}`}
      />
      
      {/* Show warning if profile setup is not complete */}
      {user && user.completeSetup === false && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your profile setup is not complete. Please complete your profile for full access.
        </Alert>
      )}
      
      {isAdminOrStaffOrDoctor ? renderAdminDashboard() : renderStudentDashboard()}
    </>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard; 