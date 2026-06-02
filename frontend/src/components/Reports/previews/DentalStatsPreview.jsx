import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Divider, InputAdornment
} from '@mui/material';
import { 
  Healing as DentalIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  Medication as TreatmentIcon,
  HealthAndSafety as SafetyIcon,
  AutoGraph as GraphIcon
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import { reportService } from '../../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DentalStatsPreview = ({ dateRange, customStart, customEnd }) => {
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

  // Domain Specific Filters (Dental Dimensions)
  const [selectedProcedures, setSelectedProcedures] = useState([]);
  const [campusFilter, setCampusFilter] = useState('all');
  const [priorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const chartRef = React.useRef(null);

  const [sortField, setSortField] = useState('count');
  const [sortDirection, setSortDirection] = useState('desc');

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
      
      const currentRange = isModal ? modalDateRange : dateRange;
      
      const params = {
        date_start: isModal ? (modalDateRange === 'custom' ? modalStartDate : undefined) : (dateRange === 'custom' ? customStart : undefined),
        date_end: isModal ? (modalDateRange === 'custom' ? modalEndDate : undefined) : (dateRange === 'custom' ? customEnd : undefined),
        // Fix: If range is 'all', set to undefined so it is omitted from the API request
        date_range: currentRange === 'all' ? undefined : currentRange,
      };

      if (isModal) {
        if (selectedProcedures.length > 0) params.procedure = selectedProcedures.join(',');
        if (campusFilter !== 'all') params.campus = campusFilter;
      }

      const response = await reportService.getDashboardAnalytics(params);
      setData(response.data);
    } catch (err) {
      console.error("Failed fetching dental stats:", err);
      setError("Failed to load oral health statistics.");
    } finally {
      if (!isModal) setLoading(false);
    }
  }, [dateRange, customStart, customEnd, modalDateRange, modalStartDate, modalEndDate, selectedProcedures, campusFilter]);

  useEffect(() => {
    fetchAnalytics(false);
  }, [fetchAnalytics]);

  useEffect(() => {
    if (openModal) {
      fetchAnalytics(true);
    }
  }, [openModal, fetchAnalytics]);

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Oral Health Services & Clinical Capacity Report - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range: modalDateRange,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          procedure: selectedProcedures,
          campus: campusFilter !== 'all' ? [campusFilter] : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          charts_base64: chartRef.current ? [chartRef.current.toBase64Image()] : []
        }
      };


      const response = await reportService.generateReport(5, payload).catch(async (err) => {
        if (err.response?.status === 404) {
          console.warn("Template ID 5 not found, falling back to DENTAL_STATISTICS lookup...");
          return await reportService.generateReport('DENTAL_STATISTICS', payload);
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

  const generateChartData = () => {
    if (!data?.clinical?.top_procedures) return { labels: [], datasets: [] };
    
    // Top 8 for dashboard
    const procedures = data.clinical.top_procedures.slice(0, 8);
    const palette = ['#7c3aed', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#64748b'];
    
    return {
      labels: procedures.map(p => p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name),
      datasets: [
        {
          label: 'Frequency',
          data: procedures.map(p => p.count),
          backgroundColor: procedures.map((_, i) => palette[i % palette.length]),
          borderRadius: 4,
          hoverBackgroundColor: procedures.map((_, i) => palette[i % palette.length])
        }
      ]
    };
  };

  const chartOptions = {
    indexAxis: 'y',
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
        padding: 12
      }
    },
    scales: {
      x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11, weight: '500' } } }
    }
  };

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortedTableData = () => {
    if (!data?.clinical?.top_procedures) return [];
    
    let filtered = data.clinical.top_procedures;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.name || '').toLowerCase().includes(query)
      );
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

  const procedureOptions = Array.from(new Set((data?.clinical?.top_procedures || []).map(p => p.name))).sort();

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      
      {/* --- DASHBOARD PREVIEW CARD --- */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <DentalIcon sx={{ color: '#7c3aed', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#5b21b6', fontSize: '1.1rem' }}>
                Oral Health Utilization
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#5b21b6' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Dental Workshop
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress sx={{ color: '#7c3aed' }} />
            ) : data?.clinical?.top_procedures?.length > 0 ? (
              <Bar ref={chartRef} data={generateChartData()} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
                scales: {
                  ...chartOptions.scales,
                  y: {
                    ...chartOptions.scales.y,
                    ticks: {
                      ...chartOptions.scales.y.ticks,
                      callback: function(value) {
                        const label = this.getLabelForValue(value);
                        if (label.length > 20) {
                          return label.match(/.{1,20}(\s|$)/g);
                        }
                        return label;
                      }
                    }
                  }
                }
              }} />
            ) : (
              <Typography color="text.secondary" variant="body2">No dental data found.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- FULL DRILL-DOWN WORKSHOP MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#5b21b6' }}>
              Oral Health Services & Clinical Capacity Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Evaluate the distribution of dental procedures. Track procedural frequencies and clinic resource allocation.
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
            <Grid item xs={12} sm={5}>
              <Autocomplete
                multiple
                size="small"
                options={procedureOptions}
                value={selectedProcedures}
                onChange={(e, v) => setSelectedProcedures(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size="small" sx={{ bgcolor: '#ede9fe', color: '#5b21b6' }} {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Filter Procedures" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Campus Location</InputLabel>
                <Select value={campusFilter} label="Campus Location" onChange={(e) => setCampusFilter(e.target.value)}>
                  <MenuItem value="all">Unified Dental Records</MenuItem>
                  <MenuItem value="Talamban">Talamban Dental Clinic</MenuItem>
                  <MenuItem value="Downtown">Downtown Dental Clinic</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
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
                <Grid item xs={12} sm={2}>
                  <TextField fullWidth type="date" label="Start" size="small" value={modalStartDate} onChange={(e) => setModalStartDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ max: modalEndDate || getTodayString() }} />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField fullWidth type="date" label="End" size="small" value={modalEndDate} onChange={(e) => setModalEndDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: modalStartDate, max: getTodayString() }} />
                </Grid>
              </>
            )}
          </Grid>

          {/* VISUALIZATION GRID */}
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TreatmentIcon sx={{ color: '#7c3aed' }} fontSize="small" /> Procedural Utilization Distribution
            </Typography>
            <Box sx={{ height: 350 }}>
              {data?.clinical?.top_procedures?.length > 0 ? (
                <Bar 
                  data={{
                    labels: data.clinical.top_procedures.map(p => p.name),
                    datasets: [{
                      label: 'Total Procedures',
                      data: data.clinical.top_procedures.map(p => p.count),
                      backgroundColor: (context) => {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, '#ede9fe');
                        gradient.addColorStop(1, '#7c3aed');
                        return gradient;
                      },
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    ...chartOptions,
                    indexAxis: 'x',
                    scales: {
                      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 } }
                    }
                  }}
                />
              ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={12}>No dental patterns found for current selection</Typography>}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* DENTAL DATA TABLE */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Procedural Audit Log</Typography>
            <TextField
              size="small"
              placeholder="Search procedure..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              }}
              sx={{ width: 300 }}
            />
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: '8px' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDirection : 'asc'} onClick={() => handleRequestSort('name')}>
                      Dental Procedure Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'count'} direction={sortField === 'count' ? sortDirection : 'asc'} onClick={() => handleRequestSort('count')}>
                      Procedural Frequency
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Institutional Weight</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Efficiency Class</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSortedTableData().map((row, idx) => {
                  const total = data.clinical.top_procedures.reduce((sum, p) => sum + p.count, 0);
                  const weight = (row.count / (total || 1)) * 100;
                  return (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#7c3aed' }}>{row.count.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {weight.toFixed(2)}%
                          </Typography>
                          <Box sx={{ width: 60, height: 6, bgcolor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                            <Box sx={{ width: `${weight}%`, height: '100%', bgcolor: '#7c3aed' }} />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={row.count > 5 ? 'High Demand' : row.count > 2 ? 'Moderate' : 'Low Frequency'} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            borderColor: row.count > 5 ? '#7c3aed' : '#94a3b8', 
                            color: row.count > 5 ? '#7c3aed' : '#64748b',
                            fontSize: '0.65rem'
                          }}
                        />
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
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#5b21b6' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Dental PDF'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default DentalStatsPreview;