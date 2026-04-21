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
  alpha
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
  Stop as StopIcon
} from '@mui/icons-material';
import { authService } from '../services/api';
import InfoTooltip from './utils/InfoTooltip';

const EmailAdministration = () => {
  const [emailStatus, setEmailStatus] = useState(null);
  const [emailStats, setEmailStats] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [systemEmailConfigs, setSystemEmailConfigs] = useState([]);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [eventChoices, setEventChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [editConfigOpen, setEditConfigOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    stats: true,
    actions: true,
    events: true
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
    fetchEmailData();
    fetchConfigs();
  }, []);

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
      const response = await authService.updateSystemEmailConfig(selectedConfig.id, editForm);
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
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          <EmailIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Email System Administration
        </Typography>
        <InfoTooltip title="View status, stats, and run test/automation emails. Use actions to preview or send." />
      </Box>

      {notification && (
        <Alert 
          severity={notification.type} 
          onClose={() => setNotification(null)}
          sx={{ mb: 3 }}
        >
          {notification.message}
        </Alert>
      )}

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
            <Typography variant="h6">
              <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Event Routing & Template Configurations
            </Typography>
            <Box>
              <IconButton onClick={() => toggleSection('events')}>
                {expandedSections.events ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <IconButton onClick={fetchConfigs} disabled={configLoading}>
                <RefreshIcon />
              </IconButton>
            </Box>
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
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center">
            <Typography variant="h6">
              <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              System Status
            </Typography>
            <Box>
              <IconButton onClick={() => toggleSection('status')}>
                {expandedSections.status ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <IconButton onClick={fetchEmailData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Collapse in={expandedSections.status}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Email Backend
                  </Typography>
                  <Typography variant="body1">
                    {emailStatus?.email_backend || 'Unknown'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    System Mode
                  </Typography>
                  <Chip 
                    label={emailStatus?.is_development_mode ? 'Development' : 'Production'}
                    color={getStatusColor(emailStatus?.system_health)}
                    size="small"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    SMTP Host
                  </Typography>
                  <Typography variant="body1">
                    {emailStatus?.smtp_host || 'Not configured'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    From Email
                  </Typography>
                  <Typography variant="body1">
                    {emailStatus?.from_email || 'Not set'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Email Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center">
            <Typography variant="h6">
              <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Automation Statistics
            </Typography>
            <IconButton onClick={() => toggleSection('stats')}>
              {expandedSections.stats ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={expandedSections.stats}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {emailStats?.visits?.today || 0}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Visits Today
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary">
                    {emailStats?.visits?.yesterday || 0}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Visits Yesterday
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {emailStats?.visits?.last_7_days || 0}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Last 7 Days
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main">
                    {emailStats?.visits?.last_30_days || 0}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Last 30 Days
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  System Health: {emailStats?.system_health?.health_percentage || 0}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={emailStats?.system_health?.health_percentage || 0}
                  color={getHealthColor(emailStats?.system_health?.health_percentage || 0)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="caption">
                    Healthy: {emailStats?.system_health?.healthy_checks || 0}
                  </Typography>
                  <Typography variant="caption">
                    Warning: {emailStats?.system_health?.warning_checks || 0}
                  </Typography>
                  <Typography variant="caption">
                    Unhealthy: {emailStats?.system_health?.unhealthy_checks || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Email Actions */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center">
            <Typography variant="h6">
              <PlayArrowIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Email Automation Controls
            </Typography>
            <IconButton onClick={() => toggleSection('actions')}>
              {expandedSections.actions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={expandedSections.actions}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => setTestDialogOpen(true)}
                  disabled={actionLoading}
                >
                  Test Email System
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
                >
                  Send Feedback Emails
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
                >
                  Send Health Alert
                </Button>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

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
        ...
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
