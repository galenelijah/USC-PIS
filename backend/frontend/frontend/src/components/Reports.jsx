import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, CircularProgress, Alert, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, LinearProgress, IconButton, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, GetApp as DownloadIcon, Visibility as ViewIcon,
  Assessment as ReportIcon, PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon, InsertDriveFile as CsvIcon,
  DataObject as JsonIcon, Schedule as ScheduleIcon,
  Bookmark as BookmarkIcon, Analytics as AnalyticsIcon
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

  useEffect(() => {
    fetchData();
  }, [selectedTab]);

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

        {/* Dashboard Cards */}
        {dashboard && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <ReportIcon color="primary" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{dashboard.total_reports}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Reports
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <AnalyticsIcon color="success" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{dashboard.reports_this_month}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        This Month
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{dashboard.pending_reports}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ color: 'error.main', mr: 1 }}>⚠</Box>
                    <Box>
                      <Typography variant="h6">{dashboard.failed_reports}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Failed
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Report Templates" />
          <Tab label="My Reports" />
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
                        <LinearProgress
                          variant="determinate"
                          value={report.progress_percentage}
                          sx={{ mt: 1 }}
                        />
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