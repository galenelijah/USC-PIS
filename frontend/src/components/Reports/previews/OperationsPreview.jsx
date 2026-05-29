import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon
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

const OperationsPreview = ({ dateRange, customStart, customEnd }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        date_start: dateRange === 'custom' ? customStart : undefined,
        date_end: dateRange === 'custom' ? customEnd : undefined,
      };
      const response = await reportService.getDashboardAnalytics(params);
      setData(response.data);
    } catch (err) {
      console.error("Failed fetching operational stats:", err);
      setError("Failed to load peak hour statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customStart, customEnd]);

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      const payload = {
        title: `Operational Efficiency Report - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range_start: dateRange === 'custom' ? customStart : undefined,
        date_range_end: dateRange === 'custom' ? customEnd : undefined,
      };
      const response = await reportService.generateReport(8, payload); // Template ID 8: User Activity/Operations
      setSuccess(`Report generation started! ID: ${response.data.report_id}`);
      setTimeout(() => { setOpenModal(false); setSuccess(null); }, 2000);
    } catch (err) {
      setError("Failed to trigger report generation.");
    } finally {
      setGenerating(false);
    }
  };

  const chartData = {
    labels: data?.operations?.peak_hours?.map(h => `${h.hour}:00`) || [],
    datasets: [
      {
        label: 'Visits (Density)',
        data: data?.operations?.peak_hours?.map(h => h.count) || [],
        backgroundColor: '#f59e0b',
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1 } },
      x: { grid: { display: false } }
    }
  };

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <TimeIcon sx={{ color: '#f59e0b', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#f59e0b' }}>Operational Peak Hours</Typography>
            </Box>
            {!loading && (
              <Button 
                variant="contained" size="small" startIcon={<ViewIcon />} 
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none', borderRadius: '8px' }}
              >
                Schedule Analysis
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1 }}>
            {loading ? <CircularProgress /> : data?.operations?.peak_hours?.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No operational data recorded.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#d97706' }}>Clinic Operational Density</Typography>
          <IconButton onClick={() => setOpenModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Typography variant="body2" sx={{ mb: 2 }}>This distribution helps clinic administrators allocate staff resources during high-traffic intervals.</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Time Slot (Hour)</strong></TableCell>
                  <TableCell align="right"><strong>Recorded Visits</strong></TableCell>
                  <TableCell align="right"><strong>Workload Class</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.operations?.peak_hours?.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.hour}:00 - {row.hour}:59</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.count}</TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" sx={{ color: row.count > 5 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                        {row.count > 5 ? 'PEAK' : row.count > 2 ? 'MODERATE' : 'LOW'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => handleGenerateReport('EXCEL')} disabled={generating} size="small" sx={{ color: '#d97706', borderColor: '#d97706' }}>Excel</Button>
            <Button variant="contained" onClick={() => handleGenerateReport('PDF')} disabled={generating} startIcon={<DownloadIcon />} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}>
              {generating ? 'Processing...' : 'Export Efficiency Report'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OperationsPreview;