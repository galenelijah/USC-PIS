import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  Healing as DentalIcon,
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

const DentalStatsPreview = ({ dateRange, customStart, customEnd }) => {
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
      console.error("Failed fetching dental stats:", err);
      setError("Failed to load dental statistics.");
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
        title: `Dental Health Statistics - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range_start: dateRange === 'custom' ? customStart : undefined,
        date_range_end: dateRange === 'custom' ? customEnd : undefined,
      };
      const response = await reportService.generateReport(5, payload); // Template ID 5: Dental Health Report
      setSuccess(`Report generation started! ID: ${response.data.report_id}`);
      setTimeout(() => { setOpenModal(false); setSuccess(null); }, 2000);
    } catch (err) {
      setError("Failed to trigger report generation.");
    } finally {
      setGenerating(false);
    }
  };

  const chartData = {
    labels: data?.clinical?.top_procedures?.map(p => p.name.length > 20 ? p.name.substring(0, 17) + '...' : p.name) || [],
    datasets: [
      {
        label: 'Case Count',
        data: data?.clinical?.top_procedures?.map(p => p.count) || [],
        backgroundColor: '#7c3aed',
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1 } },
      y: { grid: { display: false } }
    }
  };

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <DentalIcon sx={{ color: '#7c3aed', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#7c3aed' }}>Common Dental Procedures</Typography>
            </Box>
            {!loading && (
              <Button 
                variant="contained" size="small" startIcon={<ViewIcon />} 
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#5b21b6' }, textTransform: 'none', borderRadius: '8px' }}
              >
                Dental Breakdown
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1 }}>
            {loading ? <CircularProgress sx={{ color: '#7c3aed' }} /> : data?.clinical?.top_procedures?.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No dental data recorded.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#5b21b6' }}>Oral Health Procedure Statistics</Typography>
          <IconButton onClick={() => setOpenModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Procedure Name</strong></TableCell>
                  <TableCell align="right"><strong>Case Count</strong></TableCell>
                  <TableCell align="right"><strong>Institutional Weight</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.clinical?.top_procedures?.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.count}</TableCell>
                    <TableCell align="right">
                      {((row.count / (data.visits.types.dental || 1)) * 100).toFixed(1)}%
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
            <Button variant="outlined" onClick={() => handleGenerateReport('EXCEL')} disabled={generating} size="small" sx={{ color: '#5b21b6', borderColor: '#5b21b6' }}>Excel</Button>
            <Button variant="contained" onClick={() => handleGenerateReport('PDF')} disabled={generating} startIcon={<DownloadIcon />} sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#5b21b6' } }}>
              {generating ? 'Processing...' : 'Generate Dental Report'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DentalStatsPreview;