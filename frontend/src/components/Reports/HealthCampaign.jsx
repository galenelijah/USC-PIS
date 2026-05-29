import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Divider
} from '@mui/material';
import { 
  BarChart as ChartIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon
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
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal Internal Independent Filtering Controls
  const [openModal, setOpenModal] = useState(false);
  const [selectedCampaignTitles, setSelectedCampaignTitles] = useState([]); 
  const [modalDateRange, setModalDateRange] = useState('30days'); 
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');

  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

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
    { id: 'updated_at', label: 'Last Updated', align: 'left' },
  ];

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await campaignService.getCampaigns();
        const dataList = response?.data?.results || response?.data || [];
        setCampaigns(dataList);
      } catch (err) {
        console.error("Failed fetching health campaigns:", err);
        setError(err.response?.data?.message || "Failed to load campaign records.");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaignData();
  }, []);

  const sortDataList = (list) => {
    return list.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];

      if (sortField === 'created_at') { valueA = valueA || a.date_created || ''; valueB = valueB || b.date_created || ''; }
      if (sortField === 'updated_at') { valueA = valueA || a.date_updated || ''; valueB = valueB || b.date_updated || ''; }
      if (sortField === 'campaign_type') { valueA = valueA || a.category || ''; valueB = valueB || b.category || ''; }
      if (sortField === 'created_by_name') { valueA = valueA || a.author_name || ''; valueB = valueB || b.author_name || ''; }

      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';

      if (sortField === 'created_at' || sortField === 'updated_at') {
        const timeA = valueA ? new Date(valueA).getTime() : 0;
        const timeB = valueB ? new Date(valueB).getTime() : 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const executeRangeFiltering = (baseArray, rangeType, startBound, endBound) => {
    let result = [...baseArray];
    const now = new Date();

    if (rangeType === '7days') {
      const cutOff = new Date();
      cutOff.setDate(now.getDate() - 7);
      result = result.filter(c => new Date(c.created_at || c.date_created || c.date) >= cutOff);
    } else if (rangeType === '30days') {
      const cutOff = new Date();
      cutOff.setDate(now.getDate() - 30);
      result = result.filter(c => new Date(c.created_at || c.date_created || c.date) >= cutOff);
    } else if (rangeType === '6months') {
      const cutOff = new Date();
      cutOff.setMonth(now.getMonth() - 6);
      result = result.filter(c => new Date(c.created_at || c.date_created || c.date) >= cutOff);
    } else if (rangeType === 'custom') {
      if (startBound) {
        const start = new Date(startBound);
        start.setHours(0, 0, 0, 0);
        result = result.filter(c => new Date(c.created_at || c.date_created || c.date) >= start);
      }
      if (endBound) {
        const end = new Date(endBound);
        end.setHours(23, 59, 59, 999);
        result = result.filter(c => new Date(c.created_at || c.date_created || c.date) <= end);
      }
    }
    return result;
  };

  useEffect(() => {
    // 1. Process Main Layout Dashboard side dataset (utilizes global props timelines)
    const dashboardFiltered = executeRangeFiltering(campaigns, dateRange, customStart, customEnd);
    setDashboardCampaigns(sortDataList([...dashboardFiltered]));

    // 2. Process Modal layer via internal states
    let modalFiltered = [...campaigns];
    
    if (selectedCampaignTitles.length > 0) {
      modalFiltered = modalFiltered.filter(campaign => 
        selectedCampaignTitles.includes(campaign.title)
      );
    } else {
      modalFiltered = executeRangeFiltering(modalFiltered, modalDateRange, modalStartDate, modalEndDate);
    }
    
    setModalCampaigns(sortDataList([...modalFiltered]));

  }, [selectedCampaignTitles, modalDateRange, modalStartDate, modalEndDate, dateRange, customStart, customEnd, campaigns, sortField, sortDirection]);

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Health Campaign Performance Analysis - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          campaign_titles: selectedCampaignTitles,
          status: 'ACTIVE'
        }
      };

      const response = await reportService.generateReport(7, payload); // Template ID 7: Campaign Performance
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
    let topCampaigns = [...dataSrc].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    const activeLimit = limit || 8;
    topCampaigns = topCampaigns.slice(0, activeLimit);

    const paletteGradient = ['#ea580c', '#f16410', '#f77015', '#fa7d23', '#fb8b34', '#fb9b48', '#fcad61', '#fdbd7a'];
    const backgroundColors = topCampaigns.map((_, index) => paletteGradient[index % paletteGradient.length]);

    return {
      labels: topCampaigns.map(c => c.title || `ID: ${c.id}`),
      datasets: [
        {
          label: 'Total Views',
          data: topCampaigns.map(c => c.view_count || 0),
          backgroundColor: backgroundColors,
          borderWidth: 0,
          borderRadius: 4,
          barThickness: 18,
          maxBarThickness: 20
        }
      ]
    };
  };

  const chartOptions = {
    indexAxis: 'y', 
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    layout: { padding: { top: 10, bottom: 10, left: 5, right: 15 } },
    scales: {
      x: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 } } },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 11, fontWeight: '500' },
          callback: function(value) {
            const label = this.getLabelForValue(value);
            return label.length > 25 ? label.substring(0, 22) + '...' : label;
          }
        }
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateString; }
  };

  const uniqueCampaignTitles = Array.from(new Set(campaigns.map(c => c.title).filter(Boolean)));
  const isCampaignFilterActive = selectedCampaignTitles.length > 0;

  return (
    <Box sx={{ width: '100%', marginBottom:'20px'}}>
      
      {/* --- DASHBOARD PREVIEW CARD --- */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <ChartIcon sx={{ color: '#ea580c', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ea580c', fontSize: '1.1rem' }}>
                Health Information Engagement
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
                Engagement Workshop
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress sx={{ color: '#ea580c' }} />
            ) : dashboardCampaigns.length > 0 ? (
              <Bar data={generateChartData(dashboardCampaigns, 5)} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No campaign data recorded.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- DRILL DOWN AUDIT MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ea580c' }}>
              Detailed Health Campaigns Breakdown Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Analyze engagement across health educational materials. Use multi-select to compare specific campaigns.
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: '#fcfcfc' }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                size="small"
                options={uniqueCampaignTitles}
                value={selectedCampaignTitles}
                onChange={(e, v) => setSelectedCampaignTitles(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size="small" color="primary" sx={{ bgcolor: '#fff7ed', color: '#ea580c', borderColor: '#fdba74' }} variant="outlined" {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Select Campaigns to Compare" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" disabled={isCampaignFilterActive}>
                <InputLabel>Reporting Range</InputLabel>
                <Select value={isCampaignFilterActive ? "all" : modalDateRange} label="Reporting Range" onChange={(e) => setModalDateRange(e.target.value)}>
                  <MenuItem value="all">Full Academic History</MenuItem>
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="30days">Last 30 Days</MenuItem>
                  <MenuItem value="6months">Last 6 Months</MenuItem>
                  <MenuItem value="custom">Custom Range...</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ minHeight: 350, maxHeight: 500, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', mb: 4 }}>
            {modalCampaigns.length > 0 ? (
              <Bar data={generateChartData(modalCampaigns)} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No data found for this selection.</Typography>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Campaign Performance Audit</Typography>
          
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320, borderRadius: '8px' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {tableColumns.map((col) => (
                    <TableCell key={col.id} sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }} align={col.align}>
                      <TableSortLabel active={sortField === col.id} direction={sortField === col.id ? sortDirection : 'asc'} onClick={() => handleRequestSort(col.id)}>
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {modalCampaigns.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.title || '-'}</TableCell>
                    <TableCell>{row.campaign_type || row.category || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#ea580c' }}>{(row.view_count || 0).toLocaleString()}</TableCell>
                    <TableCell>{row.created_by_name || 'Clinic Admin'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.created_at || row.date_created)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.updated_at || row.date_updated)}</TableCell>
                  </TableRow>
                ))}
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
            sx={{ bgcolor: '#ea580c', '&:hover': { bgcolor: '#a33d06' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Performance PDF'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HealthCampaignPreview;