import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Rating, Divider, InputAdornment
} from '@mui/material';
import { 
  ThumbUp as ThumbIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Star as StarIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  SentimentSatisfiedAlt as SatisfiedIcon,
  Recommend as RecommendIcon,
  Face as FaceIcon
} from '@mui/icons-material';
import { Doughnut, Bar } from 'react-chartjs-2';
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

const FeedbackAnalysisPreview = ({ dateRange, customStart, customEnd }) => {
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

  // Domain Specific Filters (Feedback Dimensions)
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [recommendFilter, setRecommendFilter] = useState('all');
  const [courtesyFilter, setCourtesyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [sortField, setSortField] = useState('created_at');
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
        if (selectedRatings.length > 0) params.rating = selectedRatings.join(',');
        if (recommendFilter !== 'all') params.recommend = recommendFilter;
        if (courtesyFilter !== 'all') params.courteous = courtesyFilter;
      }

      const response = await reportService.getDashboardAnalytics(params);
      setData(response.data);
    } catch (err) {
      console.error("Failed fetching feedback analytics:", err);
      setError("Failed to load patient feedback data.");
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
  }, [openModal, modalDateRange, modalStartDate, modalEndDate, selectedRatings, recommendFilter, courtesyFilter]);

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Service Satisfaction Analysis - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range: modalDateRange,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          rating: selectedRatings,
          recommend: recommendFilter !== 'all' ? recommendFilter : undefined,
          courteous: courtesyFilter !== 'all' ? courtesyFilter : undefined
        }
      };

      const response = await reportService.generateReport(6, payload); // Template ID 6
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

  const generateDoughnutData = () => {
    if (!data?.satisfaction?.distribution) return { labels: [], datasets: [] };
    
    const dist = data.satisfaction.distribution;
    return {
      labels: dist.map(d => `${d.category} Stars`),
      datasets: [
        {
          data: dist.map(d => d.count),
          backgroundColor: ['#4caf50', '#8bc34a', '#ffeb3b', '#ff9800', '#f44336'],
          borderWidth: 0,
          hoverOffset: 15,
          borderRadius: 4
        }
      ]
    };
  };

  const generateServiceMetricsData = () => {
    if (!data?.satisfaction?.metrics) return { labels: [], datasets: [] };
    
    const metrics = data.satisfaction.metrics; // Expected { recommend_yes: X, recommend_no: Y, courteous_yes: Z, courteous_no: W }
    return {
      labels: ['Recommend Service', 'Staff Courtesy'],
      datasets: [
        {
          label: 'Yes',
          data: [metrics.recommend_yes || 0, metrics.courteous_yes || 0],
          backgroundColor: '#4caf50',
          borderRadius: 6
        },
        {
          label: 'No',
          data: [metrics.recommend_no || 0, metrics.courteous_no || 0],
          backgroundColor: '#f44336',
          borderRadius: 6
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, font: { size: 10, weight: '500' }, padding: 15 }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12
      }
    },
    cutout: '65%'
  };

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortedTableData = () => {
    if (!data?.satisfaction?.raw_comments) return [];
    
    let filtered = data.satisfaction.raw_comments;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.comments || '').toLowerCase().includes(query) ||
        (item.improvement || '').toLowerCase().includes(query)
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

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      
      {/* --- DASHBOARD PREVIEW CARD --- */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <SatisfiedIcon sx={{ color: '#4caf50', fontSize: 26 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32', fontSize: '1.1rem', lineHeight: 1.2 }}>
                  Patient Satisfaction
                </Typography>
                <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 700 }}>
                  Average: {data?.satisfaction?.average || '0.0'} / 5.0 ★
                </Typography>
              </Box>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Sentiment Workshop
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress sx={{ color: '#4caf50' }} />
            ) : data?.satisfaction?.distribution?.length > 0 ? (
              <Doughnut data={generateDoughnutData()} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No feedback data available for this period.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- FULL DRILL-DOWN WORKSHOP MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
              Service Satisfaction & Sentiment Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Analyze student qualitative feedback, staff courtesy ratings, and service recommendations.
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
              <Autocomplete
                multiple
                size="small"
                options={['5', '4', '3', '2', '1']}
                value={selectedRatings}
                onChange={(e, v) => setSelectedRatings(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={`${option} Stars`} size="small" color="success" {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Star Rating" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Recommend Service</InputLabel>
                <Select value={recommendFilter} label="Recommend Service" onChange={(e) => setRecommendFilter(e.target.value)}>
                  <MenuItem value="all">All Responses</MenuItem>
                  <MenuItem value="yes">Yes (Positive)</MenuItem>
                  <MenuItem value="no">No (Negative)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Staff Courtesy</InputLabel>
                <Select value={courtesyFilter} label="Staff Courtesy" onChange={(e) => setCourtesyFilter(e.target.value)}>
                  <MenuItem value="all">All Responses</MenuItem>
                  <MenuItem value="yes">Courteous</MenuItem>
                  <MenuItem value="no">Needs Improvement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
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
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={5}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon sx={{ color: '#ffb400' }} fontSize="small" /> Star Distribution
                </Typography>
                <Box sx={{ height: 240 }}>
                  {data?.satisfaction?.distribution?.length > 0 ? (
                    <Doughnut data={generateDoughnutData()} options={chartOptions} />
                  ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={8}>No data available</Typography>}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RecommendIcon sx={{ color: '#4caf50' }} fontSize="small" /> Service Performance Indicators
                </Typography>
                <Box sx={{ height: 240 }}>
                  {data?.satisfaction?.metrics ? (
                    <Bar 
                      data={generateServiceMetricsData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true, grid: { display: false } } },
                        plugins: { legend: { position: 'bottom' } }
                      }} 
                    />
                  ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={8}>Loading metrics...</Typography>}
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* COMMENTS DATA TABLE */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Qualitative Feedback Audit</Typography>
            <TextField
              size="small"
              placeholder="Search comments..."
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
                    <TableSortLabel active={sortField === 'created_at'} direction={sortField === 'created_at' ? sortDirection : 'asc'} onClick={() => handleRequestSort('created_at')}>
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Rating</TableCell>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Comments / Suggestions</TableCell>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Recommend</TableCell>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Courtesy</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSortedTableData().map((row, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Rating value={row.rating} readOnly size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 400 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.comments || 'No comment'}</Typography>
                      {row.improvement && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic', mt: 0.5 }}>
                          Improvement: {row.improvement}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={row.recommend === 'yes' ? 'Yes' : 'No'} 
                        size="small" 
                        color={row.recommend === 'yes' ? 'success' : 'error'} 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={row.courteous === 'yes' ? 'Courteous' : 'Needs Work'} 
                        size="small" 
                        color={row.courteous === 'yes' ? 'primary' : 'warning'} 
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {getSortedTableData().length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">No qualitative feedback found for current filters.</Typography>
                    </TableCell>
                  </TableRow>
                )}
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
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Satisfaction PDF'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default FeedbackAnalysisPreview;