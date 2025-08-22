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
  AdminPanelSettings as UserManagementIcon,
  Info as InfoIcon,
  Article as ArticleIcon,
  LocalLibrary as LibraryIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { authService, campaignService, healthInfoService } from '../services/api';
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
    latestCampaigns: [],
    recentHealthInfoPosts: [],
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
      const [dashboardResponse, campaignsResponse, latestCampaignsResponse, healthInfoResponse] = await Promise.all([
        authService.getDashboardStats(),
        campaignService.getFeaturedCampaigns().catch(() => ({ data: [] })),
        campaignService.getLatestCampaigns(5).catch(() => ({ data: [] })),
        healthInfoService.getRecent(5).catch(() => ({ data: [] }))
      ]);
      
      if (!dashboardResponse || !dashboardResponse.data) {
        throw new Error('Invalid response from server');
      }

      console.log('Dashboard data received:', dashboardResponse.data);
      console.log('Featured campaigns data received:', campaignsResponse.data);
      console.log('Latest campaigns data received:', latestCampaignsResponse.data);
      console.log('Health info data received:', healthInfoResponse.data);
      
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
        latestCampaigns: Array.isArray(latestCampaignsResponse.data) ? latestCampaignsResponse.data.slice(0, 5) : [],
        recentHealthInfoPosts: Array.isArray(healthInfoResponse.data) ? healthInfoResponse.data.slice(0, 5) : [],
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
            <Grid item xs={12} md={3}>
              <QuickAction
                title="Health Campaigns"
                description="Manage health campaigns and announcements"
                icon={<CampaignIcon />}
                to="/campaigns"
                color="info"
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
            <Grid item xs={12} md={3}>
              <QuickAction
                title="User Management"
                description="Manage user roles and permissions"
                icon={<UserManagementIcon />}
                to="/user-management"
                color="secondary"
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

      <Grid item xs={12} md={6}>
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
              {stats.recentPatients.slice(0, 4).map((patient, index) => (
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
                  {index < stats.recentPatients.slice(0, 4).length - 1 && <Divider variant="inset" component="li" />}
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

      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Latest Content
            </Typography>
            <Button
              component={Link}
              to="/campaigns"
              size="small"
              endIcon={<ArrowForwardIcon />}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {/* Latest Campaigns */}
          {stats.latestCampaigns.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <CampaignIcon sx={{ mr: 1, fontSize: 16 }} />
                Latest Campaigns
              </Typography>
              {stats.latestCampaigns.slice(0, 2).map((campaign, index) => (
                <Box key={campaign.id || index} sx={{ 
                  mb: 2, 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(25, 118, 210, 0.04)',
                  border: '1px solid rgba(25, 118, 210, 0.12)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    transform: 'translateY(-1px)',
                    boxShadow: 1
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: 'primary.main', 
                        mr: 1.5,
                        fontSize: '0.875rem'
                      }}
                    >
                      <CampaignIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        sx={{ 
                          lineHeight: 1.3,
                          mb: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {campaign.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={campaign.campaign_type?.replace('_', ' ') || 'General'}
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: 18,
                          bgcolor: 'primary.main',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'block',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {campaign.summary || campaign.description?.substring(0, 70)}
                    {(campaign.summary || campaign.description)?.length > 70 ? '...' : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Health Info Posts */}
          {stats.recentHealthInfoPosts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="success.main" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <ArticleIcon sx={{ mr: 1, fontSize: 16 }} />
                Health Info
              </Typography>
              {stats.recentHealthInfoPosts.slice(0, 2).map((post, index) => (
                <Box key={post.id || index} sx={{ 
                  mb: 2, 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(76, 175, 80, 0.04)',
                  border: '1px solid rgba(76, 175, 80, 0.12)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(76, 175, 80, 0.08)',
                    transform: 'translateY(-1px)',
                    boxShadow: 1
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: 'success.main', 
                        mr: 1.5,
                        fontSize: '0.875rem'
                      }}
                    >
                      <ArticleIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        sx={{ 
                          lineHeight: 1.3,
                          mb: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {post.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={post.category || 'Health Info'}
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: 18,
                          bgcolor: 'success.main',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'block',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {post.content?.substring(0, 70)}
                    {post.content?.length > 70 ? '...' : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Empty State */}
          {stats.latestCampaigns.length === 0 && stats.recentHealthInfoPosts.length === 0 && (
            <Box textAlign="center" py={3}>
              <Box sx={{ mb: 2 }}>
                <CampaignIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, mr: 1 }} />
                <ArticleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              </Box>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                No campaigns or health info available
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component={Link}
                to="/campaigns"
                sx={{ mt: 1 }}
              >
                Create Content
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
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
            <Typography variant="body2">
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
              size="small"
            >
              View Details
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

      <Grid item xs={12} md={8}>
        <Paper sx={{ 
          p: 4, 
          height: '100%', 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            zIndex: 1
          }
        }}>
          <Box position="relative" zIndex={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" fontWeight="bold" sx={{ 
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <CampaignIcon sx={{ mr: 2, fontSize: 40 }} />
                Latest Health Content
              </Typography>
              <Button
                component={Link}
                to="/campaigns"
                variant="contained"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  }
                }}
                endIcon={<ArrowForwardIcon />}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.3)' }} />
            
            {/* Latest Campaigns Section */}
            {stats.latestCampaigns.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.95)', fontWeight: 'bold' }}>
                  <CampaignIcon sx={{ mr: 2, fontSize: 32 }} />
                  Latest Health Campaigns
                </Typography>
                <Grid container spacing={3}>
                  {stats.latestCampaigns.slice(0, 4).map((campaign, index) => (
                    <Grid item xs={12} md={6} key={campaign.id || index}>
                      <Box sx={{ 
                        p: 3, 
                        borderRadius: 3, 
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.25)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar sx={{ 
                            width: 48, 
                            height: 48, 
                            bgcolor: 'rgba(255, 255, 255, 0.2)', 
                            mr: 2,
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                          }}>
                            <CampaignIcon sx={{ fontSize: 28, color: 'white' }} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ 
                              lineHeight: 1.3, 
                              mb: 1,
                              color: 'white',
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                            }}>
                              {campaign.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                size="small"
                                label={campaign.campaign_type?.replace('_', ' ') || 'General'}
                                sx={{ 
                                  fontSize: '0.75rem', 
                                  height: 22,
                                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  border: '1px solid rgba(255, 255, 255, 0.3)'
                                }}
                              />
                              {campaign.status && (
                                <Chip
                                  size="small"
                                  label={campaign.status}
                                  sx={{ 
                                    fontSize: '0.75rem', 
                                    height: 22,
                                    bgcolor: campaign.status === 'ACTIVE' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(158, 158, 158, 0.3)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    border: `1px solid ${campaign.status === 'ACTIVE' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(158, 158, 158, 0.5)'}`
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                        <Typography variant="body1" sx={{ 
                          color: 'rgba(255, 255, 255, 0.9)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          flexGrow: 1
                        }}>
                          {campaign.summary || campaign.description?.substring(0, 120)}
                          {(campaign.summary || campaign.description)?.length > 120 ? '...' : ''}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Health Information Section */}
            {stats.recentHealthInfoPosts.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.95)', fontWeight: 'bold' }}>
                  <ArticleIcon sx={{ mr: 2, fontSize: 32 }} />
                  Health Information Posts
                </Typography>
                <Grid container spacing={3}>
                  {stats.recentHealthInfoPosts.slice(0, 4).map((post, index) => (
                    <Grid item xs={12} md={6} key={post.id || index}>
                      <Box sx={{ 
                        p: 3, 
                        borderRadius: 3, 
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.25)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar sx={{ 
                            width: 48, 
                            height: 48, 
                            bgcolor: 'rgba(255, 255, 255, 0.2)', 
                            mr: 2,
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                          }}>
                            <ArticleIcon sx={{ fontSize: 28, color: 'white' }} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ 
                              lineHeight: 1.3, 
                              mb: 1,
                              color: 'white',
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                            }}>
                              {post.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={post.category || 'Health Info'}
                              sx={{ 
                                fontSize: '0.75rem', 
                                height: 22,
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontWeight: 'bold',
                                border: '1px solid rgba(255, 255, 255, 0.3)'
                              }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body1" sx={{ 
                          color: 'rgba(255, 255, 255, 0.9)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          flexGrow: 1
                        }}>
                          {post.content?.substring(0, 120)}
                          {post.content?.length > 120 ? '...' : ''}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Empty State */}
            {stats.latestCampaigns.length === 0 && stats.recentHealthInfoPosts.length === 0 && (
              <Box textAlign="center" py={8}>
                <Box sx={{ mb: 4 }}>
                  <CampaignIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.6)', mb: 2, mr: 2 }} />
                  <ArticleIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.6)', mb: 2 }} />
                </Box>
                <Typography variant="h4" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.9)' }}>
                  No Health Content Available
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
                  Check back soon for new campaigns and health information
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  component={Link}
                  to="/campaigns"
                  startIcon={<CampaignIcon />}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  Explore Health Content
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ 
          p: 4, 
          height: '100%', 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            zIndex: 1
          }
        }}>
          <Box position="relative" zIndex={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold" sx={{ 
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <AnnouncementIcon sx={{ mr: 1.5, fontSize: 32 }} />
                Latest News
              </Typography>
              <Button
                component={Link}
                to="/campaigns"
                variant="contained"
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  }
                }}
                endIcon={<ArrowForwardIcon />}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.3)' }} />
          
          {/* Latest Campaigns */}
          {stats.latestCampaigns.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.9)' }}>
                <CampaignIcon sx={{ mr: 1, fontSize: 24 }} />
                Latest Campaigns
              </Typography>
              {stats.latestCampaigns.slice(0, 2).map((campaign, index) => (
                <Box key={campaign.id || index} sx={{ 
                  mb: 3, 
                  p: 3, 
                  borderRadius: 3, 
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: 'rgba(255, 255, 255, 0.2)', 
                      mr: 2,
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <CampaignIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ 
                        lineHeight: 1.3, 
                        mb: 1,
                        color: 'white',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        {campaign.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={campaign.campaign_type?.replace('_', ' ') || 'General'}
                        sx={{ 
                          fontSize: '0.75rem', 
                          height: 22,
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: 'bold',
                          border: '1px solid rgba(255, 255, 255, 0.3)'
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {campaign.summary || campaign.description?.substring(0, 80)}
                    {(campaign.summary || campaign.description)?.length > 80 ? '...' : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Health Info Posts */}
          {stats.recentHealthInfoPosts.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.9)' }}>
                <ArticleIcon sx={{ mr: 1, fontSize: 24 }} />
                Health Information
              </Typography>
              {stats.recentHealthInfoPosts.slice(0, 2).map((post, index) => (
                <Box key={post.id || index} sx={{ 
                  mb: 3, 
                  p: 3, 
                  borderRadius: 3, 
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: 'rgba(255, 255, 255, 0.2)', 
                      mr: 2,
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <ArticleIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ 
                        lineHeight: 1.3, 
                        mb: 1,
                        color: 'white',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        {post.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={post.category || 'Health Info'}
                        sx={{ 
                          fontSize: '0.75rem', 
                          height: 22,
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: 'bold',
                          border: '1px solid rgba(255, 255, 255, 0.3)'
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {post.content?.substring(0, 80)}
                    {post.content?.length > 80 ? '...' : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Announcements */}
          {stats.announcements.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.9)' }}>
                <AnnouncementIcon sx={{ mr: 1, fontSize: 24 }} />
                Latest News
              </Typography>
              {stats.announcements.slice(0, 2).map((announcement, index) => (
                <Box key={announcement.id || index} sx={{ 
                  mb: 3, 
                  p: 3, 
                  borderRadius: 3, 
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: 'rgba(255, 255, 255, 0.2)', 
                      mr: 2,
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <AnnouncementIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ 
                        lineHeight: 1.3, 
                        mb: 1,
                        color: 'white',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        {announcement.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {announcement.content?.substring(0, 80)}
                    {announcement.content?.length > 80 ? '...' : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Empty State */}
          {stats.latestCampaigns.length === 0 && stats.recentHealthInfoPosts.length === 0 && stats.announcements.length === 0 && (
            <Box textAlign="center" py={6}>
              <Box sx={{ mb: 3 }}>
                <CampaignIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.6)', mb: 2, mr: 1 }} />
                <ArticleIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.6)', mb: 2, mr: 1 }} />
                <AnnouncementIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.6)', mb: 2 }} />
              </Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.9)' }}>
                No content available
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
                Check back soon for new campaigns, health info, and announcements
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to="/campaigns"
                startIcon={<CampaignIcon />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  }
                }}
              >
                Explore Content
              </Button>
            </Box>
          )}
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          Quick Actions
        </Typography>
      </Grid>

      {renderRoleBasedActions()}

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