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
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Check as CheckIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { authService, campaignService, healthInfoService } from '../services/api';
import { useDispatch } from 'react-redux';
import { logout } from '../features/authentication/authSlice';
import LoadingState from './utils/LoadingState';
import ErrorState from './utils/ErrorState';
import PageHeader from './utils/PageHeader';

// Asset Imports for BMI Visualizers
import BMI_male_1 from "../assets/images/BMI_Visual/BMI_male_1.png";
import BMI_male_2 from "../assets/images/BMI_Visual/BMI_male_2.png";
import BMI_male_3 from "../assets/images/BMI_Visual/BMI_male_3.png";
import BMI_male_4 from "../assets/images/BMI_Visual/BMI_male_4.png";
import BMI_female_1 from "../assets/images/BMI_Visual/BMI_female_1.png";
import BMI_female_2 from "../assets/images/BMI_Visual/BMI_female_2.png";
import BMI_female_3 from "../assets/images/BMI_Visual/BMI_female_3.png";
import BMI_female_4 from "../assets/images/BMI_Visual/BMI_female_4.png";
import { useMediaQuery } from '@mui/material';

import { 
  getSexLabel, 
  getCourseLabel, 
  getYearLevelLabel,
  calculateAge,
  convertStringToArray 
} from '../utils/fieldMappers';

const Dashboard = memo(({ user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isCompactTable = useMediaQuery('(max-width:1000px)');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalRecords: 0,
    totalMedicalRecords: 0,
    totalDentalRecords: 0,
    totalConsultations: 0,
    recentPatients: [],
    visitsByMonth: [],
    pendingRequests: 0,
    recentHealthInfo: null,
    profileCompletion: null,
    missingFields: [],
    featuredCampaigns: [],
    latestCampaigns: [],
    recentHealthInfoPosts: [],
    announcements: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdminOrStaffOrDoctor = user && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'].includes(user.role);
  const isDoctor = user && (user.role === 'DOCTOR' || user.role === 'DENTIST');
  const isNurse = user && user.role === 'NURSE';
  const isStudent = user && ['STUDENT', 'FACULTY'].includes(user.role);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboardResponse, campaignsResponse, latestCampaignsResponse, healthInfoResponse] = await Promise.all([
        authService.getDashboardStats(),
        campaignService.getCampaigns({ active: 'true', limit: 5 }).catch(() => ({ data: [] })), 
        campaignService.getCampaigns({ limit: 10, ordering: '-created_at' }).catch(() => ({ data: [] })), 
        healthInfoService.getRecent(5).catch(() => ({ data: [] }))
      ]);
      
      if (!dashboardResponse || !dashboardResponse.data) {
        throw new Error('Invalid response from server');
      }
      
      const featuredCampaignsData = campaignsResponse.data?.results || campaignsResponse.data || [];
      const latestCampaignsData = latestCampaignsResponse.data?.results || latestCampaignsResponse.data || [];
      
      setStats({
        totalPatients: dashboardResponse.data.total_patients || 0,
        totalRecords: dashboardResponse.data.total_records || 0,
        totalMedicalRecords: dashboardResponse.data.total_medical_records || 0,
        totalDentalRecords: dashboardResponse.data.total_dental_records || 0,
        totalConsultations: dashboardResponse.data.total_consultations || 0,
        recentPatients: Array.isArray(dashboardResponse.data.recent_patients) ? dashboardResponse.data.recent_patients : [],
        visitsByMonth: Array.isArray(dashboardResponse.data.visits_by_month) ? dashboardResponse.data.visits_by_month : [],
        pendingRequests: dashboardResponse.data.pending_requests || 0,
        recentHealthInfo: dashboardResponse.data.recent_health_info || null,
        profileCompletion: dashboardResponse.data.profile_completion || 0,
        missingFields: dashboardResponse.data.missing_fields || [],
        featuredCampaigns: Array.isArray(featuredCampaignsData) ? featuredCampaignsData.slice(0, 3) : [],
        latestCampaigns: Array.isArray(latestCampaignsData) ? latestCampaignsData.slice(0, 8) : [], 
        recentHealthInfoPosts: Array.isArray(healthInfoResponse.data) ? healthInfoResponse.data.slice(0, 5) : [],
        announcements: Array.isArray(dashboardResponse.data.announcements) ? dashboardResponse.data.announcements : [],
      });
    } catch (error) {
      if (error.response?.status === 401) {
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
      setError('User information is missing. Please log out and log in again.');
      setLoading(false);
    }
  }, [user, dispatch, fetchDashboardData]);

  useEffect(() => {
    localStorage.setItem('hasVisitedDashboard', 'true');
  }, []);

  const getBMIVisual = (bmiValue, sexOrGender) => {
    const bmi = parseFloat(bmiValue);
    if (isNaN(bmi) || bmi <= 0) return null;
    
    const isFemale = sexOrGender === '2' || sexOrGender === 'F' || sexOrGender === 'Female';
    
    if (isFemale) {
      if (bmi < 18.5) return BMI_female_1;
      if (bmi >= 18.5 && bmi < 25) return BMI_female_2;
      if (bmi >= 25 && bmi < 30) return BMI_female_3;
      return BMI_female_4;
    } else {
      if (bmi < 18.5) return BMI_male_1;
      if (bmi >= 18.5 && bmi < 25) return BMI_male_2;
      if (bmi >= 25 && bmi < 30) return BMI_male_3;
      return BMI_male_4;
    }
  };

  const getBMICardDetails = (bmiValue) => {
    const bmi = parseFloat(bmiValue);
    if (isNaN(bmi)) return { text: 'Unknown Status', color: '#757575' };
    if (bmi < 18.5) return { text: 'Underweight', color: '#1e88e5' };
    if (bmi >= 18.5 && bmi < 25) return { text: 'Healthy Weight', color: '#1b5e20' };
    if (bmi >= 25 && bmi < 30) return { text: 'Overweight', color: '#f57c00' };
    return { text: 'Obese', color: '#d32f2f' };
  };

  const StatCard = memo(({ title, value, icon, color, subtitle = null }) => (
    <Card 
      sx={{ 
        height: '100%', 
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease',
        '&:hover': { transform: 'translateY(-5px)' }
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
      case 'FACULTY':
        return (
          <>
            <Grid item xs={12} md={4}>
              <QuickAction
                title="Medical Records"
                description="View your detailed clinic visit logs, specific consultation records, and medical documentation"
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
          title="Approvals & Alerts"
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
            <Button component={Link} to="/patients" size="small" endIcon={<ArrowForwardIcon />}>
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {stats.recentPatients.length > 0 ? (
            isCompactTable ? (
              <Grid container spacing={2}>
                {stats.recentPatients.slice(0, 4).map((patient, index) => (
                  <Grid item xs={12} sm={6} key={patient.id || index}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 1.5,
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                          {patient.first_name ? patient.first_name[0] : 'P'}
                        </Avatar>
                        <Box minWidth={0}>
                          <Typography variant="subtitle2" fontWeight="bold" noWrap>
                            {patient.first_name} {patient.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {patient.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto', pt: 1, borderTop: '1px solid #f0f0f0' }}>
                        <Chip 
                          label={patient.gender === '1' || patient.gender === 'Male' ? 'Male' : 'Female'} 
                          size="small"
                          sx={{ height: 20, fontSize: '0.75rem', fontWeight: 'bold', bgcolor: '#1b5e20', color: 'white' }}
                        />
                        <Button 
                          size="small" 
                          variant="text" 
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsModalOpen(true);
                          }}
                          sx={{ textTransform: 'none', py: 0 }}
                        >
                          Preview
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
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
                        <Tooltip title="View Patient Summary">
                          <IconButton 
                            edge="end" 
                            size="small"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setIsModalOpen(true);
                            }}
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
                            {patient.email} • {patient.gender === '1' || patient.gender === 'Male' ? 'Male' : 'Female'}
                          </>
                        }
                      />
                    </ListItem>
                    {index < stats.recentPatients.slice(0, 4).length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )
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
            <Button component={Link} to="/campaigns" size="small" endIcon={<ArrowForwardIcon />}>
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {stats.latestCampaigns.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <CampaignIcon sx={{ mr: 1, fontSize: 16 }} />
                Latest Campaigns
              </Typography>
              {stats.latestCampaigns.slice(0, 2).map((campaign, index) => (
                <Box key={campaign.id || index} sx={{ 
                  mb: 2, p: 2, borderRadius: 2, 
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
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', mr: 1.5, fontSize: '0.875rem' }}>
                      <CampaignIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1.3, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {campaign.title}
                      </Typography>
                      <Chip size="small" label={campaign.campaign_type?.replace('_', ' ') || 'General'} sx={{ fontSize: '0.7rem', height: 18, bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {campaign.summary || campaign.description?.substring(0, 70)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {stats.recentHealthInfoPosts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="success.main" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <ArticleIcon sx={{ mr: 1, fontSize: 16 }} />
                Health Info
              </Typography>
              {stats.recentHealthInfoPosts.slice(0, 2).map((post, index) => (
                <Box key={post.id || index} sx={{ 
                  mb: 2, p: 2, borderRadius: 2, 
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
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'success.main', mr: 1.5, fontSize: '0.875rem' }}>
                      <ArticleIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1.3, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.title}
                      </Typography>
                      <Chip size="small" label={post.category || 'Health Info'} sx={{ fontSize: '0.7rem', height: 18, bgcolor: 'success.main', color: 'white', fontWeight: 'bold' }} />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.content?.substring(0, 70)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {stats.latestCampaigns.length === 0 && stats.recentHealthInfoPosts.length === 0 && (
            <Box textAlign="center" py={3}>
              <Box sx={{ mb: 2 }}>
                <CampaignIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, mr: 1 }} />
                <ArticleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              </Box>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                No campaigns or health info available
              </Typography>
              <Button variant="outlined" size="small" component={Link} to="/campaigns" sx={{ mt: 1 }}>
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
            <Chip label="Healthy" color="success" size="small" sx={{ fontWeight: 'medium' }} />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              API Status
            </Typography>
            <Chip label="Operational" color="success" size="small" sx={{ fontWeight: 'medium' }} />
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
            <Button variant="outlined" fullWidth component={Link} to="/database-monitor" endIcon={<ArrowForwardIcon />} size="small">
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
          value={stats.totalMedicalRecords}
          icon={<HospitalIcon />}
          color="#4caf50"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          title="Consultations"
          value={stats.totalConsultations}
          icon={<MedicationIcon />}
          color="#2196f3"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 2, bgcolor: '#ff9800', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon />
            <Typography variant="subtitle1" fontWeight="bold">Profile Status</Typography>
          </Box>
          <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
            {stats.missingFields && stats.missingFields.length > 0 ? (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  Missing information to complete your profile:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
                  {stats.missingFields.slice(0, 10).map((field, idx) => (
                    <Chip key={idx} label={field} size="small" sx={{ fontSize: '0.75rem', height: 24, bgcolor: alpha('#ff9800', 0.1), color: '#e65100', border: '1px solid', borderColor: alpha('#ff9800', 0.2), fontWeight: 'bold' }} />
                  ))}
                  {stats.missingFields.length > 10 && (
                    <Typography variant="caption" sx={{ mt: 0.5, ml: 0.5, color: 'text.secondary' }}>
                      +{stats.missingFields.length - 10} more
                    </Typography>
                  )}
                </Box>
                <Button component={Link} to="/profile-setup" variant="contained" color="warning" size="medium" fullWidth sx={{ mt: 'auto', borderRadius: 2, fontWeight: 'bold' }}>
                  Complete My Profile
                </Button>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                <Avatar sx={{ bgcolor: 'success.light', mb: 2, width: 50, height: 50 }}>
                  <CheckIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  Profile Complete
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your healthcare record is fully updated.
                </Typography>
                <Button component={Link} to="/profile-setup" variant="text" color="primary" size="small" sx={{ mt: 'auto' }}>
                  Edit Profile
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, height: '100%', borderRadius: 3, bgcolor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={{ flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
              <CampaignIcon sx={{ mr: { xs: 1, sm: 2 }, fontSize: { xs: 32, sm: 40 }, color: 'primary.main' }} />
              Health Campaigns
            </Typography>
            <Button component={Link} to="/campaigns" variant="contained" color="primary" endIcon={<ArrowForwardIcon />} size="small">
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          {stats.latestCampaigns && stats.latestCampaigns.length > 0 ? (
            <Grid container spacing={3}>
              {stats.latestCampaigns.slice(0, 4).map((campaign, index) => (
                <Grid item xs={12} sm={6} key={campaign.id || index}>
                  <Box 
                    onClick={() => {
                      if (campaign.id) {
                        campaignService.trackEngagement(campaign.id);
                        navigate(`/campaigns/${campaign.id}`);
                      }
                    }}
                    sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200', transition: 'all 0.3s ease', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', overflow: 'hidden', '&:hover': { bgcolor: 'grey.100', transform: 'translateY(-2px)', boxShadow: 2 } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, bgcolor: 'primary.main', mr: { xs: 1.5, sm: 2 }, border: '2px solid', borderColor: 'primary.light' }}>
                        <CampaignIcon sx={{ fontSize: { xs: 20, sm: 28 }, color: 'white' }} />
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.3, mb: 1, color: 'text.primary', fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' }, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {campaign.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          {campaign.campaign_type && (
                            <Chip size="small" label={campaign.campaign_type.replace('_', ' ')} sx={{ fontSize: '0.7rem', height: 20, bgcolor: 'primary.main', color: 'white' }} />
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      {campaign.summary || campaign.description?.substring(0, 120)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={8}>
              <CampaignIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, color: 'text.primary' }}>
                No Health Campaigns Yet
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, height: '100%', borderRadius: 3, bgcolor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                <InfoIcon sx={{ mr: 1.5, fontSize: { xs: 24, sm: 32 } }} />
                Health Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
          
            {stats.recentHealthInfoPosts.length > 0 ? (
              <Box>
                {stats.recentHealthInfoPosts.slice(0, 3).map((post, index) => (
                  <Box key={post.id || index} sx={{ mb: 3, p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200', transition: 'all 0.3s ease', overflow: 'hidden', '&:hover': { bgcolor: 'grey.100', transform: 'translateY(-2px)', boxShadow: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, bgcolor: 'secondary.main', mr: 2, border: '2px solid', borderColor: 'secondary.light' }}>
                        <ArticleIcon sx={{ fontSize: { xs: 18, sm: 24 }, color: 'white' }} />
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.3, mb: 0.5, color: 'text.primary', fontSize: { xs: '0.875rem', sm: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {post.title}
                        </Typography>
                        <Chip size="small" label={post.category || 'Health Info'} sx={{ fontSize: '0.65rem', height: 18, bgcolor: 'secondary.main', color: 'white' }} />
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {post.description?.substring(0, 80)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={6}>
                <ArticleIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                  No Health Info Available
                </Typography>
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
    </Grid>
  );

  if (loading) {
    return <LoadingState message="Loading dashboard..." height={400} />;
  }

  if (error) {
    return <ErrorState message="Could not load dashboard" details={error} onRetry={fetchDashboardData} height={400} />;
  }

  const welcomeMessage = user?.first_name 
    ? `Welcome back, ${user.first_name}!` 
    : 'Welcome to USC Patient Information System';

  return (
    <>
      <PageHeader
        title={welcomeMessage}
        subtitle={`You are logged in as ${user?.role?.toLowerCase() || 'a user'}`}
        helpText="Use the sidebar to open features. Click cards and action icons for more details; hover icons to see quick tips."
      />
      
      {user && user.completeSetup === false && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your profile setup is not complete. Please complete your profile for full access.
        </Alert>
      )}
      
      {isAdminOrStaffOrDoctor ? renderAdminDashboard() : renderStudentDashboard()}

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="lg"
        fullWidth
        scroll="body"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#f4f6f8' } }}
      >
        {selectedPatient && (
          <>
            <DialogTitle 
              sx={{ 
                p: 2, px: 3, bgcolor: '#ffffff', borderBottom: '1px solid #e0e0e0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
              }}
            >
              <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'text.primary' }}>
                Patient Medical File Preview
              </Typography>
              <IconButton onClick={() => setIsModalOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, marginTop: "20px"}}>
              <Grid container spacing={3}>
                
                {/* ================= LEFT COLUMN ================= */}
                <Grid item xs={12} md={4} display="flex" flexDirection="column" gap={3}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', height: 'fit-content' }}>
                    <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="success" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">Profile Picture</Typography>
                    </Box>
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Avatar
                        src={selectedPatient.profile_picture}
                        sx={{ width: 140, height: 140, mx: 'auto', mb: 2, bgcolor: '#cfd8dc', border: '1px solid #b0bec5' }}
                      >
                        {selectedPatient.first_name ? selectedPatient.first_name[0] : 'P'}
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', lineHeight: 1.2, mb: 0.5 }}>
                        {selectedPatient.first_name} {selectedPatient.middle_name || ''} {selectedPatient.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mb: 1.5 }}>
                        {selectedPatient.id_number || 'No ID Number'}
                      </Typography>
                      <Chip 
                        label={selectedPatient.gender === '1' || selectedPatient.gender === 'Male' ? 'Male' : 'Female'} 
                        size="small" 
                        sx={{ bgcolor: '#1b5e20', color: 'white', fontWeight: 'bold', px: 1.5, borderRadius: 1.5 }} 
                      />
                    </CardContent>
                  </Card>

                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                    <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HospitalIcon color="success" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">BMI & Vitals</Typography>
                    </Box>
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        {(() => {
                          const visualSrc = getBMIVisual(selectedPatient.bmi, selectedPatient.sex || selectedPatient.gender);
                          
                          return visualSrc ? (
                            <Box>
                              <Box 
                                component="img"
                                src={visualSrc}
                                alt="BMI Visual Status" 
                                sx={{ height: 130, width: 'auto', objectFit: 'contain' }}
                              />
                            </Box>
                          ) : (
                            <Box 
                              sx={{ 
                                height: 130, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                No BMI Data
                              </Typography>
                            </Box>
                          );
                        })()}
                      </Box>
                      
                      <Box sx={{ width: '100%', bgcolor: getBMICardDetails(selectedPatient.bmi).color, color: 'white', textTransform: 'none', textAlign: 'center', py: 0.75, borderRadius: 1.5, fontWeight: 'bold', mb: 2, fontSize: '0.875rem' }}>
                        {getBMICardDetails(selectedPatient.bmi).text}
                      </Box>

                      <Grid container spacing={1} sx={{ textAlign: 'center' }}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" display="block">Height</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">{selectedPatient.height || 'N/A'} cm</Typography>
                        </Grid>
                        <Grid item xs={4} sx={{ borderLeft: '1px solid #e0e0e0', borderRight: '1px solid #e0e0e0' }}>
                          <Typography variant="caption" color="text.secondary" display="block">Weight</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">{selectedPatient.weight || 'N/A'} kg</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" display="block">BMI</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">{selectedPatient.bmi || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* ================= RIGHT COLUMN ================= */}
                <Grid item xs={12} md={8} display="flex" flexDirection="column" gap={3}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                    <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignmentIcon color="success" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">Personal & Academic Information</Typography>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><SchoolIcon fontSize="inherit"/> Program / Course</Typography>
                          <Typography variant="body2" fontWeight="medium">{getCourseLabel(selectedPatient.course) || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><EmailIcon fontSize="inherit"/> Email Address</Typography>
                          <Typography variant="body2" fontWeight="medium">{selectedPatient.email || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><CalendarIcon fontSize="inherit"/> Year Level</Typography>
                          <Typography variant="body2" fontWeight="medium">{getYearLevelLabel(selectedPatient.year_level) || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PhoneIcon fontSize="inherit"/> Phone Number</Typography>
                          <Typography variant="body2" fontWeight="medium">{selectedPatient.phone || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PersonIcon fontSize="inherit"/> Civil Status</Typography>
                          <Typography variant="body2" fontWeight="medium">{selectedPatient.civil_status || 'Single'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><HomeIcon fontSize="inherit"/> Nationality</Typography>
                          <Typography variant="body2" fontWeight="medium">{selectedPatient.nationality || 'Filipino'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><HospitalIcon fontSize="inherit"/> Religion</Typography>
                          <Typography variant="body2" fontWeight="medium">{selectedPatient.religion || 'Roman Catholic'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><CalendarIcon fontSize="inherit"/> Age / Birthday</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {calculateAge(selectedPatient.birthday) ? `${calculateAge(selectedPatient.birthday)} years old` : 'N/A'} ({selectedPatient.birthday || 'YYYY-MM-DD'})
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sx={{ pt: '12px !important' }}>
                          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><HomeIcon fontSize="inherit"/> Present Address</Typography>
                          <Typography variant="body2" fontWeight="medium">{selectedPatient.address_permanent || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                    <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="error" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">Emergency Contacts</Typography>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight="medium">Primary Emergency Contact</Typography>
                          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">{selectedPatient.emergency_contact_phone || 'N/A'}</Typography>
                          <Typography variant="caption" color="text.secondary">{selectedPatient.emergency_contact_name || 'Contact Person Name'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} sx={{ borderLeft: { sm: '1px solid #e0e0e0' }, pl: { sm: 3 } }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PeopleIcon fontSize="inherit"/> Parents</Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}><Box component="span" color="text.secondary">Father:</Box> {selectedPatient.father_name || 'N/A'}</Typography>
                          <Typography variant="body2"><Box component="span" color="text.secondary">Mother:</Box> {selectedPatient.mother_name || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                    <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MedicalIcon color="error" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">Medical Background & Alerts</Typography>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" fontWeight="bold" color="error.main" sx={{ mb: 0.5 }}>Allergies</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {convertStringToArray(selectedPatient.allergies).length > 0 ? (
                              convertStringToArray(selectedPatient.allergies).map((item, i) => (
                                <Chip key={i} label={item} size="small" color="warning" variant="outlined" />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">No allergies recorded</Typography>
                            )}
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#e65100', mb: 0.5 }}>Active Medications</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {convertStringToArray(selectedPatient.medications).length > 0 ? (
                              convertStringToArray(selectedPatient.medications).map((item, i) => (
                                <Chip key={i} label={item} size="small" color="primary" variant="outlined" />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">No medications recorded</Typography>
                            )}
                          </Box>
                        </Grid>

                        <Grid item xs={12}>
                          <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1b5e20', mt: 1, mb: 0.5 }}>Medical Conditions / History</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {convertStringToArray(selectedPatient.existing_medical_condition).length > 0 ? (
                              convertStringToArray(selectedPatient.existing_medical_condition).map((item, i) => (
                                <Chip key={i} label={item} size="small" color="error" variant="outlined" />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">No historical conditions recorded</Typography>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, px: 3, bgcolor: '#ffffff', borderTop: '1px solid #e0e0e0' }}>
              <Button onClick={() => setIsModalOpen(false)} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>
                Close Preview
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;