import React, { useState, useEffect } from 'react';
/**
 * HealthCampaign.jsx
 * Updated: June 2, 2026 - Restored Individual Filters
 * Integrated with Enterprise Export Engine
 */
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Divider, InputAdornment
} from '@mui/material';
import { 
  BarChart as ChartIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import { campaignService, reportService } from '../../services/api';
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

const HealthCampaignPreview = ({ dateRange, customStart, customEnd }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [dashboardCampaigns, setDashboardCampaigns] = useState([]); 
  const [modalCampaigns, setModalCampaigns] = useState([]);         
  const [allCampaignTitles, setAllCampaignTitles] = useState([]);   
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal Internal Independent Filtering Controls
  const [openModal, setOpenModal] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]); 
  const [minViewsFilter, setMinViewsFilter] = useState('');
  const [modalDateRange, setModalDateRange] = useState('all'); 
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');

  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tableColumns = [
    { id: 'title', label: 'Campaign Title', align: 'left' },
    { id: 'campaign_type', label: 'Category', align: 'left' },
    { id: 'view_count', label: 'Total Views', align: 'right' },
    { id: 'created_by_name', label: 'Created By', align: 'left' },
    { id: 'created_at', label: 'Date Created', align: 'left' },
  ];

  // Fetch all campaign titles for comparison filter
  useEffect(() => {
    const fetchAllTitles = async () => {
      try {
        const response = await reportService.getDashboardAnalytics({ 
          date_range: 'all',
          report_type: 'CAMPAIGN_PERFORMANCE' 
        });
        const titles = Array.from(new Set((response?.data?.campaign_performance || []).map(c => c.title).filter(Boolean)));
        setAllCampaignTitles(titles);
      } catch (err) {
        console.error("Failed to fetch campaign titles:", err);
      }
    };
    fetchAllTitles();
  }, []);

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use standard dashboard analytics params if modal is closed, or modal params if open
        const params = openModal ? {
          date_range: modalDateRange,
          date_start: modalDateRange === 'custom' ? modalStartDate : undefined,
          date_end: modalDateRange === 'custom' ? modalEndDate : undefined,
          campaign_titles: selectedCampaigns.length > 0 ? selectedCampaigns.join(',') : undefined,
          min_views: minViewsFilter || undefined,
          search: searchQuery || undefined
        } : {
          date_range: dateRange,
          date_start: dateRange === 'custom' ? customStart : undefined,
          date_end: dateRange === 'custom' ? customEnd : undefined,
        };

        const response = await reportService.getDashboardAnalytics({ 
          ...params, 
          report_type: 'CAMPAIGN_PERFORMANCE' 
        });
        
        const dataList = response?.data?.campaign_performance || [];
        if (openModal) {
          setModalCampaigns(sortDataList([...dataList]));
        } else {
          setCampaigns(dataList);
          setDashboardCampaigns(dataList.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed fetching health campaigns:", err);
        setError("Failed to load campaign records.");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaignData();
  }, [openModal, dateRange, customStart, customEnd, modalDateRange, modalStartDate, modalEndDate, selectedCampaigns, minViewsFilter, searchQuery]);

  const sortDataList = (list) => {
    return list.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];

      if (sortField === 'view_count') { valueA = a.views || a.view_count || 0; valueB = b.views || b.view_count || 0; }
      if (sortField === 'engagement_count') { valueA = a.engagement || a.engagement_count || 0; valueB = b.engagement || b.engagement_count || 0; }
      
      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';

      if (sortField === 'created_at') {
        const timeA = valueA ? new Date(valueA).getTime() : 0;
        const timeB = valueB ? new Date(valueB).getTime() : 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (typeof valueA === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
  };

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Detailed Health Campaigns Breakdown Report - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range: modalDateRange,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          campaign_titles: selectedCampaigns,
          min_views: minViewsFilter || undefined,
          search: searchQuery
        }
      };

      const response = await reportService.generateReport(7, payload).catch(async (err) => {
        if (err.response?.status === 404) {
          console.warn("Template ID 7 not found, falling back to CAMPAIGN_PERFORMANCE lookup...");
          return await reportService.generateReport('CAMPAIGN_PERFORMANCE', payload);
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

  const generateChartData = (dataSrc, limit = null) => {
    let sorted = [...dataSrc].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    if (limit) sorted = sorted.slice(0, limit);

    return {
      labels: sorted.map(c => c.title.length > 20 ? c.title.substring(0, 17) + '...' : c.title),
      datasets: [
        {
          label: 'Total Student Views',
          data: sorted.map(c => c.view_count || 0),
          backgroundColor: [
            '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'
          ],
          borderRadius: 6,
          borderWidth: 0,
          barThickness: 30
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
      x: { beginAtZero: true, grid: { color: '#f8fafc' }, ticks: { font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11, weight: '500' } } }
    }
  };

  const renderDashboardHeadlineString = () => {
    if (dateRange === '7days') return "(Last 7 Days)";
    if (dateRange === '30days') return "(Last 30 Days)";
    if (dateRange === '6months') return "(Last 6 Months)";
    if (dateRange === 'custom') return `(${customStart} to ${customEnd})`;
    return "(Full Academic History)";
  };

  const isCampaignFilterActive = selectedCampaigns.length > 0;

  return (
    <Box sx={{ width: '100%', marginBottom:'20px'}}>

      {/* --- DASHBOARD PREVIEW CARD --- */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <ChartIcon sx={{ color: '#ea580c', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ea580c', fontSize: '1.1rem' }}>
                Campaign Views
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#ea580c', '&:hover': { bgcolor: '#a33d06' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                View Details
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress sx={{ color: '#ea580c' }} />
            ) : dashboardCampaigns.length > 0 ? (
              <Bar data={generateChartData(dashboardCampaigns, 5)} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No active records found inside chosen parameters.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- DRILL DOWN AUDIT MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" scroll="paper" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ea580c' }}>
              Detailed Health Campaigns Breakdown Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isCampaignFilterActive
                ? "Timeline restrictions disabled to preserve tracking parameters for selected entries."
                : "Select multiple targeted parameters to assemble a custom comparative report."}
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
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                size="small"
                options={allCampaignTitles}
                value={selectedCampaigns}
                onChange={(e, v) => setSelectedCampaigns(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size="small" color="warning" {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Compare Specific Campaigns" placeholder="Select one or more..." />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                size="small" 
                label="Minimum Views" 
                type="number"
                value={minViewsFilter} 
                onChange={(e) => setMinViewsFilter(e.target.value)} 
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Workshop Timeline</InputLabel>
                <Select value={modalDateRange} label="Workshop Timeline" onChange={(e) => setModalDateRange(e.target.value)}>
                  <MenuItem value="all">Full Academic History</MenuItem>
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="30days">Last 30 Days</MenuItem>
                  <MenuItem value="6months">Last 6 Months</MenuItem>
                  <MenuItem value="custom">Manual Range Selection</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* FILTERS ROW 2 (Extra Filters) */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
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

          <Divider sx={{ mb: 3 }} />

          {/* ANALYTICS PREVIEW SECTION */}
          <Box sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: 350 }}>
             <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Campaign Impact Comparative Visualization</Typography>
             <Box sx={{ height: 280 }}>
               {modalCampaigns.length > 0 ? (
                 <Bar data={generateChartData(modalCampaigns)} options={chartOptions} />
               ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={10}>No campaign data for current parameters</Typography>}
             </Box>
          </Box>

          {/* DATA TABLE SECTION */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Campaign Audit Log</Typography>
            <TextField
              size="small"
              placeholder="Search by title, category, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              }}
              sx={{ width: 350 }}
            />
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: '8px' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {tableColumns.map((col) => (
                    <TableCell 
                      key={col.id} 
                      align={col.align} 
                      sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}
                    >
                      <TableSortLabel
                        active={sortField === col.id}
                        direction={sortField === col.id ? sortDirection : 'asc'}
                        onClick={() => handleRequestSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {modalCampaigns.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
                    <TableCell>
                      <Chip label={row.campaign_type || 'General'} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#ea580c' }}>
                        {(row.view_count || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.created_by_name || 'System'}</TableCell>
                    <TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {modalCampaigns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                       <Typography variant="body2" color="text.secondary">No campaigns found matching your workshop filter selection.</Typography>
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
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('HTML')} disabled={generating} sx={{ mr: 1 }}>HTML</Button>
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('JSON')} disabled={generating} sx={{ mr: 1 }}>JSON</Button>
          <Button 
            variant="contained" 
            onClick={() => handleGenerateReport('PDF')}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            sx={{ bgcolor: '#ea580c', '&:hover': { bgcolor: '#a33d06' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Analytics PDF'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default HealthCampaignPreview;
