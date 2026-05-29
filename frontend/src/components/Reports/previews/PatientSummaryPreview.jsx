import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip
} from '@mui/material';
import { 
  People as PeopleIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import { Pie, Bar } from 'react-chartjs-2';
import { reportService } from '../../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const PatientSummaryPreview = ({ dateRange, customStart, customEnd }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [yearLevelFilter, setYearLevelFilter] = useState('all');

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Patient Summary Report - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range_start: dateRange === 'custom' ? customStart : undefined,
        date_range_end: dateRange === 'custom' ? customEnd : undefined,
        filters: {
          school: schoolFilter !== 'all' ? schoolFilter : undefined,
          year_level: yearLevelFilter !== 'all' ? yearLevelFilter : undefined
        }
      };

      const response = await reportService.generateReport(1, payload); // Template ID 1
      setSuccess(`Report generation started! ID: ${response.data.report_id}`);
      
      setTimeout(() => {
        setOpenModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setError("Failed to trigger report generation.");
    } finally {
      setGenerating(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        date_start: dateRange === 'custom' ? customStart : undefined,
        date_end: dateRange === 'custom' ? customEnd : undefined,
        // We'll map global date range strings to dates on the backend or pass them here
      };

      // Handle predefined ranges
      if (dateRange !== 'custom' && dateRange !== 'all') {
         // Logic handled by backend if date_start/end are missing or we could calculate here
      }

      const response = await reportService.getDashboardAnalytics(params);
      setData(response.data);
    } catch (err) {
      console.error("Failed fetching patient demographics:", err);
      setError("Failed to load patient summary data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customStart, customEnd]);

  const generatePieData = () => {
    if (!data?.demographics?.colleges) return { labels: [], datasets: [] };
    
    const colleges = data.demographics.colleges;
    return {
      labels: colleges.map(c => c.college || 'Other'),
      datasets: [
        {
          data: colleges.map(c => c.count),
          backgroundColor: [
            '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', 
            '#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 12, font: { size: 10 } }
      }
    }
  };

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <PeopleIcon sx={{ color: '#1e88e5', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e88e5', fontSize: '1.1rem' }}>
                Patient Demographics
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#1e88e5', '&:hover': { bgcolor: '#1565c0' }, textTransform: 'none', borderRadius: '8px' }}
              >
                Full Summary
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress color="primary" />
            ) : data?.demographics?.colleges?.length > 0 ? (
              <Pie data={generatePieData()} options={pieOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No demographic data available for this period.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold" color="primary">Comprehensive Patient Summary</Typography>
          <IconButton onClick={() => setOpenModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
           {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
           {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
           <Alert severity="info" sx={{ mb: 2 }}>
             Aggregate overview of patient distribution across campuses and academic levels.
           </Alert>
           
           <Grid container spacing={2} sx={{ mb: 3 }}>
             <Grid item xs={12} sm={6}>
               <FormControl fullWidth size="small">
                 <InputLabel>Filter by Campus</InputLabel>
                 <Select value={schoolFilter} label="Filter by Campus" onChange={(e) => setSchoolFilter(e.target.value)}>
                   <MenuItem value="all">All Campuses</MenuItem>
                   <MenuItem value="Talamban">Talamban Campus</MenuItem>
                   <MenuItem value="Downtown">Downtown Campus</MenuItem>
                 </Select>
               </FormControl>
             </Grid>
             <Grid item xs={12} sm={6}>
               <FormControl fullWidth size="small">
                 <InputLabel>Year Level</InputLabel>
                 <Select value={yearLevelFilter} label="Year Level" onChange={(e) => setYearLevelFilter(e.target.value)}>
                   <MenuItem value="all">All Levels</MenuItem>
                   <MenuItem value="1">1st Year</MenuItem>
                   <MenuItem value="2">2nd Year</MenuItem>
                   <MenuItem value="3">3rd Year</MenuItem>
                   <MenuItem value="4">4th Year</MenuItem>
                   <MenuItem value="5">5th Year+</MenuItem>
                 </Select>
               </FormControl>
             </Grid>
           </Grid>

           <TableContainer component={Paper} variant="outlined">
             <Table size="small">
               <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                 <TableRow>
                   <TableCell><strong>Department/College</strong></TableCell>
                   <TableCell align="right"><strong>Count</strong></TableCell>
                   <TableCell align="right"><strong>Percentage</strong></TableCell>
                 </TableRow>
               </TableHead>
               <TableBody>
                 {data?.demographics?.colleges?.map((row, idx) => (
                   <TableRow key={idx}>
                     <TableCell>{row.college || 'Other'}</TableCell>
                     <TableCell align="right">{row.count}</TableCell>
                     <TableCell align="right">{((row.count / data.demographics.total_active) * 100).toFixed(1)}%</TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={() => handleGenerateReport('EXCEL')}
              disabled={generating}
              size="small"
              sx={{ borderRadius: '8px' }}
            >
              Excel
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleGenerateReport('CSV')}
              disabled={generating}
              size="small"
              sx={{ borderRadius: '8px' }}
            >
              CSV
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleGenerateReport('PDF')}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              sx={{ borderRadius: '8px', px: 3 }}
            >
              {generating ? 'Processing...' : 'Generate PDF Report'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientSummaryPreview;