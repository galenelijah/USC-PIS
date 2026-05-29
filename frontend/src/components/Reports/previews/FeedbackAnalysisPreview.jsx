import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Rating
} from '@mui/material';
import { 
  ThumbUp as ThumbIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Star as StarIcon
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
  const [error, setError] = useState(null);
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [ratingFilter, setRatingFilter] = useState('all');

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
      console.error("Failed fetching feedback analytics:", err);
      setError("Failed to load patient feedback data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customStart, customEnd]);

  const generateDoughnutData = () => {
    if (!data?.satisfaction?.distribution) return { labels: [], datasets: [] };
    
    const dist = data.satisfaction.distribution;
    return {
      labels: dist.map(d => d.category),
      datasets: [
        {
          data: dist.map(d => d.count),
          backgroundColor: ['#4caf50', '#8bc34a', '#ffeb3b', '#ff9800', '#f44336'],
          hoverOffset: 4
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
              <ThumbIcon sx={{ color: '#4caf50', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50', fontSize: '1.1rem' }}>
                Patient Satisfaction (Average: {data?.satisfaction?.average || '0.0'} ★)
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' }, textTransform: 'none', borderRadius: '8px' }}
              >
                Comments
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress color="primary" />
            ) : data?.satisfaction?.distribution?.length > 0 ? (
              <Doughnut 
                data={generateDoughnutData()} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }
                }} 
              />
            ) : (
              <Typography color="text.secondary" variant="body2">No feedback records found.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#388e3c' }}>Patient Feedback Breakdown</Typography>
          <IconButton onClick={() => setOpenModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
           <Grid container spacing={2} sx={{ mb: 3 }}>
             <Grid item xs={12}>
               <FormControl fullWidth size="small">
                 <InputLabel>Filter by Rating</InputLabel>
                 <Select value={ratingFilter} label="Filter by Rating" onChange={(e) => setRatingFilter(e.target.value)}>
                   <MenuItem value="all">All Ratings</MenuItem>
                   <MenuItem value="5">5 Stars (Excellent)</MenuItem>
                   <MenuItem value="4">4 Stars (Good)</MenuItem>
                   <MenuItem value="3">3 Stars (Fair)</MenuItem>
                   <MenuItem value="2">2 Stars (Poor)</MenuItem>
                   <MenuItem value="1">1 Star (Very Poor)</MenuItem>
                 </Select>
               </FormControl>
             </Grid>
           </Grid>

           <Typography variant="subtitle2" gutterBottom fontWeight="bold">Rating Distribution</Typography>
           <Box sx={{ mb: 4, height: 200 }}>
              {data?.satisfaction?.distribution && (
                <Bar 
                  data={{
                    labels: data.satisfaction.distribution.map(d => d.category),
                    datasets: [{
                      label: 'Response Count',
                      data: data.satisfaction.distribution.map(d => d.count),
                      backgroundColor: '#8bc34a'
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              )}
           </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
          <Button variant="contained" sx={{ bgcolor: '#388e3c', '&:hover': { bgcolor: '#2e7d32' } }}>Export Analytics</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeedbackAnalysisPreview;