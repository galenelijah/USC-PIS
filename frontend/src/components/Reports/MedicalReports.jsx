import React, { useState, useEffect, useCallback } from 'react';
/**
 * MedicalReports.jsx
 * Updated: June 2, 2026 - Streamlined Analytics Summary
 * Removed local filters, master table, and shortcuts. 
 * Replaced Workshop Status with Active Health Alerts.
 * Integrated with Enterprise Global Filters.
 */
import { 
  Box, Card, CardContent, Typography, Grid, 
  CircularProgress, Alert, IconButton
} from '@mui/material';
import { 
  Assessment as ReportIcon,
  Timeline as TrendIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { reportService } from '../../services/api';

const MedicalReports = ({ dateRange, customStart, customEnd }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        date_range: dateRange,
        date_start: dateRange === 'custom' ? customStart : undefined,
        date_end: dateRange === 'custom' ? customEnd : undefined,
      };

      const response = await reportService.getDashboardAnalytics(params);
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch medical analytics summary:", err);
      setError("Unable to load summary metrics.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const SummaryCard = ({ title, value, subtitle, icon, color }) => (
    <Card sx={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" variant="overline" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: color || 'inherit' }}>
              {value}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
              {subtitle}
            </Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: `${color}15`, color: color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
          Clinical Intelligence Summary
        </Typography>
        <IconButton onClick={fetchAnalytics} size="small" color="primary">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* SUMMARY STATS GRID */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Total Consultations" 
            value={loading ? <CircularProgress size={20} /> : stats?.visits?.total || 0}
            subtitle="Recorded engagements"
            icon={<ReportIcon />}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Unique Diagnoses" 
            value={loading ? <CircularProgress size={20} /> : stats?.clinical?.top_diagnoses?.length || 0}
            subtitle="Disease profiles identified"
            icon={<TrendIcon />}
            color="#16a34a"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Reporting Period" 
            value={loading ? <CircularProgress size={20} /> : stats?.period?.start ? new Date(stats.period.start).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'N/A'}
            subtitle={`To ${stats?.period?.end ? new Date(stats.period.end).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'present'}`}
            icon={<HistoryIcon />}
            color="#7c3aed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Patient Satisfaction" 
            value={loading ? <CircularProgress size={20} /> : `${stats?.satisfaction?.average || '0.0'} ★`} 
            subtitle="Avg. Service Sentiment"
            icon={<StarIcon />}
            color="#10b981"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MedicalReports;
