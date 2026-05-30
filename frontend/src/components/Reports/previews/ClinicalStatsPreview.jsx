import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Divider, InputAdornment
} from '@mui/material';
import { 
  MedicalServices as MedicalIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  LocalHospital as HospitalIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  HistoryEdu as ClinicalIcon,
  Bloodtype as PathologyIcon
} from '@mui/icons-material';
import { Bar, Pie } from 'react-chartjs-2';
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

const ClinicalStatsPreview = ({ dateRange, customStart, customEnd }) => {
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

  // Domain Specific Filters (Clinical Dimensions)
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [campusFilter, setCampusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [sortField, setSortField] = useState('case_count');
  const [sortDirection, setSortDirection] = useState('desc');

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
        if (selectedDiagnoses.length > 0) params.diagnosis_category = selectedDiagnoses.join(',');
        if (campusFilter !== 'all') params.campus = campusFilter;
      }

      const response = await reportService.getDashboardAnalytics(params);
      setData(response.data);
    } catch (err) {
      console.error("Failed fetching clinical stats:", err);
      setError("Failed to load clinical statistics.");
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
  }, [openModal, modalDateRange, modalStartDate, modalEndDate, selectedDiagnoses, campusFilter]);

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Clinical Health Trends Analysis - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range: modalDateRange,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          diagnosis_category: selectedDiagnoses,
          campus: campusFilter !== 'all' ? [campusFilter] : undefined
        }
      };

      const response = await reportService.generateReport(4, payload); // Template ID 4
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

  const generateBarData = () => {
    if (!data?.clinical?.top_diagnoses) return { labels: [], datasets: [] };
    
    // Use Top 10 for dashboard
    const diagnoses = data.clinical.top_diagnoses.slice(0, 10);
    return {
      labels: diagnoses.map(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name),
      datasets: [
        {
          label: 'Total Cases',
          data: diagnoses.map(d => d.case_count),
          backgroundColor: '#ef4444',
          borderRadius: 4,
          hoverBackgroundColor: '#b91c1c'
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
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11, weight: '500' } } }
    }
  };

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortedTableData = () => {
    if (!data?.clinical?.top_diagnoses) return [];
    
    let filtered = data.clinical.top_diagnoses;
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

  // Mocked options for Autocomplete - In real app, these would come from an endpoint
  const diagnosisOptions = Array.from(new Set((data?.clinical?.top_diagnoses || []).map(d => d.name))).sort();

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      
      {/* --- DASHBOARD PREVIEW CARD --- */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <ClinicalIcon sx={{ color: '#ef4444', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#991b1b', fontSize: '1.1rem' }}>
                Common Clinical Diagnoses
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#b91c1c' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Clinical Workshop
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress sx={{ color: '#ef4444' }} />
            ) : data?.clinical?.top_diagnoses?.length > 0 ? (
              <Bar data={generateBarData()} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No morbidity data recorded.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- FULL DRILL-DOWN WORKSHOP MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#b91c1c' }}>
              Morbidity & Clinical Trends Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Analyze frequency of medical conditions and student morbidity. Group by ICD-based classifications.
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
                options={diagnosisOptions}
                value={selectedDiagnoses}
                onChange={(e, v) => setSelectedDiagnoses(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c' }} {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Filter Diagnoses" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Campus Filter</InputLabel>
                <Select value={campusFilter} label="Campus Filter" onChange={(e) => setCampusFilter(e.target.value)}>
                  <MenuItem value="all">Both Campuses</MenuItem>
                  <MenuItem value="Talamban">Talamban Campus</MenuItem>
                  <MenuItem value="Downtown">Downtown Campus</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Timeline</InputLabel>
                <Select value={modalDateRange} label="Timeline" onChange={(e) => setModalDateRange(e.target.value)}>
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
              <PathologyIcon sx={{ color: '#ef4444' }} fontSize="small" /> Comparative Diagnostic Volumes
            </Typography>
            <Box sx={{ height: 350 }}>
              {data?.clinical?.top_diagnoses?.length > 0 ? (
                <Bar 
                  data={{
                    labels: data.clinical.top_diagnoses.map(d => d.name),
                    datasets: [{
                      label: 'Case Count',
                      data: data.clinical.top_diagnoses.map(d => d.case_count),
                      backgroundColor: (context) => {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, '#fee2e2');
                        gradient.addColorStop(1, '#ef4444');
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
              ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={12}>No clinical patterns found for selection</Typography>}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* CLINICAL DATA TABLE */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Epidemiological Data Breakdown</Typography>
            <TextField
              size="small"
              placeholder="Search diagnosis..."
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
                      Diagnosis / Clinical Concern
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'case_count'} direction={sortField === 'case_count' ? sortDirection : 'asc'} onClick={() => handleRequestSort('case_count')}>
                      Case Frequency
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'avg_age'} direction={sortField === 'avg_age' ? sortDirection : 'asc'} onClick={() => handleRequestSort('avg_age')}>
                      Avg. Age
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Morbidity Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSortedTableData().map((row, idx) => {
                  const total = data.clinical.top_diagnoses.reduce((sum, d) => sum + d.case_count, 0);
                  return (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#ef4444' }}>{row.case_count.toLocaleString()}</TableCell>
                      <TableCell align="right">{row.avg_age || 'N/A'} yrs</TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {((row.case_count / (total || 1)) * 100).toFixed(1)}%
                          </Typography>
                          <Box sx={{ width: 60, height: 6, bgcolor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                            <Box sx={{ width: `${(row.case_count / total) * 100}%`, height: '100%', bgcolor: '#ef4444' }} />
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
            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#b91c1c' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Clinical PDF'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ClinicalStatsPreview;