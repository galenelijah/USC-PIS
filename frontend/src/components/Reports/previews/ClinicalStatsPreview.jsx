import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip
} from '@mui/material';
import { 
  MedicalServices as MedicalIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  LocalHospital as HospitalIcon,
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

const ClinicalStatsPreview = ({ dateRange, customStart, customEnd }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [diagnosisFilter, setDiagnosisFilter] = useState('');

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Clinical Statistics Report - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range_start: dateRange === 'custom' ? customStart : undefined,
        date_range_end: dateRange === 'custom' ? customEnd : undefined,
        filters: {
          diagnosis_category: diagnosisFilter || undefined
        }
      };

      const response = await reportService.generateReport(4, payload); // Template ID 4
      setSuccess(`Report generation started! ID: ${response.data.report_id}`);
      
      setTimeout(() => {
        setOpenModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setError("Failed to trigger report generation.");
    } finally {
      setGenerating(false);
    }
  };

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
      console.error("Failed fetching clinical stats:", err);
      setError("Failed to load clinical statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customStart, customEnd]);

  const generateBarData = () => {
    if (!data?.clinical?.top_diagnoses) return { labels: [], datasets: [] };
    
    const diagnoses = data.clinical.top_diagnoses;
    return {
      labels: diagnoses.map(d => d.name.length > 20 ? d.name.substring(0, 17) + '...' : d.name),
      datasets: [
        {
          label: 'Case Count',
          data: diagnoses.map(d => d.case_count),
          backgroundColor: '#f44336',
          borderRadius: 4
        }
      ]
    };
  };

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <MedicalIcon sx={{ color: '#f44336', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#f44336', fontSize: '1.1rem' }}>
                Top Clinical Diagnoses
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' }, textTransform: 'none', borderRadius: '8px' }}
              >
                Detailed Stats
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress color="primary" />
            ) : data?.clinical?.top_diagnoses?.length > 0 ? (
              <Bar 
                data={generateBarData()} 
                options={{ 
                  indexAxis: 'y',
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            ) : (
              <Typography color="text.secondary" variant="body2">No clinical data recorded for this period.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#d32f2f' }}>Clinical Health Trends</Typography>
          <IconButton onClick={() => setOpenModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
           {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
           {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
           <Grid container spacing={2} sx={{ mb: 3 }}>
             <Grid item xs={12}>
               <TextField 
                 fullWidth 
                 size="small" 
                 label="Search Diagnosis" 
                 value={diagnosisFilter} 
                 onChange={(e) => setDiagnosisFilter(e.target.value)} 
                 placeholder="e.g., Asthma, Hypertension..."
               />
             </Grid>
           </Grid>

           <Typography variant="subtitle2" gutterBottom fontWeight="bold">Clinical Frequency Breakdown</Typography>
           <TableContainer component={Paper} variant="outlined">
             <Table size="small">
               <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                 <TableRow>
                   <TableCell><strong>Diagnosis/Concern</strong></TableCell>
                   <TableCell align="right"><strong>Case Count</strong></TableCell>
                   <TableCell align="right"><strong>Avg. Patient Age</strong></TableCell>
                 </TableRow>
               </TableHead>
               <TableBody>
                 {data?.clinical?.top_diagnoses?.filter(d => d.name.toLowerCase().includes(diagnosisFilter.toLowerCase())).map((row, idx) => (
                   <TableRow key={idx}>
                     <TableCell>{row.name}</TableCell>
                     <TableCell align="right">{row.case_count}</TableCell>
                     <TableCell align="right">{row.avg_age} yrs</TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={() => handleGenerateReport('EXCEL')}
              disabled={generating}
              size="small"
              sx={{ color: '#d32f2f', borderColor: '#d32f2f' }}
            >
              Excel
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleGenerateReport('CSV')}
              disabled={generating}
              size="small"
              sx={{ color: '#d32f2f', borderColor: '#d32f2f' }}
            >
              CSV
            </Button>
            <Button 
              variant="contained" 
              onClick={() => handleGenerateReport('PDF')}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, borderRadius: '8px', px: 3 }}
            >
              {generating ? 'Processing...' : 'Generate PDF'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClinicalStatsPreview;