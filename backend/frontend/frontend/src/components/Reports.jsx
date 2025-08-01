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
import { formatDateTimePH, formatDatePH } from '../utils/dateUtils';

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

  const handleDownloadReport = async (reportId, format = null) => {
    try {
      // Find the report to get its format and title
      const report = reports.find(r => r.id === reportId);
      const exportFormat = format || report?.export_format || 'PDF';
      
      const response = await reportService.downloadReport(reportId);
      
      // Determine file extension and MIME type based on format
      let fileExtension, mimeType;
      switch (exportFormat.toLowerCase()) {
        case 'csv':
          fileExtension = 'csv';
          mimeType = 'text/csv';
          break;
        case 'excel':
        case 'xlsx':
          fileExtension = 'xlsx';
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'json':
          fileExtension = 'json';
          mimeType = 'application/json';
          break;
        case 'pdf':
        default:
          fileExtension = 'pdf';
          mimeType = 'application/pdf';
          break;
      }
      
      // Handle download with correct format
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with report title and current date
      const reportTitle = report?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'report';
      const currentDate = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${reportTitle}_${currentDate}.${fileExtension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(`Report downloaded successfully as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      setError(`Failed to download report in ${format || 'PDF'} format`);
      console.error('Error downloading report:', err);
    }
  };

  // Enhanced export functions for different formats
  const handleExportReportAs = async (reportId, format) => {
    try {
      // Find the report
      const report = reports.find(r => r.id === reportId);
      if (!report) {
        setError('Report not found');
        return;
      }

      if (report.status !== 'COMPLETED') {
        setError('Report must be completed before export');
        return;
      }

      // If it's already in the requested format, just download
      if (report.export_format?.toLowerCase() === format.toLowerCase()) {
        return handleDownloadReport(reportId, format);
      }

      // Otherwise, generate new report in requested format
      const selectedTemplateData = templates.find(t => t.id === report.template_id);
      if (!selectedTemplateData) {
        setError('Report template not found');
        return;
      }

      const response = await reportService.generateReport(selectedTemplateData.id, {
        title: `${report.title} (${format.toUpperCase()})`,
        date_range_start: report.date_range_start,
        date_range_end: report.date_range_end,
        export_format: format.toUpperCase(),
        filters: report.filters || {},
        template_id: selectedTemplateData.id
      });

      setSuccess(`${format.toUpperCase()} export started! Check My Reports tab for download.`);
      fetchData(); // Refresh reports list
    } catch (err) {
      setError(`Failed to export report as ${format.toUpperCase()}`);
      console.error('Error exporting report:', err);
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
            {templates.map((template) => {
              const getReportTypeColor = (type) => {
                switch (type) {
                  case 'PATIENT_SUMMARY': return '#1976d2';
                  case 'MEDICAL_RECORDS': return '#2e7d32';
                  case 'DENTAL_RECORDS': return '#7b1fa2';
                  case 'FINANCIAL': return '#f57c00';
                  case 'ANALYTICS': return '#d32f2f';
                  case 'COMPREHENSIVE': return '#5d4037';
                  default: return '#616161';
                }
              };

              const getReportTypeIcon = (type) => {
                switch (type) {
                  case 'PATIENT_SUMMARY': return '👤';
                  case 'MEDICAL_RECORDS': return '🏥';
                  case 'DENTAL_RECORDS': return '🦷';
                  case 'FINANCIAL': return '💰';
                  case 'ANALYTICS': return '📊';
                  case 'COMPREHENSIVE': return '📋';
                  default: return '📄';
                }
              };

              return (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: '1px solid #e0e0e0',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      borderColor: getReportTypeColor(template.report_type)
                    }
                  }}>
                    <Box sx={{ 
                      background: `linear-gradient(135deg, ${getReportTypeColor(template.report_type)}22 0%, ${getReportTypeColor(template.report_type)}11 100%)`,
                      p: 2,
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h3" sx={{ mr: 1 }}>
                          {getReportTypeIcon(template.report_type)}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: getReportTypeColor(template.report_type) }}>
                          {template.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={template.report_type.replace('_', ' ')}
                        size="small"
                        sx={{ 
                          backgroundColor: getReportTypeColor(template.report_type),
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                      <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.6 }}>
                        {template.description}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            📈 Usage:
                          </Typography>
                          <Chip
                            label={`${template.generation_count || 0} times`}
                            size="small"
                            variant="outlined"
                            color={template.generation_count > 10 ? 'success' : template.generation_count > 5 ? 'warning' : 'default'}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            ⏱️ Est. Time:
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: getReportTypeColor(template.report_type),
                            fontWeight: 500 
                          }}>
                            {template.estimated_duration || '2-5 min'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            📄 Formats:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip label="PDF" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                            <Chip label="Excel" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, color: '#0d7c34' }} />
                            <Chip label="CSV" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                    
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setReportForm(prev => ({ 
                            ...prev, 
                            title: `${template.name} - ${new Date().toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}` 
                          }));
                          setGenerateDialogOpen(true);
                        }}
                        sx={{ 
                          backgroundColor: getReportTypeColor(template.report_type),
                          '&:hover': {
                            backgroundColor: getReportTypeColor(template.report_type) + 'dd',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          },
                          transition: 'all 0.2s ease',
                          fontWeight: 600,
                          borderRadius: 2
                        }}
                      >
                        Generate Report
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {selectedTab === 1 && (
          <Box>
            {/* Enhanced My Reports Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                📊 My Generated Reports ({reports.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterIcon />}
                  onClick={() => {/* Add filter functionality */}}
                >
                  Filter
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchData}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>📋 Report Details</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>📊 Template</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>⚡ Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>📄 Format & Size</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>📅 Timeline</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>🎯 Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report, index) => (
                    <TableRow 
                      key={report.id}
                      sx={{ 
                        '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {report.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Report #{report.id} • Generated {index + 1} of {reports.length}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {report.template_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Chip
                            label={report.status}
                            color={getStatusColor(report.status)}
                            size="small"
                            sx={{ 
                              fontWeight: 500,
                              minWidth: 80,
                              '& .MuiChip-label': { fontSize: '0.75rem' }
                            }}
                          />
                          {report.status === 'GENERATING' && (
                            <Box sx={{ mt: 1, width: '100%' }}>
                              <LinearProgress
                                variant="determinate"
                                value={report.progress_percentage || 0}
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3,
                                  backgroundColor: 'rgba(0,0,0,0.08)',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                  }
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                {report.progress_percentage || 0}% complete • Est. {Math.ceil((100 - (report.progress_percentage || 0)) / 20)} min remaining
                              </Typography>
                            </Box>
                          )}
                          {report.status === 'FAILED' && (
                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                              ⚠️ Generation failed - Click retry
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            {getFormatIcon(report.export_format)}
                            <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
                              {report.export_format}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {report.file_size ? `${(report.file_size / 1024).toFixed(1)} KB` : 'Size calculating...'}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatDatePH(report.created_at)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTimePH(report.created_at, { 
                              timeStyle: 'short',
                              dateStyle: undefined,
                              year: undefined,
                              month: undefined,
                              day: undefined 
                            })}
                          </Typography>
                          {report.status === 'GENERATING' && (
                            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                              ⏳ Processing...
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {report.status === 'COMPLETED' && (
                            <>
                              <Tooltip title="Download Report (Original Format)">
                                <IconButton
                                  onClick={() => handleDownloadReport(report.id)}
                                  size="small"
                                  sx={{ 
                                    color: '#1976d2',
                                    '&:hover': { backgroundColor: '#e3f2fd' }
                                  }}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Export as CSV">
                                <IconButton
                                  onClick={() => handleExportReportAs(report.id, 'csv')}
                                  size="small"
                                  sx={{ 
                                    color: '#2e7d32',
                                    '&:hover': { backgroundColor: '#e8f5e9' }
                                  }}
                                >
                                  <CsvIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Export as Excel">
                                <IconButton
                                  onClick={() => handleExportReportAs(report.id, 'excel')}
                                  size="small"
                                  sx={{ 
                                    color: '#0d7c34',
                                    '&:hover': { backgroundColor: '#e8f4e8' }
                                  }}
                                >
                                  <ExcelIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Export as JSON">
                                <IconButton
                                  onClick={() => handleExportReportAs(report.id, 'json')}
                                  size="small"
                                  sx={{ 
                                    color: '#7b1fa2',
                                    '&:hover': { backgroundColor: '#f3e5f5' }
                                  }}
                                >
                                  <JsonIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="View Report Details">
                                <IconButton
                                  onClick={() => {/* Add view functionality */}}
                                  size="small"
                                  sx={{ 
                                    color: '#f57c00',
                                    '&:hover': { backgroundColor: '#fff3e0' }
                                  }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          
                          {report.status === 'FAILED' && (
                            <Tooltip title="Retry Generation">
                              <IconButton
                                onClick={() => {
                                  setSelectedTemplate({ id: report.template_id, name: report.template_name });
                                  setReportForm(prev => ({ ...prev, title: report.title }));
                                  setGenerateDialogOpen(true);
                                }}
                                size="small"
                                sx={{ 
                                  color: '#d32f2f',
                                  '&:hover': { backgroundColor: '#ffebee' }
                                }}
                              >
                                <RefreshIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {reports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Box>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            📝 No Reports Generated Yet
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Start by generating your first report from the Templates tab
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={() => setSelectedTab(0)}
                            sx={{ mt: 2 }}
                          >
                            Browse Templates
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
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
                              {formatDatePH(trend.date, { month: 'short', day: 'numeric' })}
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