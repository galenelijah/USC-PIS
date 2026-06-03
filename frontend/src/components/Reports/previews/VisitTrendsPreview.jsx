import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Divider, InputAdornment,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { 
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  TrendingUp as TrendIcon,
  ShowChart as ChartIcon,
  StackedLineChart as StackedIcon,
  CalendarMonth as MonthIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { reportService } from '../../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
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
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const VisitTrendsPreview = ({ dateRange, customStart, customEnd }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Workshop Modal Internal Independent Filtering Controls
  const [openModal, setOpenModal] = useState(false);
  const [modalDateRange, setModalDateRange] = useState('all'); 
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');

  // Domain Specific Filters (Trends Dimensions)
  const [viewType, setViewType] = useState('line'); // 'line' vs 'area'
  const [streamFilter, setStreamFilter] = useState('all'); // 'all', 'medical', 'dental'
  const [searchQuery, setSearchQuery] = useState('');

  const [sortField, setSortField] = useState('month');
  const [sortDirection, setSortDirection] = useState('desc');

  const chartRef = React.useRef(null);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchAnalytics = useCallback(async (isModal = false) => {
    try {
      if (!isModal) setLoading(true);
      setError(null);
      
      const params = {
        date_start: isModal ? (modalDateRange === 'custom' ? modalStartDate : undefined) : (dateRange === 'custom' ? customStart : undefined),
        date_end: isModal ? (modalDateRange === 'custom' ? modalEndDate : undefined) : (dateRange === 'custom' ? customEnd : undefined),
        date_range: isModal ? modalDateRange : dateRange,
      };

      if (isModal) {
        if (streamFilter !== 'all') params.service_type = streamFilter;
        if (searchQuery) params.search = searchQuery;
      }

      const response = await reportService.getDashboardAnalytics(params);
      setData(response.data);
    } catch (err) {
      console.error("Failed fetching visit trends:", err);
      setError("Failed to load clinical visit trends.");
    } finally {
      if (!isModal) setLoading(false);
    }
  }, [dateRange, customStart, customEnd, modalDateRange, modalStartDate, modalEndDate, streamFilter, searchQuery]);

  useEffect(() => {
    fetchAnalytics(openModal);
  }, [openModal, fetchAnalytics]);

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Clinical Capacity & Visit Volume Report - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range: modalDateRange,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          service_type: streamFilter !== 'all' ? streamFilter : undefined,
          search: searchQuery || undefined,
          charts_base64: chartRef.current ? [chartRef.current.toBase64Image()] : []
        }
      };

      const response = await reportService.generateReport(2, payload).catch(async (err) => {
        if (err.response?.status === 404) {
          console.warn("Template ID 2 not found, falling back to VISIT_TRENDS lookup...");
          return await reportService.generateReport('VISIT_TRENDS', payload);
        }
        throw err;
      });
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

  const chartData = {
    labels: data?.visits?.monthly?.map(m => m.month) || [],
    datasets: [
      ...(streamFilter === 'all' ? [{
        label: 'Aggregate Trends',
        data: data?.visits?.monthly?.map(m => m.total_visits) || [],
        borderColor: '#1e293b',
        backgroundColor: viewType === 'area' ? 'rgba(30, 41, 59, 0.05)' : 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: '#1e293b',
        pointRadius: 3,
        tension: 0.4,
        fill: viewType === 'area',
      }] : []),
      ...(streamFilter === 'all' || streamFilter === 'medical' ? [{
        label: 'Medical Consultations',
        data: data?.visits?.monthly?.map(m => m.medical_visits) || [],
        borderColor: '#2563eb',
        backgroundColor: viewType === 'area' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#2563eb',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: viewType === 'area',
      }] : []),
      ...(streamFilter === 'all' || streamFilter === 'dental' ? [{
        label: 'Dental Procedures',
        data: data?.visits?.monthly?.map(m => m.dental_visits) || [],
        borderColor: '#7c3aed',
        backgroundColor: viewType === 'area' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#7c3aed',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: viewType === 'area',
      }] : [])
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 6, font: { size: 11, weight: '500' } } },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: '#f1f5f9' }, 
        title: { display: true, text: 'Total Visit Volume', font: { weight: 'bold', size: 10 } } 
      },
      x: { 
        grid: { display: false },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 36,
          maxRotation: 45,
          minRotation: 0,
          font: { size: 9 }
        }
      }
    }
  };

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortedTableData = () => {
    if (!data?.visits?.monthly) return [];
    
    let filtered = data.visits.monthly;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.month || '').toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      const field = sortField === 'month' ? 'timestamp' : sortField;
      const valA = a[field];
      const valB = b[field];
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
              <TrendIcon sx={{ color: '#2563eb', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af', fontSize: '1.1rem' }}>
                Longitudinal Visit Trends
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1e40af' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Trends Workshop
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress sx={{ color: '#2563eb' }} />
            ) : data?.visits?.monthly?.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No longitudinal data found.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- FULL DRILL-DOWN WORKSHOP MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
              Clinical Capacity & Visit Volume Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Track longitudinal growth of medical and dental services. Analyze seasonal peaks and patient throughput.
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
          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Clinical Stream</InputLabel>
                <Select value={streamFilter} label="Clinical Stream" onChange={(e) => setStreamFilter(e.target.value)}>
                  <MenuItem value="all">Medical + Dental</MenuItem>
                  <MenuItem value="medical">Medical Only</MenuItem>
                  <MenuItem value="dental">Dental Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Reporting Range</InputLabel>
                <Select value={modalDateRange} label="Reporting Range" onChange={(e) => setModalDateRange(e.target.value)}>
                  <MenuItem value="all">Full Academic History</MenuItem>
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="30days">Last 30 Days</MenuItem>
                  <MenuItem value="6months">Last 6 Months</MenuItem>
                  <MenuItem value="custom">Manual Range Selection</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {modalDateRange === 'custom' && (
              <>
                <Grid item xs={12} sm={1.5}>
                  <TextField fullWidth type="date" label="Start" size="small" value={modalStartDate} onChange={(e) => setModalStartDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ max: modalEndDate || getTodayString() }} />
                </Grid>
                <Grid item xs={12} sm={1.5}>
                  <TextField fullWidth type="date" label="End" size="small" value={modalEndDate} onChange={(e) => setModalEndDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: modalStartDate, max: getTodayString() }} />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={2}>
              <ToggleButtonGroup
                value={viewType}
                exclusive
                onChange={(e, v) => v && setViewType(v)}
                size="small"
                fullWidth
              >
                <ToggleButton value="line" aria-label="Line View">
                  <ChartIcon fontSize="small" sx={{ mr: 1 }} /> Line
                </ToggleButton>
                <ToggleButton value="area" aria-label="Area View">
                  <StackedIcon fontSize="small" sx={{ mr: 1 }} /> Area
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} sm={modalDateRange === 'custom' ? 2 : 4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search month..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  }}
                />
            </Grid>
          </Grid>

          {/* VISUALIZATION GRID */}
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', mb: 4 }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MonthIcon sx={{ color: '#2563eb' }} fontSize="small" /> Comparative Interaction Timeline
                </Typography>
                <Chip label={`Granularity: ${data?.visits?.granularity === 'D' ? 'Daily' : data?.visits?.granularity === 'W-MON' ? 'Weekly' : 'Monthly'}`} size="small" variant="outlined" color="primary" />
            </Box>
            <Box sx={{ height: 350 }}>
              {data?.visits?.monthly?.length > 0 ? (
                <Line ref={chartRef} data={chartData} options={chartOptions} />
              ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={12}>No visit patterns found for current selection</Typography>}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* TREND DATA TABLE */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Interaction Utilization Log</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: '8px', overflowX: 'auto' }}>
            <Table stickyHeader size="small" sx={{ minWidth: 850 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'month'} direction={sortField === 'month' ? sortDirection : 'asc'} onClick={() => handleRequestSort('month')}>
                      Timeline Interval
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'medical_visits'} direction={sortField === 'medical_visits' ? sortDirection : 'asc'} onClick={() => handleRequestSort('medical_visits')}>
                      Medical Cases
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'dental_visits'} direction={sortField === 'dental_visits' ? sortDirection : 'asc'} onClick={() => handleRequestSort('dental_visits')}>
                      Dental Cases
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Aggregate Volume</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Change %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSortedTableData().map((row, idx, array) => {
                  const total = row.medical_visits + row.dental_visits;
                  return (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.month}</TableCell>
                      <TableCell align="right" sx={{ color: '#2563eb', fontWeight: 600 }}>{(row.medical_visits || 0).toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ color: '#7c3aed', fontWeight: 600 }}>{(row.dental_visits || 0).toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b' }}>{(total || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {((total / (data?.visits?.total || 1)) * 100).toFixed(2)}%
                          </Typography>
                          <Box sx={{ width: 60, height: 6, bgcolor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                            <Box sx={{ width: `${(total / (data?.visits?.total || 1)) * 100}%`, height: '100%', bgcolor: '#2563eb' }} />
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
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('HTML')} disabled={generating} sx={{ mr: 1 }}>HTML</Button>
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('JSON')} disabled={generating} sx={{ mr: 1 }}>JSON</Button>
          <Button 
            variant="contained" 
            onClick={() => handleGenerateReport('PDF')}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1e40af' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Trends PDF'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default VisitTrendsPreview;
