import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  CircularProgress,
  Divider,
  IconButton,
  Collapse,
  alpha,
  Tabs,
  Tab,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Description as DescriptionIcon,
  Campaign as CampaignIcon,
  Notifications as NotificationsIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { authService, notificationService } from '../services/api';
import InfoTooltip from './utils/InfoTooltip';

const EmailAdministration = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [emailStatus, setEmailStatus] = useState(null);
  const [emailStats, setEmailStats] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [systemEmailConfigs, setSystemEmailConfigs] = useState([]);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [eventChoices, setEventChoices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [editConfigOpen, setEditConfigOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    stats: true,
    actions: true,
    events: true,
    templates: true
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    template_type: 'CUSTOM',
    subject_template: '',
    body_template: '',
    is_active: true
  });

  // Edit config state
  const [editForm, setEditForm] = useState({
    is_enabled: true,
    template: '',
    target_roles: [],
    included_users: [],
    excluded_users: []
  });

  // Test email form state
  const [testForm, setTestForm] = useState({
    email: '',
    types: ['feedback'],
    dryRun: true
  });
  const [testResults, setTestResults] = useState(null);

  // Feedback email form state
  const [feedbackForm, setFeedbackForm] = useState({
    hours: 24,
    dryRun: true
  });
  const [feedbackResults, setFeedbackResults] = useState(null);

  // Health alert form state
  const [alertForm, setAlertForm] = useState({
    alertLevel: 'warning',
    forceAlert: false,
    dryRun: true
  });
  const [alertResults, setAlertResults] = useState(null);

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (activeTab === 0) {
      fetchEmailData();
      fetchConfigs();
    } else if (activeTab === 1) {
      fetchTemplates();
    } else if (activeTab === 2) {
      fetchNotifications();
    } else if (activeTab === 3) {
      fetchCampaigns();
    } else if (activeTab === 4) {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchEmailData = async () => {
    try {
      setLoading(true);
      const [statusResponse, statsResponse] = await Promise.all([
        authService.getEmailSystemStatus(),
        authService.getEmailStats()
      ]);

      setEmailStatus(statusResponse.data);
      setEmailStats(statsResponse.data);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to load email data: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      setConfigLoading(true);
      const [globalRes, systemRes] = await Promise.all([
        authService.getGlobalEmailConfig(),
        authService.getSystemEmailConfigs()
      ]);
      setGlobalConfig(globalRes);
      setSystemEmailConfigs(systemRes.configurations);
      setAvailableTemplates(systemRes.templates);
      setEventChoices(systemRes.event_choices);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to load configurations: ${error.message}`
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getTemplates();
      setAllTemplates(response.data.results || response.data);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to load templates: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getAllNotifications({ all: true });
      setNotifications(response.data.results || response.data);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to load notifications: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getCampaigns();
      setCampaigns(response.data.results || response.data);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to load campaigns: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getLogs();
      setLogs(response.data.results || response.data);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to load logs: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setActionLoading(true);
      await notificationService.createTemplate(templateForm);
      setNotification({
        type: 'success',
        message: 'Template created successfully'
      });
      setTemplateDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to create template: ${error.message}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      setActionLoading(true);
      await notificationService.updateTemplate(selectedTemplate.id, templateForm);
      setNotification({
        type: 'success',
        message: 'Template updated successfully'
      });
      setTemplateDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to update template: ${error.message}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      setActionLoading(true);
      await notificationService.deleteTemplate(id);
      setNotification({
        type: 'success',
        message: 'Template deleted successfully'
      });
      fetchTemplates();
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to delete template: ${error.message}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openTemplateDialog = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm({
        name: template.name,
        template_type: template.template_type,
        subject_template: template.subject_template,
        body_template: template.body_template,
        is_active: template.is_active
      });
    } else {
      setSelectedTemplate(null);
      setTemplateForm({
        name: '',
        template_type: 'CUSTOM',
        subject_template: '',
        body_template: '',
        is_active: true
      });
    }
    setTemplateDialogOpen(true);
  };

  const handleGlobalToggle = async () => {
    try {
      const newValue = !globalConfig.is_emails_enabled;
      const response = await authService.updateGlobalEmailConfig({
        is_emails_enabled: newValue
      });
      setGlobalConfig(response);
      setNotification({
        type: 'success',
        message: `Global email system ${newValue ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to update global setting: ${error.message}`
      });
    }
  };

  const handleEditConfig = (config) => {
    setSelectedConfig(config);
    setEditForm({
      is_enabled: config.is_enabled,
      template: config.template || '',
      target_roles: config.target_roles || [],
      included_users: config.included_users || [],
      excluded_users: config.excluded_users || []
    });
    setEditConfigOpen(true);
  };

  const handleUpdateConfig = async () => {
    try {
      setActionLoading(true);
      // Ensure template is null if empty string for backend compatibility
      const payload = {
        ...editForm,
        template: editForm.template === '' ? null : editForm.template
      };
      const response = await authService.updateSystemEmailConfig(selectedConfig.id, payload);
      setSystemEmailConfigs(prev => prev.map(c => c.id === selectedConfig.id ? response : c));
      setEditConfigOpen(false);
      setNotification({
        type: 'success',
        message: `Configuration for ${selectedConfig.event_type_display} updated`
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to update configuration: ${error.message}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testForm.email) {
      setNotification({
        type: 'error',
        message: 'Please enter an email address'
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await authService.testEmailSystem(testForm);
      setTestResults(response.data);
      
      setNotification({
        type: 'success',
        message: `Email test ${testForm.dryRun ? 'preview' : 'completed'} successfully`
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Email test failed: ${error.message}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendFeedbackEmails = async () => {
    try {
      setActionLoading(true);
      const response = await authService.sendFeedbackEmails(feedbackForm);
      setFeedbackResults(response.data);
      
      setNotification({
        type: 'success',
        message: `Feedback emails ${feedbackForm.dryRun ? 'preview' : 'sent'} successfully`
      });
      
      // Refresh stats
      fetchEmailData();
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to send feedback emails: ${error.message}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendHealthAlert = async () => {
    try {
      setActionLoading(true);
      const response = await authService.sendHealthAlert(alertForm);
      setAlertResults(response.data);
      
      setNotification({
        type: 'success',
        message: `Health alert ${alertForm.dryRun ? 'preview' : 'sent'} successfully`
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to send health alert: ${error.message}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusColor = (status) => {
    if (status === 'operational') return 'success';
    if (status === 'development') return 'warning';
    return 'error';
  };

  const getHealthColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EmailIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">
            Email System Administration
          </Typography>
          <InfoTooltip title="Manage global email settings, event routing, templates, and view system logs." />
        </Box>
        <Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={() => {
              if (activeTab === 0) { fetchEmailData(); fetchConfigs(); }
              else if (activeTab === 1) fetchTemplates();
              else if (activeTab === 2) fetchNotifications();
              else if (activeTab === 3) fetchCampaigns();
              else if (activeTab === 4) fetchLogs();
            }}
            disabled={loading || configLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)} 
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<SettingsIcon />} iconPosition="start" label="Routing & Status" />
        <Tab icon={<DescriptionIcon />} iconPosition="start" label="Email Templates" />
        <Tab icon={<NotificationsIcon />} iconPosition="start" label="Sent Notifications" />
        <Tab icon={<CampaignIcon />} iconPosition="start" label="Email Campaigns" />
        <Tab icon={<HistoryIcon />} iconPosition="start" label="System Logs" />
      </Tabs>

      {notification && (
        <Alert 
          severity={notification.type} 
          onClose={() => setNotification(null)}
          sx={{ mb: 3 }}
        >
          {notification.message}
        </Alert>
      )}

      {activeTab === 0 && (
        <Box>
          {/* Global Master Switch */}
          <Card sx={{ mb: 3, bgcolor: alpha(globalConfig?.is_emails_enabled ? '#4caf50' : '#f44336', 0.05) }}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center">
                  <PlayArrowIcon color={globalConfig?.is_emails_enabled ? 'success' : 'disabled'} sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Global Email System Master Switch
                  </Typography>
                  <InfoTooltip title="When disabled, NO automated emails will be sent by the system (except manual tests)." />
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={globalConfig?.is_emails_enabled || false}
                      onChange={handleGlobalToggle}
                      color="success"
                      size="large"
                    />
                  }
                  label={
                    <Typography variant="button" fontWeight="bold" color={globalConfig?.is_emails_enabled ? 'success.main' : 'error.main'}>
                      {globalConfig?.is_emails_enabled ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                    </Typography>
                  }
                />
              </Box>
            </CardContent>
          </Card>

          {/* Event and Template Configurations */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">
                  <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Event Routing & Routing Rules
                </Typography>
                <IconButton onClick={() => toggleSection('events')}>
                  {expandedSections.events ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.events}>
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell>System Event</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Assigned Template</TableCell>
                        <TableCell>Target Roles</TableCell>
                        <TableCell>Exceptions</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {configLoading ? (
                        <TableRow><TableCell colSpan={6} align="center"><LinearProgress sx={{ my: 2 }} /></TableCell></TableRow>
                      ) : systemEmailConfigs.map((config) => (
                        <TableRow key={config.id} hover>
                          <TableCell sx={{ fontWeight: 'medium' }}>{config.event_type_display}</TableCell>
                          <TableCell>
                            <Chip 
                              label={config.is_enabled ? 'ACTIVE' : 'INACTIVE'} 
                              size="small" 
                              color={config.is_enabled ? 'success' : 'default'} 
                              variant={config.is_enabled ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            {config.template_name ? (
                              <Chip label={config.template_name} size="small" variant="outlined" color="primary" icon={<EmailIcon />} />
                            ) : (
                              <Typography variant="caption" color="text.secondary">Default / None</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {config.target_roles.map(role => (
                                <Chip key={role} label={role} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" flexDirection="column" gap={0.5}>
                              {config.excluded_users_details?.length > 0 && (
                                <Typography variant="caption" color="error">
                                  Excluded: {config.excluded_users_details.length} users
                                </Typography>
                              )}
                              {config.included_users_details?.length > 0 && (
                                <Typography variant="caption" color="success.main">
                                  Included: {config.included_users_details.length} users
                                </Typography>
                              )}
                              {!(config.excluded_users_details?.length > 0) && !(config.included_users_details?.length > 0) && (
                                <Typography variant="caption" color="text.secondary">None</Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="text" onClick={() => handleEditConfig(config)} startIcon={<SettingsIcon />}>
                              Configure
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </CardContent>
          </Card>

          {/* Email System Status */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      System Health
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Health Score: {emailStats?.system_health?.health_percentage || 0}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={emailStats?.system_health?.health_percentage || 0}
                      color={getHealthColor(emailStats?.system_health?.health_percentage || 0)}
                      sx={{ height: 12, borderRadius: 6, mb: 1 }}
                    />
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
                          <Typography variant="h6">{emailStats?.system_health?.healthy_checks || 0}</Typography>
                          <Typography variant="caption">Healthy</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.contrastText' }}>
                          <Typography variant="h6">{emailStats?.system_health?.warning_checks || 0}</Typography>
                          <Typography variant="caption">Warning</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'error.light', borderRadius: 1, color: 'error.contrastText' }}>
                          <Typography variant="h6">{emailStats?.system_health?.unhealthy_checks || 0}</Typography>
                          <Typography variant="caption">Critical</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Backend</Typography>
                      <Typography variant="body2" fontWeight="bold">{emailStatus?.email_backend}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Environment</Typography>
                      <Typography variant="body2" fontWeight="bold">{emailStatus?.is_development_mode ? 'DEVELOPMENT' : 'PRODUCTION'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">SMTP Host</Typography>
                      <Typography variant="body2" fontWeight="bold">{emailStatus?.smtp_host}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">From Address</Typography>
                      <Typography variant="body2" fontWeight="bold">{emailStatus?.from_email}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Volume Statistics
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">{emailStats?.visits?.today || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Today</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary.main">{emailStats?.visits?.yesterday || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Yesterday</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">{emailStats?.visits?.last_7_days || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Last 7 Days</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">{emailStats?.visits?.last_30_days || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Last 30 Days</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Success Rate by Type</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(emailStats?.by_type || {}).map(([type, count]) => (
                        <Chip key={type} label={`${type}: ${count}`} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Email Actions */}
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  <PlayArrowIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Automation Control Panel
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => setTestDialogOpen(true)}
                    disabled={actionLoading}
                    sx={{ py: 1.5 }}
                  >
                    Send Manual Test Email
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    startIcon={<EmailIcon />}
                    onClick={() => setFeedbackDialogOpen(true)}
                    disabled={actionLoading}
                    sx={{ py: 1.5 }}
                  >
                    Trigger Feedback Loop
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="warning"
                    startIcon={<WarningIcon />}
                    onClick={() => setAlertDialogOpen(true)}
                    disabled={actionLoading}
                    sx={{ py: 1.5 }}
                  >
                    Broadcast Health Alert
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Notification & Email Templates
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => openTemplateDialog()}
            >
              Create New Template
            </Button>
          </Box>

          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12} sx={{ textAlign: 'center', py: 5 }}>
                <CircularProgress />
              </Grid>
            ) : allTemplates.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <DescriptionIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No templates found</Typography>
                  <Typography variant="body2" color="text.disabled">Create your first template to get started</Typography>
                </Paper>
              </Grid>
            ) : allTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ maxWidth: '70%' }}>
                        {template.name}
                      </Typography>
                      <Chip 
                        label={template.template_type_display} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      Subject: {template.subject_template}
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
                      BODY PREVIEW:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      bgcolor: 'grey.50', 
                      p: 1.5, 
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: 80
                    }}>
                      {template.body_template}
                    </Typography>
                  </CardContent>
                  <Divider />
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title="Edit Template">
                      <IconButton size="small" onClick={() => openTemplateDialog(template)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Template">
                      <IconButton size="small" color="error" onClick={() => handleDeleteTemplate(template.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Sent Notifications History
            </Typography>
            <Box>
              <Button startIcon={<FilterListIcon />} variant="outlined" size="small">Filter</Button>
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Sent At</TableCell>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Method</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center"><LinearProgress sx={{ my: 3 }} /></TableCell></TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>No notifications found</TableCell></TableRow>
                ) : notifications.map((notif) => (
                  <TableRow key={notif.id} hover>
                    <TableCell>{new Date(notif.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{notif.recipient_email}</Typography>
                      <Typography variant="caption" color="text.secondary">{notif.recipient_name}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notif.title}
                    </TableCell>
                    <TableCell>
                      <Chip label={notif.notification_type_display} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={notif.status} 
                        size="small" 
                        color={notif.status === 'READ' ? 'success' : notif.status === 'SENT' ? 'info' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{notif.delivery_method}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Email Campaigns
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} disabled>New Campaign</Button>
          </Box>

          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12} sx={{ textAlign: 'center', py: 5 }}>
                <CircularProgress />
              </Grid>
            ) : campaigns.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <CampaignIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No campaigns found</Typography>
                </Paper>
              </Grid>
            ) : campaigns.map((campaign) => (
              <Grid item xs={12} md={6} key={campaign.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">{campaign.name}</Typography>
                      <Chip 
                        label={campaign.status} 
                        size="small" 
                        color={campaign.status === 'ACTIVE' ? 'success' : campaign.status === 'COMPLETED' ? 'primary' : 'default'} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Type: {campaign.campaign_type_display} | Audience: {campaign.audience_type}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Sent</Typography>
                        <Typography variant="body2" fontWeight="bold">{campaign.sent_count || 0}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Read</Typography>
                        <Typography variant="body2" fontWeight="bold">{campaign.read_count || 0}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Failed</Typography>
                        <Typography variant="body2" fontWeight="bold">{campaign.failed_count || 0}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 4 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            System Activity Logs
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Recipient/Details</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align="center"><LinearProgress sx={{ my: 3 }} /></TableCell></TableRow>
                ) : logs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>No activity logs found</TableCell></TableRow>
                ) : logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.action_display} 
                        size="small" 
                        color={log.action === 'FAILED' ? 'error' : log.action === 'SENT' ? 'success' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.details}</Typography>
                      {log.email_message_id && (
                        <Typography variant="caption" color="text.disabled">ID: {log.email_message_id}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.metadata?.status || 'N/A'}
                    </TableCell>
                    <TableCell color="error.main">
                      {log.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Template Name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Template Type</InputLabel>
                <Select
                  value={templateForm.template_type}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, template_type: e.target.value }))}
                  label="Template Type"
                >
                  <MenuItem value="APPOINTMENT_REMINDER">Appointment Reminder</MenuItem>
                  <MenuItem value="MEDICATION_REMINDER">Medication Reminder</MenuItem>
                  <MenuItem value="HEALTH_CAMPAIGN">Health Campaign</MenuItem>
                  <MenuItem value="CLINIC_UPDATE">Clinic Update</MenuItem>
                  <MenuItem value="FOLLOW_UP">Follow-up Reminder</MenuItem>
                  <MenuItem value="VACCINATION_REMINDER">Vaccination Reminder</MenuItem>
                  <MenuItem value="DENTAL_REMINDER">Dental Checkup Reminder</MenuItem>
                  <MenuItem value="CUSTOM">Custom Notification</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject Template"
                value={templateForm.subject_template}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, subject_template: e.target.value }))}
                margin="normal"
                placeholder="e.g. Hello {{user_name}}, your appointment is confirmed"
                helperText="Use {{variable_name}} for dynamic content"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Body Template (HTML/Text)"
                value={templateForm.body_template}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, body_template: e.target.value }))}
                margin="normal"
                multiline
                rows={10}
                placeholder="Enter HTML or plain text content..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate} 
            variant="contained"
            disabled={actionLoading || !templateForm.name}
          >
            {actionLoading ? <CircularProgress size={24} /> : selectedTemplate ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Test Email System</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Test Email Address"
            value={testForm.email}
            onChange={(e) => setTestForm(prev => ({ ...prev, email: e.target.value }))}
            margin="normal"
            type="email"
            placeholder="21100727@usc.edu.ph"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Email Types to Test</InputLabel>
            <Select
              multiple
              value={testForm.types}
              onChange={(e) => setTestForm(prev => ({ ...prev, types: e.target.value }))}
              renderValue={(selected) => selected.join(', ')}
            >
              <MenuItem value="feedback">Feedback Request</MenuItem>
              <MenuItem value="welcome">Welcome Email</MenuItem>
              <MenuItem value="certificate">Certificate Notification</MenuItem>
              <MenuItem value="health_alert">Health Alert</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={testForm.dryRun}
                onChange={(e) => setTestForm(prev => ({ ...prev, dryRun: e.target.checked }))}
              />
            }
            label="Dry Run (Preview Only)"
          />
          
          {testResults && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Test Results:</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testResults.details?.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>{result.type}</TableCell>
                        <TableCell>
                          {result.success ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell>{result.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleTestEmail} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {testForm.dryRun ? 'Preview' : 'Send'} Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Email Dialog */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Feedback Emails</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Hours Since Visit"
            value={feedbackForm.hours}
            onChange={(e) => setFeedbackForm(prev => ({ ...prev, hours: parseInt(e.target.value) || 24 }))}
            margin="normal"
            type="number"
            helperText="Send feedback emails for visits from X hours ago"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={feedbackForm.dryRun}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, dryRun: e.target.checked }))}
              />
            }
            label="Dry Run (Preview Only)"
          />
          
          {feedbackResults && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Results:</Typography>
              <Alert severity={feedbackResults.error_count > 0 ? 'warning' : 'success'}>
                {feedbackForm.dryRun ? 'Would send' : 'Sent'} {feedbackResults.sent_count} emails
                {feedbackResults.error_count > 0 && ` (${feedbackResults.error_count} errors)`}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendFeedbackEmails} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {feedbackForm.dryRun ? 'Preview' : 'Send'} Emails
          </Button>
        </DialogActions>
      </Dialog>

      {/* Health Alert Dialog */}
      <Dialog open={alertDialogOpen} onClose={() => setAlertDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Health System Alert</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Alert Level</InputLabel>
            <Select
              value={alertForm.alertLevel}
              onChange={(e) => setAlertForm(prev => ({ ...prev, alertLevel: e.target.value }))}
              label="Alert Level"
            >
              <MenuItem value="info">Info (Blue)</MenuItem>
              <MenuItem value="warning">Warning (Orange)</MenuItem>
              <MenuItem value="error">Critical (Red)</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={alertForm.forceAlert}
                onChange={(e) => setAlertForm(prev => ({ ...prev, forceAlert: e.target.checked }))}
              />
            }
            label="Force Alert (Bypass per-user settings)"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={alertForm.dryRun}
                onChange={(e) => setAlertForm(prev => ({ ...prev, dryRun: e.target.checked }))}
              />
            }
            label="Dry Run (Preview Only)"
          />
          
          {alertResults && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Results:</Typography>
              <Alert severity="info">
                {alertForm.dryRun ? 'Would alert' : 'Alerted'} {alertResults.user_count} users
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendHealthAlert} 
            variant="contained" 
            color="warning"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {alertForm.dryRun ? 'Preview' : 'Send'} Alert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Configuration Dialog */}
      <Dialog open={editConfigOpen} onClose={() => setEditConfigOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configure Event: {selectedConfig?.event_type_display}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.is_enabled}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_enabled: e.target.checked }))}
                />
              }
              label="Enable Notifications for this Event"
            />
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Assigned Template</InputLabel>
              <Select
                value={editForm.template}
                onChange={(e) => setEditForm(prev => ({ ...prev, template: e.target.value }))}
                label="Assigned Template"
              >
                <MenuItem value="">
                  <em>Default / None</em>
                </MenuItem>
                {availableTemplates.map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.name} ({t.template_type_display})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Target Roles</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['ADMIN', 'DOCTOR', 'DENTIST', 'NURSE', 'STAFF', 'TEACHER', 'STUDENT'].map(role => (
                <Chip
                  key={role}
                  label={role}
                  onClick={() => {
                    const roles = [...editForm.target_roles];
                    if (roles.includes(role)) {
                      setEditForm(prev => ({ ...prev, target_roles: roles.filter(r => r !== role) }));
                    } else {
                      setEditForm(prev => ({ ...prev, target_roles: [...roles, role] }));
                    }
                  }}
                  color={editForm.target_roles.includes(role) ? 'primary' : 'default'}
                  variant={editForm.target_roles.includes(role) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="error" gutterBottom>Excluded Users</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  These users will NEVER receive this notification.
                </Typography>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1, minHeight: 100 }}>
                  <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                    <TextField 
                      size="small" 
                      placeholder="User ID or Email" 
                      id="exclude-user-input"
                      fullWidth
                    />
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => {
                        const val = document.getElementById('exclude-user-input').value;
                        if (val) {
                          // Note: In a real app we'd verify the user exists first
                          setEditForm(prev => ({ 
                            ...prev, 
                            excluded_users: [...new Set([...prev.excluded_users, isNaN(val) ? val : parseInt(val)])] 
                          }));
                          document.getElementById('exclude-user-input').value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                  {editForm.excluded_users.length === 0 ? (
                    <Typography variant="body2" color="text.disabled" align="center" sx={{ mt: 1 }}>No exclusions</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {editForm.excluded_users.map(userId => {
                        const user = selectedConfig?.excluded_users_details?.find(u => u.id === userId);
                        return (
                          <Chip 
                            key={userId} 
                            label={user?.email || `User #${userId}`} 
                            size="small" 
                            onDelete={() => setEditForm(prev => ({ ...prev, excluded_users: prev.excluded_users.filter(id => id !== userId) }))}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>Included Users</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  These users will ALWAYS receive this notification.
                </Typography>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1, minHeight: 100 }}>
                  <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                    <TextField 
                      size="small" 
                      placeholder="User ID or Email" 
                      id="include-user-input"
                      fullWidth
                    />
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => {
                        const val = document.getElementById('include-user-input').value;
                        if (val) {
                          setEditForm(prev => ({ 
                            ...prev, 
                            included_users: [...new Set([...prev.included_users, isNaN(val) ? val : parseInt(val)])] 
                          }));
                          document.getElementById('include-user-input').value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                  {editForm.included_users.length === 0 ? (
                    <Typography variant="body2" color="text.disabled" align="center" sx={{ mt: 1 }}>No inclusions</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {editForm.included_users.map(userId => {
                        const user = selectedConfig?.included_users_details?.find(u => u.id === userId);
                        return (
                          <Chip 
                            key={userId} 
                            label={user?.email || `User #${userId}`} 
                            size="small" 
                            color="success"
                            variant="outlined"
                            onDelete={() => setEditForm(prev => ({ ...prev, included_users: prev.included_users.filter(id => id !== userId) }))}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditConfigOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateConfig} 
            variant="contained" 
            color="primary"
            disabled={actionLoading}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailAdministration;
