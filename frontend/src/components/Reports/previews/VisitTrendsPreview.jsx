import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon
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
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const VisitTrendsPreview = ({ dateRange, customStart, customEnd }) => {
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
      console.error("Failed fetching visit trends:", err);
      setError("Failed to load visit trends.");
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
        title: `Visit Trends Report - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range_start: dateRange === 'custom' ? customStart : undefined,
        date_range_end: dateRange === 'custom' ? customEnd : undefined,
      };
      const response = await reportService.generateReport(2, payload); // Template ID 2: Monthly Visit Trends
      setSuccess(`Report generation started! ID: ${response.data.report_id}`);
      setTimeout(() => { setOpenModal(false); setSuccess(null); }, 2000);
    } catch (err) {
      setError("Failed to trigger report generation.");
    } finally {
      setGenerating(false);
    }
  };

  const chartData = {
    labels: data?.visits?.monthly?.map(m => m.month) || [],
    datasets: [
      {
        label: 'Medical Visits',
        data: data?.visits?.monthly?.map(m => m.medical_visits) || [],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Dental Visits',
        data: data?.visits?.monthly?.map(m => m.dental_visits) || [],
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 6 } }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <TimelineIcon sx={{ color: '#2563eb', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2563eb' }}>Monthly Visit Trends</Typography>
            </Box>
            {!loading && (
              <Button 
                variant="contained" size="small" startIcon={<ViewIcon />} 
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1e40af' }, textTransform: 'none', borderRadius: '8px' }}
              >
                Details
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1 }}>
            {loading ? <CircularProgress /> : data?.visits?.monthly?.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No visit data for this period.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa' }}>
          <Typography variant="h6" fontWeight="bold" color="primary">Clinical Visit Volume Analysis</Typography>
          <IconButton onClick={() => setOpenModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Month</strong></TableCell>
                  <TableCell align="right"><strong>Medical</strong></TableCell>
                  <TableCell align="right"><strong>Dental</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.visits?.monthly?.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell align="right">{row.medical_visits}</TableCell>
                    <TableCell align="right">{row.dental_visits}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.medical_visits + row.dental_visits}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => handleGenerateReport('EXCEL')} disabled={generating} size="small">Excel</Button>
            <Button variant="contained" onClick={() => handleGenerateReport('PDF')} disabled={generating} startIcon={<DownloadIcon />}>
              {generating ? 'Processing...' : 'Download Trends Report'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisitTrendsPreview;