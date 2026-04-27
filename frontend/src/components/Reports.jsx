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
  Filter as FilterIcon, Timeline as TimelineIcon,
  Delete as DeleteIcon, DeleteSweep as DeleteSweepIcon,
  InfoOutlined as InfoOutlinedIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { reportService } from '../services/api';
import InfoTooltip from './utils/InfoTooltip';
import { formatDateTimePH, formatDatePH } from '../utils/dateUtils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// Helper functions for report types
const getReportTypeColor = (type) => {
  switch (type) {
    case 'PATIENT_SUMMARY': return '#1976d2'; // Blue
    case 'VISIT_TRENDS': return '#0288d1'; // Light Blue
    case 'TREATMENT_OUTCOMES': return '#2e7d32'; // Green
    case 'MEDICAL_STATISTICS': return '#e64a19'; // Deep Orange
    case 'DENTAL_STATISTICS': return '#7b1fa2'; // Purple
    case 'FEEDBACK_ANALYSIS': return '#00796b'; // Teal
    case 'CAMPAIGN_PERFORMANCE': return '#303f9f'; // Indigo
    case 'USER_ACTIVITY': return '#455a64'; // Blue Grey
    case 'HEALTH_METRICS': return '#d32f2f'; // Red
    case 'MEDICAL_RECORDS': return '#2e7d32'; // Legacy Support
    case 'DENTAL_RECORDS': return '#7b1fa2'; // Legacy Support
    case 'ANALYTICS': return '#d32f2f'; // Legacy Support
    case 'COMPREHENSIVE': return '#5d4037'; // Legacy Support
    default: return '#616161';
  }
};

const getReportTypeIcon = (type) => {
  switch (type) {
    case 'PATIENT_SUMMARY': return '👤';
    case 'VISIT_TRENDS': return '📈';
    case 'TREATMENT_OUTCOMES': return '✅';
    case 'MEDICAL_STATISTICS': return '🩺';
    case 'DENTAL_STATISTICS': return '🦷';
    case 'FEEDBACK_ANALYSIS': return '💬';
    case 'CAMPAIGN_PERFORMANCE': return '📢';
    case 'USER_ACTIVITY': return '👥';
    case 'HEALTH_METRICS': return '🏥';
    case 'MEDICAL_RECORDS': return '🏥'; // Legacy Support
    case 'DENTAL_RECORDS': return '🦷'; // Legacy Support
    case 'ANALYTICS': return '📊'; // Legacy Support
    case 'COMPREHENSIVE': return '📋'; // Legacy Support
    default: return '📄';
  }
};

const Reports = () => {
  const [templates, setTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: '',
    date_range_start: null,
    date_range_end: null,
    export_format: 'PDF',
    filters: {}
  });
  const [dashboard, setDashboard] = useState(null);
  const [templateAnalytics, setTemplateAnalytics] = useState(null);
  const [systemAnalytics, setSystemAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: 'lastYear',
    clinic_type: 'all'
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === 2) {
      fetchSystemAnalytics();
    }
  }, [selectedTab, filters.dateRange, filters.clinic_type]);

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
      } else if (selectedTab === 2) {
        await fetchSystemAnalytics();
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      // Map dateRange to actual dates
      let date_start = null;
      const today = new Date();
      if (filters.dateRange === 'last30days') {
        date_start = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
      } else if (filters.dateRange === 'last90days') {
        date_start = new Date(today.setDate(today.getDate() - 90)).toISOString().split('T')[0];
      } else if (filters.dateRange === 'lastYear') {
        date_start = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
      }

      const params = {
        date_start,
        clinic_type: filters.clinic_type !== 'all' ? filters.clinic_type : undefined
      };

      const [systemRes, templateRes] = await Promise.all([
        reportService.getSystemAnalytics(params),
        reportService.getReportAnalytics()
      ]);
      
      setSystemAnalytics(systemRes.data);
      setTemplateAnalytics(templateRes.data.results || templateRes.data);
    } catch (err) {
      console.error('Error fetching system analytics:', err);
      setError('Failed to load visualizations');
    } finally {
      setAnalyticsLoading(false);
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
      if (!report) {
        setError('Report not found');
        return;
      }

      // Check if report is completed
      if (report.status !== 'COMPLETED') {
        setError(`Report is not ready for download. Status: ${report.status}`);
        return;
      }

      const exportFormat = format || report?.export_format || 'PDF';
      
      console.log('Downloading report:', { reportId, exportFormat, report });
      
      const response = await reportService.downloadReport(reportId);
      
      console.log('Download response:', {
        status: response.status,
        headers: response.headers,
        dataType: typeof response.data,
        dataSize: response.data?.size || response.data?.byteLength || 'unknown',
        contentType: response.headers['content-type']
      });
      
      // Additional debugging for blob responses
      if (response.data instanceof Blob) {
        console.log('Response is Blob:', {
          size: response.data.size,
          type: response.data.type
        });
      } else {
        console.log('Response data type unexpected:', typeof response.data);
      }
      
      // Check if response is valid
      if (!response.data) {
        setError('Downloaded file is empty - no data received');
        return;
      }
      
      // For Blob responses, check size
      if (response.data instanceof Blob && response.data.size === 0) {
        setError('Downloaded file is empty - blob size is 0');
        return;
      }

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
        case 'html':
          fileExtension = 'html';
          mimeType = 'text/html';
          break;
        case 'pdf':
        default:
          fileExtension = 'pdf';
          mimeType = 'application/pdf';
          break;
      }
      
      // Handle cases where server returned an error page instead of a file
      const respContentType = response.headers['content-type'] || '';
      let blob = new Blob([response.data], { type: mimeType });
      
      // Check for error responses from server
      if (respContentType.includes('text/html') || 
          (respContentType.includes('application/json') && exportFormat !== 'JSON')) {
        try {
          const text = await new Response(new Blob([response.data])).text();
          console.log('Checking for error response:', text.substring(0, 200));
          
          // Check if it looks like an error response (has "error" field)
          if (text && text.includes('"error"')) {
            try {
              const errorObj = JSON.parse(text);
              if (errorObj.error) {
                console.log('Detected server error response:', errorObj.error);
                setError(errorObj.error);
                return;
              }
            } catch (_) {
              // Not parseable JSON, show raw text
              console.log('Non-JSON error response detected');
              setError(text.substring(0, 400));
              return;
            }
          }
        } catch (parseError) {
          console.log('Error parsing response for error detection:', parseError);
          // fall through to download
        }
      }
      
      // Special check: if response status is 200 but data looks like an error
      if (response.status === 200 && response.data instanceof Blob) {
        try {
          const text = await new Response(response.data.slice(0, 1000)).text();
          if (text.includes('Unable to access report file') || text.includes('"error"')) {
            console.log('Detected error content in 200 response:', text.substring(0, 200));
            try {
              const errorObj = JSON.parse(text);
              setError(errorObj.error || text.substring(0, 400));
              return;
            } catch (_) {
              setError(text.substring(0, 400));
              return;
            }
          }
        } catch (_) {
          // Not text content, continue with download
        }
      }

      // Proceed with download
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
      console.error('Error downloading report:', err);
      let errorMessage = 'Failed to download report';
      
      if (err.response) {
        console.error('Error response:', err.response);
        errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
      } else if (err.request) {
        console.error('Error request:', err.request);
        errorMessage = 'Network error - unable to reach server';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
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

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    try {
      await reportService.deleteReport(reportToDelete.id);
      setSuccess('Report deleted successfully');
      setDeleteDialogOpen(false);
      setReportToDelete(null);
      fetchData();
    } catch (err) {
      setError('Failed to delete report');
      console.error('Error deleting report:', err);
    }
  };

  const handleDeleteAllReports = async () => {
    try {
      await reportService.deleteAllReports();
      setSuccess('All reports deleted successfully');
      setDeleteAllDialogOpen(false);
      fetchData();
    } catch (err) {
      setError('Failed to delete all reports');
      console.error('Error deleting all reports:', err);
    }
  };

  const renderAnalyticsTab = () => {
    if (analyticsLoading && !systemAnalytics) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    if (!systemAnalytics) return null;

    const topDiagnosesData = {
      labels: systemAnalytics.clinical?.top_diagnoses?.map(d => d.name) || [],
      datasets: [{
        label: 'Medical Cases',
        data: systemAnalytics.clinical?.top_diagnoses?.map(d => d.case_count) || [],
        backgroundColor: 'rgba(25, 118, 210, 0.7)',
        borderRadius: 4,
      }]
    };
    
    const topProceduresData = {
      labels: systemAnalytics.clinical?.top_procedures?.map(d => d.name) || [],
      datasets: [{
        label: 'Dental Procedures',
        data: systemAnalytics.clinical?.top_procedures?.map(d => d.count) || [],
        backgroundColor: 'rgba(123, 31, 162, 0.7)',
        borderRadius: 4,
      }]
    };

    const peakHoursData = {
      labels: systemAnalytics.operations?.peak_hours?.map(h => `${h.hour}:00`) || [],
      datasets: [{
        label: 'Total Visits',
        data: systemAnalytics.operations?.peak_hours?.map(h => h.count) || [],
        backgroundColor: 'rgba(255, 152, 0, 0.7)',
        borderColor: 'rgba(255, 152, 0, 1)',
        borderWidth: 1,
      }]
    };

    return (
      <Box>
        {/* Print Only Header */}
        <Box className="print-header">
          <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
            System Analytics & Visualizations Report
          </Typography>
          <Typography variant="subtitle1">
            USC Clinic Patient Information System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generated on: {new Date().toLocaleString()} • Filter: {filters.dateRange} / {filters.clinic_type}
          </Typography>
        </Box>

        {/* Analytics Filters & Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} lg={6}>
            <Card sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Filters</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Period</InputLabel>
                    <Select
                      value={filters.dateRange}
                      label="Period"
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    >
                      <MenuItem value="last30days">Last 30 Days</MenuItem>
                      <MenuItem value="last90days">Last 90 Days</MenuItem>
                      <MenuItem value="lastYear">Last Year</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Clinic Type</InputLabel>
                    <Select
                      value={filters.clinic_type}
                      label="Clinic Type"
                      onChange={(e) => setFilters(prev => ({ ...prev, clinic_type: e.target.value }))}
                    >
                      <MenuItem value="all">All Clinics</MenuItem>
                      <MenuItem value="medical">Medical Only</MenuItem>
                      <MenuItem value="dental">Dental Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      startIcon={<RefreshIcon />}
                      onClick={fetchSystemAnalytics}
                      disabled={analyticsLoading}
                    >
                      Refresh
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={6} lg={3}>
            <Card sx={{ p: 2, height: '100%', textAlign: 'center', borderLeft: '4px solid #1976d2' }}>
              <Typography variant="subtitle2" color="text.secondary">Medical Visits</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', my: 1 }}>
                {systemAnalytics.visits?.types?.medical || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total for Period</Typography>
            </Card>
          </Grid>

          <Grid item xs={6} lg={3}>
            <Card sx={{ p: 2, height: '100%', textAlign: 'center', borderLeft: '4px solid #7b1fa2' }}>
              <Typography variant="subtitle2" color="text.secondary">Dental Visits</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#7b1fa2', my: 1 }}>
                {systemAnalytics.visits?.types?.dental || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total for Period</Typography>
            </Card>
          </Grid>
        </Grid>

        <Box className="print-container">
          <Grid container spacing={3}>
            {/* Top Diagnoses */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Top 5 Diagnoses (Medical)</Typography>
                    <ReportIcon color="primary" />
                  </Box>
                  <Box sx={{ height: 350 }}>
                    {topDiagnosesData.labels.length > 0 ? (
                      <Bar 
                        data={topDiagnosesData} 
                        options={{ 
                          responsive: true, 
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: { 
                            legend: { display: false },
                            tooltip: { backgroundColor: 'rgba(0,0,0,0.8)' }
                          },
                          scales: {
                            x: { beginAtZero: true, grid: { display: false } },
                            y: { grid: { display: false } }
                          }
                        }} 
                      />
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">No clinical data for this period</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Procedures */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Top 5 Procedures (Dental)</Typography>
                    <ReportIcon sx={{ color: '#7b1fa2' }} />
                  </Box>
                  <Box sx={{ height: 350 }}>
                    {topProceduresData.labels.length > 0 ? (
                      <Bar 
                        data={topProceduresData} 
                        options={{ 
                          responsive: true, 
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: { 
                            legend: { display: false },
                            tooltip: { backgroundColor: 'rgba(0,0,0,0.8)' }
                          },
                          scales: {
                            x: { beginAtZero: true, grid: { display: false } },
                            y: { grid: { display: false } }
                          }
                        }} 
                      />
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">No clinical data for this period</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Peak Hours */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Peak Clinic Hours Distribution</Typography>
                    <ScheduleIcon sx={{ color: '#ff9800' }} />
                  </Box>
                  <Box sx={{ height: 300 }}>
                    {peakHoursData.labels.length > 0 ? (
                      <Bar 
                        data={peakHoursData} 
                        options={{ 
                          responsive: true, 
                          maintainAspectRatio: false,
                          plugins: { 
                            legend: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true, title: { display: true, text: 'Number of Visits' } },
                            x: { title: { display: true, text: 'Hour of Day' } }
                          }
                        }} 
                      />
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">No operational data available</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Report Template Analytics */}
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center">
                    <AnalyticsIcon sx={{ mr: 1, color: '#1976d2' }} />
                    <Typography sx={{ fontWeight: 600 }}>Detailed Report Template Usage</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {templateAnalytics && templateAnalytics.length > 0 ? (
                    <Grid container spacing={2}>
                      {templateAnalytics.map(stat => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={stat.id}>
                          <Paper variant="outlined" sx={{ p: 2, borderTop: '4px solid #1976d2' }}>
                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>{stat.template_name}</Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption">Total Generated:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{stat.total_generations}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption">Total Downloads:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{stat.total_downloads}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Typography variant="caption">Last Used:</Typography>
                              <Typography variant="caption" color="primary">{formatDatePH(stat.last_calculated)}</Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        No usage statistics recorded for this period yet.
                      </Typography>
                      <Typography variant="caption" display="block">
                        Analytics are updated automatically as reports are generated and downloaded.
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
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
      case 'HTML': return <ViewIcon />;
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
          <Box display="flex" alignItems="center">
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Reports
            </Typography>
            <InfoTooltip title="Generate and export system reports. Choose a template, set filters, then export or view details." />
          </Box>
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
          </Box>
        </Box>

        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Report Templates" />
          <Tab label="My Reports" />
          <Tab label="Analytics & Visualizations" />
        </Tabs>

        {selectedTab === 0 && (
          <Grid container spacing={3}>
            {templates.map((template) => (
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
            ))}
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
                  color="error"
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => setDeleteAllDialogOpen(true)}
                  disabled={reports.length === 0}
                >
                  Delete All
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

            <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
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
                          <Typography variant="h6" sx={{ mr: 1, fontSize: '1.2rem' }}>
                            {getReportTypeIcon(report.report_type)}
                          </Typography>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {report.template_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: getReportTypeColor(report.report_type) }}>
                              {report.report_type?.replace('_', ' ')}
                            </Typography>
                          </Box>
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
                              timeStyle: 'short'
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
                          )}
                          
                          <Tooltip title="Delete Report">
                            <IconButton
                              onClick={() => {
                                setReportToDelete(report);
                                setDeleteDialogOpen(true);
                              }}
                              size="small"
                              sx={{ 
                                color: '#d32f2f',
                                '&:hover': { backgroundColor: '#ffebee' }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          
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

        {selectedTab === 2 && renderAnalyticsTab()}

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
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <InputLabel id="export-format-label">Export Format</InputLabel>
                        <Tooltip title="PDF reports are formatted summaries (limited to 200 items per section). Excel/CSV formats provide the full dataset for advanced analysis.">
                          <IconButton size="small" sx={{ ml: 4, mt: -1 }}>
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Select
                        labelId="export-format-label"
                        value={reportForm.export_format}
                        label="Export Format"
                        onChange={(e) => setReportForm(prev => ({ ...prev, export_format: e.target.value }))}
                      >
                        <MenuItem value="PDF">PDF Document</MenuItem>
                        <MenuItem value="EXCEL">Excel Spreadsheet</MenuItem>
                        <MenuItem value="CSV">CSV File</MenuItem>
                        <MenuItem value="JSON">JSON Data</MenuItem>
                        <MenuItem value="HTML">HTML Report</MenuItem>
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

        {/* Delete Single Report Confirmation */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Report</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the report <strong>"{reportToDelete?.title}"</strong>? 
              This action cannot be undone and the file will be permanently removed.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteReport} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete All Reports Confirmation */}
        <Dialog
          open={deleteAllDialogOpen}
          onClose={() => setDeleteAllDialogOpen(false)}
        >
          <DialogTitle>Delete All Reports</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>ALL</strong> generated reports? 
              This will remove all files for your account. This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteAllReports} color="error" variant="contained">
              Delete All
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
