import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip
} from '@mui/material';
import { 
  BarChart as ChartIcon,
  Visibility as ViewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import { campaignService } from '../../services/api';
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
  const [error, setError] = useState(null);
  
  // Modal Internal Independent Filtering Controls
  const [openModal, setOpenModal] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]); 
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
    
    // --- CHANGED: Bypasses date calculation filters entirely if targeted items are active ---
    if (selectedCampaigns.length > 0) {
      modalFiltered = modalFiltered.filter(campaign => 
        selectedCampaigns.includes(campaign.title)
      );
    } else {
      // Only apply timeline limitations when no specific campaigns are pinned down
      modalFiltered = executeRangeFiltering(modalFiltered, modalDateRange, modalStartDate, modalEndDate);
    }
    
    setModalCampaigns(sortDataList([...modalFiltered]));

  }, [selectedCampaigns, modalDateRange, modalStartDate, modalEndDate, dateRange, customStart, customEnd, campaigns, sortField, sortDirection]);

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const generateChartData = (dataSrc, limit = null) => {
    let topCampaigns = [...dataSrc].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    if (limit) {
      topCampaigns = topCampaigns.slice(0, limit);
    }

    const paletteGradient = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#cbd5e1'];
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
          barThickness: 24
        }
      ]
    };
  };

  const chartOptions = {
    indexAxis: 'y', 
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
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

  const renderDashboardHeadlineString = () => {
    if (dateRange === '7days') return "Trends (Past 7 Days)";
    if (dateRange === '30days') return "Trends (Past 30 Days)";
    if (dateRange === '6months') return "Trends (Past 6 Months)";
    if (dateRange === 'custom') return "Trends (Custom Range)";
    return "Trends (All-Time Records)";
  };

  const uniqueCampaignTitles = Array.from(new Set(campaigns.map(c => c.title).filter(Boolean)));
  
  // Boolean flag helper to tell components whether to lock up visual controls
  const isCampaignFilterActive = selectedCampaigns.length > 0;

  return (
    <Box sx={{ width: '100%', marginBottom:'20px'}}>
      
      {/* --- DASHBOARD PREVIEW CARD --- */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <ChartIcon sx={{ color: '#303f9f', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#303f9f', fontSize: '1.1rem' }}>
                Campaign Views {renderDashboardHeadlineString()}
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#303f9f', '&:hover': { bgcolor: '#1a237e' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                View Details
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress color="primary" />
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
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#303f9f' }}>
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

          <Grid container spacing={2} sx={{ mb: 3 }}>
            
            {/* Multi-Select Chip list manager */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                size="small"
                options={uniqueCampaignTitles}
                value={selectedCampaigns}
                onChange={(event, newValue) => {
                  setSelectedCampaigns(newValue);
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip 
                      label={option} 
                      size="small" 
                      color="primary"
                      variant="combined"
                      sx={{ borderRadius: '6px', fontWeight: 500 }}
                      {...getTagProps({ index })} 
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Filter by Campaigns (Select Multiple)" 
                    variant="outlined"
                    placeholder="Choose fields..."
                  />
                )}
              />
            </Grid>

            {/* --- CHANGED: Dynamically locks using disabled={isCampaignFilterActive} --- */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" disabled={isCampaignFilterActive}>
                <InputLabel id="modal-date-range-label">
                  {isCampaignFilterActive ? "Timeline Filter (Disabled)" : "Filter by Timeline"}
                </InputLabel>
                <Select 
                  labelId="modal-date-range-label" 
                  id="modal-date-range" 
                  value={isCampaignFilterActive ? "all" : modalDateRange} 
                  label={isCampaignFilterActive ? "Timeline Filter (Disabled)" : "Filter by Timeline"} 
                  onChange={(e) => setModalDateRange(e.target.value)}
                >
                  <MenuItem value="all">Show All</MenuItem>
                  <MenuItem value="7days">Past 7 Days</MenuItem>
                  <MenuItem value="30days">Past 30 Days</MenuItem>
                  <MenuItem value="6months">Past 6 Months</MenuItem>
                  <MenuItem value="custom">Custom Date Range...</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* --- CHANGED: Custom date pickers hide or lock dynamically if campaigns are selected --- */}
            {!isCampaignFilterActive && modalDateRange === 'custom' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" size="small" value={modalStartDate} onChange={(e) => setModalStartDate(e.target.value)} inputProps={{ max: modalEndDate || getTodayString() }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" size="small" value={modalEndDate} onChange={(e) => setModalEndDate(e.target.value)} inputProps={{ min: modalStartDate, max: getTodayString() }} />
                </Grid>
              </>
            )}
          </Grid>

          <Box sx={{ minHeight: 350, maxHeight: 500, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', mb: 4 }}>
            {modalCampaigns.length > 0 ? (
              <Bar data={generateChartData(modalCampaigns)} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No matching tracking data metrics found for this selection configuration.</Typography>
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#424242', px: 0.5 }}>
            Audit Tracking Logs ({modalCampaigns.length} items)
          </Typography>
          
          {modalCampaigns.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320, overflow: 'auto', borderRadius: '8px' }}>
              <Table stickyHeader aria-label="modal interactive table" size="small">
                <TableHead>
                  <TableRow>
                    {tableColumns.map((col) => (
                      <TableCell 
                        key={col.id} 
                        sx={{ bgcolor: '#f5f5f5', py: 1.5, fontWeight: 'bold' }} 
                        align={col.align}
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
                      <TableCell component="th" scope="row" sx={{ fontWeight: 500, minWidth: 180 }}>
                        {row.title || '-'}
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        {row.campaign_type || row.category || '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: '#303f9f' }}>
                        {(row.view_count || 0).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        {row.created_by_name || row.author_name || 'System Admin'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(row.created_at || row.date_created)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(row.updated_at || row.date_updated)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed #e0e0e0', borderRadius: '8px' }}>
              <Typography color="text.secondary">No structural records found inside your parameters.</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0', justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => alert('Generating custom campaign report... (Feature coming soon)')} 
            variant="contained" 
            sx={{ 
              textTransform: 'none', 
              borderRadius: '8px', 
              px: 3, 
              bgcolor: '#303f9f', 
              '&:hover': { bgcolor: '#1a237e' },
              fontWeight: 600 
            }}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HealthCampaignPreview;