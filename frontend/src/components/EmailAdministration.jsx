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
  Collapse
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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    stats: true,
    actions: true
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
        <DialogTitle>Send Health Alert</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Alert Level</InputLabel>
            <Select
              value={alertForm.alertLevel}
              onChange={(e) => setAlertForm(prev => ({ ...prev, alertLevel: e.target.value }))}
            >
              <MenuItem value="all">All Issues</MenuItem>
              <MenuItem value="warning">Warning & Above</MenuItem>
              <MenuItem value="unhealthy">Unhealthy Only</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={alertForm.forceAlert}
                onChange={(e) => setAlertForm(prev => ({ ...prev, forceAlert: e.target.checked }))}
              />
            }
            label="Force Alert (Send Regardless of Status)"
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
              <Alert severity={alertResults.alert_sent ? 'success' : 'info'}>
                Health alert {alertForm.dryRun ? 'would be' : 'was'} {alertResults.alert_sent ? 'sent' : 'not sent'}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendHealthAlert} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {alertForm.dryRun ? 'Preview' : 'Send'} Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailAdministration;
