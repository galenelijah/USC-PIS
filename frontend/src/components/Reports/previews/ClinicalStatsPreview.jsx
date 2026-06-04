import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Divider, InputAdornment
} from '@mui/material';
import { 
  Visibility as ViewIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  Medication as MedicineIcon,
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



const wrapText = (text, maxLength = 20) => {
  if (!text) return '';
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach(word => {
    if ((currentLine + word).length > maxLength) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  if (currentLine) lines.push(currentLine.trim());
  return lines;
};


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ClinicalStatsPreview = ({ dateRange, customStart, customEnd }) => {
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

  // Domain Specific Filters (Clinical Dimensions)
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [campusFilter, setCampusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [yearLevelFilter, setYearLevelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const chartRef = React.useRef(null);

  const [sortField, setSortField] = useState('count');
  const [sortDirection, setSortDirection] = useState('asc');

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
        date_range: currentRange,
      };

      if (isModal) {
        if (selectedDiagnoses.length > 0) params.diagnosis = selectedDiagnoses.join(',');
        if (campusFilter !== 'all') params.campus = campusFilter;
        if (roleFilter !== 'all') params.role = roleFilter;
        if (yearLevelFilter !== 'all') params.year_level = yearLevelFilter;
        if (searchQuery) params.search = searchQuery;
      }

      const response = await reportService.getDashboardAnalytics(params);
      setData(response.data);
    } catch (err) {
      console.error("Failed fetching clinical stats:", err);
      setError("Failed to load medical diagnostic statistics.");
    } finally {
      if (!isModal) setLoading(false);
    }
  }, [dateRange, customStart, customEnd, modalDateRange, modalStartDate, modalEndDate, selectedDiagnoses, campusFilter, roleFilter, yearLevelFilter, searchQuery]);

  useEffect(() => {
    fetchAnalytics(openModal);
  }, [openModal, fetchAnalytics]);

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Clinical Diagnostic Density Report - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range: modalDateRange,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          diagnosis: selectedDiagnoses,
          campus: campusFilter !== 'all' ? [campusFilter] : undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          year_level: yearLevelFilter !== 'all' ? yearLevelFilter : undefined,
          search: searchQuery || undefined,
          charts_base64: chartRef.current ? [chartRef.current.toBase64Image()] : []
        }
      };

      // ID 4 is the Clinical Diagnostic Report template
      const response = await reportService.generateReport(4, payload).catch(async (err) => {
        // Fallback to string-based lookup if ID 4 doesn't exist
        if (err.response?.status === 404) {
          console.warn("Template ID 4 not found, falling back to CLINICAL_STATISTICS lookup...");
          return await reportService.generateReport('CLINICAL_STATISTICS', payload);
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
    if (!data?.clinical?.top_diagnoses) return { labels: [], datasets: [] };
    
    // Top 8 for dashboard
    const diagnoses = data.clinical.top_diagnoses.slice(0, 8);
    
    return {
      labels: diagnoses.map(d => wrapText(d.name, 20)),
      datasets: [
        {
          label: 'Case Volume',
          data: diagnoses.map(d => d.case_count || d.count || 0),
          backgroundColor: '#2563eb',
          borderRadius: 4,
          hoverBackgroundColor: '#1d4ed8'
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
    if (!data?.clinical?.top_diagnoses) return [];
    
    let filtered = data.clinical.top_diagnoses;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.name || '').toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      // Handle both count and case_count for sorting robustness
      const valA = a[sortField] !== undefined ? a[sortField] : (sortField === 'count' ? a.case_count : undefined);
      const valB = b[sortField] !== undefined ? b[sortField] : (sortField === 'count' ? b.case_count : undefined);
      
      if (sortDirection === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  };

  const diagnosisOptions = Array.from(new Set((data?.clinical?.top_diagnoses || []).map(d => d.name))).sort();

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      
      {/* --- DASHBOARD PREVIEW CARD --- */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <MedicineIcon color="primary" sx={{ fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a', fontSize: '1.1rem' }}>
                Medical Diagnostic Profile
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1e3a8a' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Clinical Workshop
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress size={32} />
            ) : data?.clinical?.top_diagnoses?.length > 0 ? (
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
              <Typography color="text.secondary" variant="body2">No diagnostic data found.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- FULL DRILL-DOWN WORKSHOP MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
              Clinical Diagnostic Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Examine medical trends, evaluate disease frequencies, and filter by institutional dimensions.
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: '#fcfcfc' }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          {/* FILTERS ROW 1 */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={5}>
              <Autocomplete
                multiple
                limitTags={2}
                size="small"
                options={diagnosisOptions}
                value={selectedDiagnoses}
                onChange={(e, v) => setSelectedDiagnoses(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size="small" color="primary" variant="outlined" {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Filter Diagnoses" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Campus Location</InputLabel>
                <Select value={campusFilter} label="Campus Location" onChange={(e) => setCampusFilter(e.target.value)}>
                  <MenuItem value="all">Unified Medical Records</MenuItem>
                  <MenuItem value="Talamban">Talamban Health Clinic</MenuItem>
                  <MenuItem value="Downtown">Downtown Health Clinic</MenuItem>
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
          </Grid>

          {/* FILTERS ROW 2 (Clinical & Demographics) */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Patient Role</InputLabel>
                <Select value={roleFilter} label="Patient Role" onChange={(e) => setRoleFilter(e.target.value)}>
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="STUDENT">Student</MenuItem>
                  <MenuItem value="FACULTY">Faculty</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Year Level</InputLabel>
                <Select value={yearLevelFilter} label="Year Level" onChange={(e) => setYearLevelFilter(e.target.value)}>
                  <MenuItem value="all">All Years</MenuItem>
                  {['1', '2', '3', '4', '5'].map(y => (
                    <MenuItem key={y} value={y}>{y}{y === '1' ? 'st' : y === '2' ? 'nd' : y === '3' ? 'rd' : 'th'} Year</MenuItem>
                  ))}
                  <MenuItem value="6">Batch X</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {modalDateRange === 'custom' && (
              <>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth type="date" label="Start" size="small" value={modalStartDate} onChange={(e) => setModalStartDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ max: modalEndDate || getTodayString() }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth type="date" label="End" size="small" value={modalEndDate} onChange={(e) => setModalEndDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: modalStartDate, max: getTodayString() }} />
                </Grid>
              </>
            )}
          </Grid>

          {/* VISUALIZATION GRID */}
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GraphIcon color="primary" fontSize="small" /> Diagnostic Distribution Trend
            </Typography>
            <Box sx={{ height: 350 }}>
              {data?.clinical?.top_diagnoses?.length > 0 ? (
                <Bar 
                  data={{
                    labels: data.clinical.top_diagnoses.map(d => wrapText(d.name, 20)),
                    datasets: [{
                      label: 'Total Cases',
                      data: data.clinical.top_diagnoses.map(d => d.case_count || d.count || 0),
                      backgroundColor: (context) => {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, '#dbeafe');
                        gradient.addColorStop(1, '#2563eb');
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
              ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={12}>No clinical patterns found for current selection</Typography>}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* CLINICAL DATA TABLE */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Diagnostic Audit Log</Typography>
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
                      Clinical Diagnosis Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'count'} direction={sortField === 'count' ? sortDirection : 'asc'} onClick={() => handleRequestSort('count')}>
                      Recorded Frequency
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Institutional Load</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'avg_age'} direction={sortField === 'avg_age' ? sortDirection : 'asc'} onClick={() => handleRequestSort('avg_age')}>
                      Avg. Patient Age
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSortedTableData().map((row, idx) => {
                  const currentCount = row.case_count || row.count || 0;
                  const total = data.clinical.top_diagnoses.reduce((sum, d) => sum + (d.case_count || d.count || 0), 0);
                  const percentage = (currentCount / (total || 1)) * 100;
                  return (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#2563eb' }}>{currentCount.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {percentage.toFixed(2)}%
                          </Typography>
                          <Box sx={{ width: 60, height: 6, bgcolor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                            <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: '#2563eb' }} />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                         <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                           {row.avg_age ? `${row.avg_age.toFixed(1)} yrs` : 'N/A'}
                         </Typography>
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
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1e3a8a' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Clinical PDF'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ClinicalStatsPreview;