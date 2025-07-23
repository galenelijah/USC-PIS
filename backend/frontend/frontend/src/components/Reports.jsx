import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, CircularProgress, Alert, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, LinearProgress, IconButton, Tooltip,
  Accordion, AccordionSummary, AccordionDetails,
  Switch, FormControlLabel, Divider, Badge
} from '@mui/material';
import {
  Add as AddIcon, GetApp as DownloadIcon, Visibility as ViewIcon,
  Assessment as ReportIcon, PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon, InsertDriveFile as CsvIcon,
  DataObject as JsonIcon, Schedule as ScheduleIcon,
  Bookmark as BookmarkIcon, Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon, Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  Filter as FilterIcon, Timeline as TimelineIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { reportService } from '../services/api';

const Reports = () => {
  const [templates, setTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: '',
    date_range_start: null,
    date_range_end: null,
    export_format: 'PDF',
    filters: {}
  });
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    reportType: 'all',
    status: 'all'
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [selectedTab]);

  useEffect(() => {
    if (realTimeUpdates) {
      intervalRef.current = setInterval(fetchReportStatuses, 5000); // Update every 5 seconds
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [realTimeUpdates, reports]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (selectedTab === 0) {
        const [templatesRes, reportsRes, dashboardRes] = await Promise.all([
          reportService.getTemplates(),
          reportService.getReports(),
          reportService.getDashboard()
        ]);
        setTemplates(templatesRes.data.results || templatesRes.data);
        setReports(reportsRes.data.results || reportsRes.data);
        setDashboard(dashboardRes.data);
      } else if (selectedTab === 1) {
        const reportsRes = await reportService.getReports();
        setReports(reportsRes.data.results || reportsRes.data);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await reportService.generateReport(selectedTemplate.id, {
        ...reportForm,
        template_id: selectedTemplate.id
      });
      setSuccess('Report generation started!');
      setGenerateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError('Failed to generate report');
      console.error('Error generating report:', err);
    }
  };

  const fetchReportStatuses = useCallback(async () => {
    try {
      // Only fetch if we have pending or generating reports
      const pendingReports = reports.filter(r => 
        r.status === 'PENDING' || r.status === 'GENERATING'
      );
      
      if (pendingReports.length === 0) return;

      const statusUpdates = await Promise.all(
        pendingReports.map(report => 
          reportService.getReportStatus(report.id)
        )
      );

      setReports(prevReports => 
        prevReports.map(report => {
          const statusUpdate = statusUpdates.find(su => 
            su.data && Object.keys(su.data).includes('status')
          );
          
          if (statusUpdate && (report.status === 'PENDING' || report.status === 'GENERATING')) {
            return { ...report, ...statusUpdate.data };
          }
          
          return report;
        })
      );
    } catch (err) {
      console.error('Error fetching report statuses:', err);
    }
  }, [reports]);

  const fetchAnalytics = async () => {
    try {
      const analyticsRes = await reportService.getReportAnalytics();
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const response = await reportService.downloadReport(reportId);
      // Handle download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download report');
      console.error('Error downloading report:', err);
    }
  };

  const resetForm = () => {
    setReportForm({
      title: '',
      date_range_start: null,
      date_range_end: null,
      export_format: 'PDF',
      filters: {}
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'GENERATING': return 'info';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'error';
      default: return 'default';
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'PDF': return <PdfIcon />;
      case 'EXCEL': return <ExcelIcon />;
      case 'CSV': return <CsvIcon />;
      case 'JSON': return <JsonIcon />;
      default: return <ReportIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Reports
          </Typography>
        </Box>

        {/* Enhanced Dashboard Cards */}
        {dashboard && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {dashboard.total_reports}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Reports
                      </Typography>
                    </Box>
                    <ReportIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white'
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {dashboard.reports_this_month}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        This Month
                      </Typography>
                      <Box display="flex" alignItems="center" mt={0.5}>
                        <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption">
                          +12% vs last month
                        </Typography>
                      </Box>
                    </Box>
                    <TimelineIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: dashboard.pending_reports > 0 
                  ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                  : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white'
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {dashboard.pending_reports}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {realTimeUpdates ? 'Live Updates On' : 'Pending'}
                      </Typography>
                      {dashboard.pending_reports > 0 && (
                        <Box display="flex" alignItems="center" mt={0.5}>
                          <CircularProgress size={12} sx={{ color: 'white', mr: 0.5 }} />
                          <Typography variant="caption">
                            Processing...
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Badge badgeContent={dashboard.pending_reports} color="error">
                      <AnalyticsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Badge>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: dashboard.failed_reports > 0
                  ? 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)'
                  : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                color: dashboard.failed_reports > 0 ? 'white' : 'text.primary'
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {dashboard.failed_reports}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Failed Reports
                      </Typography>
                      {dashboard.failed_reports === 0 && (
                        <Typography variant="caption" color="success.main">
                          All systems operational
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ position: 'relative' }}>
                      {dashboard.failed_reports > 0 ? '⚠️' : '✅'}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Real-time Controls */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeUpdates}
                onChange={(e) => setRealTimeUpdates(e.target.checked)}
                color="primary"
              />
            }
            label="Real-time Updates"
          />
          <Box>
            <IconButton onClick={fetchData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={fetchAnalytics}>
              <AnalyticsIcon />
            </IconButton>
          </Box>
        </Box>

        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Report Templates" />
          <Tab label="My Reports" />
          <Tab label="Analytics" />
        </Tabs>

        {selectedTab === 0 && (
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {template.description}
                    </Typography>
                    <Chip
                      label={template.report_type.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" display="block">
                      Generated {template.generation_count} times
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setReportForm(prev => ({ ...prev, title: `${template.name} - ${new Date().toLocaleDateString()}` }));
                        setGenerateDialogOpen(true);
                      }}
                    >
                      Generate Report
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {selectedTab === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>{report.template_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        color={getStatusColor(report.status)}
                        size="small"
                      />
                      {report.status === 'GENERATING' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={report.progress_percentage || 0}
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {report.progress_percentage || 0}% complete
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getFormatIcon(report.export_format)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {report.export_format}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(report.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {report.status === 'COMPLETED' && (
                        <Tooltip title="Download Report">
                          <IconButton
                            onClick={() => handleDownloadReport(report.id)}
                            size="small"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {selectedTab === 2 && (
          <Box>
            {analytics ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        System Analytics Overview
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Comprehensive insights into reporting system performance and usage patterns.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Usage Analytics */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">Usage Statistics</Typography>
                      </Box>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">Total Generations</Typography>
                        <Typography variant="h4" color="primary">{analytics.total_generations || 0}</Typography>
                      </Box>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">Total Downloads</Typography>
                        <Typography variant="h4" color="success.main">{analytics.total_downloads || 0}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                        <Typography variant="h4" color="info.main">{analytics.success_rate || 0}%</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Format Distribution */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">Popular Formats</Typography>
                      </Box>
                      {dashboard && dashboard.format_distribution && Object.entries(dashboard.format_distribution).map(([format, count]) => (
                        <Box key={format} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Box display="flex" alignItems="center">
                            {getFormatIcon(format)}
                            <Typography variant="body2" sx={{ ml: 1 }}>{format}</Typography>
                          </Box>
                          <Chip label={count} size="small" color="primary" variant="outlined" />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Generation Trends */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <TimelineIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">Generation Trends (Last 30 Days)</Typography>
                      </Box>
                      <Box sx={{ height: 200, display: 'flex', alignItems: 'end', justifyContent: 'space-around' }}>
                        {dashboard && dashboard.generation_trends && dashboard.generation_trends.slice(0, 10).map((trend, index) => (
                          <Box key={index} display="flex" flexDirection="column" alignItems="center">
                            <Box 
                              sx={{ 
                                height: `${Math.max(10, (trend.reports / Math.max(...dashboard.generation_trends.map(t => t.reports))) * 150)}px`,
                                width: 20,
                                backgroundColor: 'primary.main',
                                borderRadius: 1,
                                mb: 1
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Typography>
                            <Typography variant="caption" color="primary">
                              {trend.reports}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Storage Usage */}
                {dashboard && dashboard.storage_usage && (
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Box sx={{ color: 'info.main', mr: 1 }}>💾</Box>
                          <Typography variant="h6">Storage Usage</Typography>
                        </Box>
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary">Total Size</Typography>
                          <Typography variant="h4" color="info.main">
                            {dashboard.storage_usage.total_size_formatted}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Across {dashboard.storage_usage.report_count} reports
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Popular Templates */}
                {dashboard && dashboard.popular_templates && (
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <BookmarkIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">Popular Templates</Typography>
                        </Box>
                        {dashboard.popular_templates.slice(0, 5).map((template, index) => (
                          <Box key={template.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2">{template.name}</Typography>
                            <Chip 
                              label={`${template.generation_count || 0} uses`} 
                              size="small" 
                              color={index === 0 ? "primary" : "default"}
                              variant={index === 0 ? "filled" : "outlined"}
                            />
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" p={4}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1">Loading analytics...</Typography>
                <Button variant="outlined" onClick={fetchAnalytics} sx={{ mt: 2 }}>
                  Load Analytics
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Generate Report Dialog */}
        <Dialog
          open={generateDialogOpen}
          onClose={() => setGenerateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Generate Report</DialogTitle>
          <DialogContent>
            {selectedTemplate && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedTemplate.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedTemplate.description}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Report Title"
                      value={reportForm.title}
                      onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Start Date"
                      value={reportForm.date_range_start}
                      onChange={(newValue) => setReportForm(prev => ({ ...prev, date_range_start: newValue }))}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="End Date"
                      value={reportForm.date_range_end}
                      onChange={(newValue) => setReportForm(prev => ({ ...prev, date_range_end: newValue }))}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Export Format</InputLabel>
                      <Select
                        value={reportForm.export_format}
                        onChange={(e) => setReportForm(prev => ({ ...prev, export_format: e.target.value }))}
                      >
                        <MenuItem value="PDF">PDF Document</MenuItem>
                        <MenuItem value="EXCEL">Excel Spreadsheet</MenuItem>
                        <MenuItem value="CSV">CSV File</MenuItem>
                        <MenuItem value="JSON">JSON Data</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleGenerateReport}>
              Generate Report
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for messages */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>
        
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
        >
          <Alert onClose={() => setSuccess('')} severity="success">
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports; 