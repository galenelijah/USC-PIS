import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Divider, InputAdornment, Tooltip as MuiTooltip
} from '@mui/material';
import { 
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  Speed as SpeedIcon,
  Today as TodayIcon,
  QueryBuilder as ClockIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { Bar, Line } from 'react-chartjs-2';
import { reportService } from '../../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const OperationsPreview = ({ dateRange, customStart, customEnd }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Workshop Modal Internal Independent Filtering Controls
  const [openModal, setOpenModal] = useState(false);
  const [modalDateRange, setModalDateRange] = useState('30days'); 
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');

  // Domain Specific Filters (Operations Dimensions)
  const [serviceType, setServiceType] = useState('all'); // 'all', 'medical', 'dental'
  const [workloadClass, setWorkloadClass] = useState('all'); // 'all', 'peak', 'moderate', 'low'
  const [searchQuery, setSearchQuery] = useState('');

  const [sortField, setSortField] = useState('hour');
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchAnalytics = async (isModal = false) => {
    try {
      if (!isModal) setLoading(true);
      setError(null);
      
      const params = {
        date_start: isModal ? (modalDateRange === 'custom' ? modalStartDate : undefined) : (dateRange === 'custom' ? customStart : undefined),
        date_end: isModal ? (modalDateRange === 'custom' ? modalEndDate : undefined) : (dateRange === 'custom' ? customEnd : undefined),
        date_range: isModal ? modalDateRange : dateRange,
      };

      if (isModal) {
        if (serviceType !== 'all') params.service_type = serviceType;
        if (workloadClass !== 'all') params.workload_class = workloadClass;
      }

      const response = await reportService.getDashboardAnalytics(params);
      setData(response.data);
    } catch (err) {
      console.error("Failed fetching operational stats:", err);
      setError("Failed to load operational efficiency data.");
    } finally {
      if (!isModal) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(false);
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    if (openModal) {
      fetchAnalytics(true);
    }
  }, [openModal, modalDateRange, modalStartDate, modalEndDate, serviceType, workloadClass]);

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Operational Efficiency Analysis - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          service_type: serviceType !== 'all' ? serviceType : undefined,
          workload_class: workloadClass !== 'all' ? workloadClass : undefined
        }
      };

      const response = await reportService.generateReport(8, payload); // Template ID 8: User Activity/Operations
      setSuccess(`Report generation started! ID: ${response.data.report_id}`);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setError("Failed to trigger report generation.");
    } finally {
      setGenerating(false);
    }
  };

  const getWorkloadLabel = (count) => {
    if (count >= 10) return { label: 'PEAK', color: '#ef4444', bgcolor: '#fee2e2' };
    if (count >= 5) return { label: 'HEAVY', color: '#f97316', bgcolor: '#ffedd5' };
    if (count >= 2) return { label: 'MODERATE', color: '#f59e0b', bgcolor: '#fef3c7' };
    return { label: 'LIGHT', color: '#10b981', bgcolor: '#dcfce7' };
  };

  const generateChartData = () => {
    if (!data?.operations?.peak_hours) return { labels: [], datasets: [] };
    
    const peakHours = data.operations.peak_hours;
    return {
      labels: peakHours.map(h => `${h.hour}:00`),
      datasets: [
        {
          label: 'Visit Density',
          data: peakHours.map(h => h.count),
          backgroundColor: peakHours.map(h => getWorkloadLabel(h.count).color),
          borderRadius: 6,
          barThickness: 20
        }
      ]
    };
  };

  const generateLineData = () => {
    if (!data?.operations?.peak_hours) return { labels: [], datasets: [] };
    
    const peakHours = data.operations.peak_hours;
    return {
      labels: peakHours.map(h => `${h.hour}:00`),
      datasets: [
        {
          fill: true,
          label: 'Operational Flow',
          data: peakHours.map(h => h.count),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const count = context.raw;
            const meta = getWorkloadLabel(count);
            return ` Visits: ${count} (${meta.label} Load)`;
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 2 } },
      x: { grid: { display: false }, ticks: { font: { size: 10, weight: '500' } } }
    }
  };

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortedTableData = () => {
    if (!data?.operations?.peak_hours) return [];
    
    let filtered = data.operations.peak_hours;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        String(item.hour).includes(query)
      );
    }

    if (workloadClass !== 'all') {
        filtered = filtered.filter(item => getWorkloadLabel(item.count).label.toLowerCase() === workloadClass.toLowerCase());
    }

    return [...filtered].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortDirection === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  };

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      
      {/* --- DASHBOARD PREVIEW CARD --- */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <TimeIcon sx={{ color: '#f59e0b', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#b45309', fontSize: '1.1rem' }}>
                Operational Peak Hours
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Schedule Workshop
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress sx={{ color: '#f59e0b' }} />
            ) : data?.operations?.peak_hours?.length > 0 ? (
              <Bar data={generateChartData()} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No operational data found.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- FULL DRILL-DOWN WORKSHOP MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#b45309' }}>
              Clinic Operational Flow & Density Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Analyze clinic traffic patterns to optimize staff scheduling and reduce patient wait times.
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: '#fcfcfc' }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          {/* FILTERS ROW */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Service Stream</InputLabel>
                <Select value={serviceType} label="Service Stream" onChange={(e) => setServiceType(e.target.value)}>
                  <MenuItem value="all">Unified Clinic Traffic</MenuItem>
                  <MenuItem value="medical">Medical Consultations</MenuItem>
                  <MenuItem value="dental">Dental Procedures</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Workload Intensity</InputLabel>
                <Select value={workloadClass} label="Workload Intensity" onChange={(e) => setWorkloadClass(e.target.value)}>
                  <MenuItem value="all">All Traffic Levels</MenuItem>
                  <MenuItem value="peak">Peak Intensity (10+)</MenuItem>
                  <MenuItem value="heavy">Heavy Intensity (5-9)</MenuItem>
                  <MenuItem value="moderate">Moderate Intensity (2-4)</MenuItem>
                  <MenuItem value="light">Light Intensity (0-1)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Reporting Scope</InputLabel>
                <Select value={modalDateRange} label="Reporting Scope" onChange={(e) => setModalDateRange(e.target.value)}>
                  <MenuItem value="7days">Weekly Operational View</MenuItem>
                  <MenuItem value="30days">Monthly Operational View</MenuItem>
                  <MenuItem value="all">Full Academic Year</MenuItem>
                  <MenuItem value="custom">Custom Schedule Range...</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Hour (e.g., 08)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><ClockIcon fontSize="small" /></InputAdornment>
                  }}
                />
            </Grid>
          </Grid>

          {/* VISUALIZATION GRID */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: 350 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon sx={{ color: '#f59e0b' }} fontSize="small" /> Hourly Operational Density
                </Typography>
                <Box sx={{ height: 280 }}>
                  {data?.operations?.peak_hours?.length > 0 ? (
                    <Bar data={generateChartData()} options={chartOptions} />
                  ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={10}>No data for selection</Typography>}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: 350 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon sx={{ color: '#f59e0b' }} fontSize="small" /> Workload Forecast
                </Typography>
                <Box sx={{ height: 280 }}>
                   {data?.operations?.peak_hours ? (
                       <Line data={generateLineData()} options={chartOptions} />
                   ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={10}>Loading forecast...</Typography>}
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* OPERATIONAL LOGS TABLE */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Hourly Operational Audit Trail</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: '8px' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'hour'} direction={sortField === 'hour' ? sortDirection : 'asc'} onClick={() => handleRequestSort('hour')}>
                      Time Slot (24h)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'count'} direction={sortField === 'count' ? sortDirection : 'asc'} onClick={() => handleRequestSort('count')}>
                      Recorded Visit Volume
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Workload Intensity Class</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>% of Total Daily Load</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSortedTableData().map((row, idx) => {
                  const meta = getWorkloadLabel(row.count);
                  const total = data.operations.peak_hours.reduce((sum, h) => sum + h.count, 0);
                  return (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.hour}:00 - {row.hour}:59</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#b45309' }}>{row.count.toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={meta.label} 
                          size="small" 
                          sx={{ 
                            bgcolor: meta.bgcolor, 
                            color: meta.color, 
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            height: 20
                          }} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {((row.count / (total || 1)) * 100).toFixed(1)}%
                          </Typography>
                          <Box sx={{ width: 60, height: 6, bgcolor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                            <Box sx={{ width: `${(row.count / total) * 100}%`, height: '100%', bgcolor: meta.color }} />
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: 'text.secondary' }}>Close Workshop</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('EXCEL')} disabled={generating} sx={{ mr: 1 }}>Excel</Button>
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('CSV')} disabled={generating} sx={{ mr: 1 }}>CSV</Button>
          <Button 
            variant="contained" 
            onClick={() => handleGenerateReport('PDF')}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Operational PDF'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default OperationsPreview;