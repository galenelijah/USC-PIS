import React, { useState, useEffect, useCallback } from 'react';
/**
 * MedicalReports.jsx
 * Updated: May 29, 2026 - Analytical Reports Workshop
 * Integrated with Enterprise Export Engine
 */
import { 
  Box, Card, CardContent, Typography, Grid, Button, 
  CircularProgress, Alert, Chip, Divider, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { 
  Assessment as ReportIcon,
  Timeline as TrendIcon,
  Description as DocIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Close as CloseIcon,
  Summarize as SummaryIcon,
  ChevronRight as ArrowIcon
} from '@mui/icons-material';
import { reportService } from '../../services/api';

// Preview Components
import ClinicalStatsPreview from './previews/ClinicalStatsPreview';
import DentalStatsPreview from './previews/DentalStatsPreview';
import FeedbackAnalysisPreview from './previews/FeedbackAnalysisPreview';
import PatientSummaryPreview from './previews/PatientSummaryPreview';
import OperationsPreview from './previews/OperationsPreview';

const MedicalReports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30days');
  const [customStart] = useState('');
  const [customEnd] = useState('');

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        date_range: dateRange,
        date_start: dateRange === 'custom' ? customStart : undefined,
        date_end: dateRange === 'custom' ? customEnd : undefined
      };
      const response = await reportService.getDashboardAnalytics(params);
      setStats(response.data);
    } catch (err) {
      console.error("Report fetch error:", err);
      setError("Unable to load clinical intelligence data.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const SummaryCard = ({ title, value, subtitle, icon, color }) => (
    <Card sx={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
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
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1600px', margin: '0 auto' }}>
      {/* HEADER SECTION */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Enterprise Health Analytics
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" sx={{ fontWeight: 500 }}>
            Unified Clinical Intelligence & Reporting Workshop v2.0
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={fetchDashboardStats}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '8px' }}>{error}</Alert>}

      {/* TIMELINE CONTROLS */}
      <Card sx={{ mb: 4, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', bgcolor: '#f8fafc' }}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" flexWrap="wrap" gap={1.5} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b', mr: 1, textTransform: 'uppercase' }}>
              Intelligence Scope:
            </Typography>
            {[
              { label: 'Academic Term', value: 'all' },
              { label: 'Last 7 Days', value: '7days' },
              { label: 'Last 30 Days', value: '30days' },
              { label: 'Last 6 Months', value: '6months' }
            ].map((scope) => (
              <Chip
                key={scope.value}
                label={scope.label}
                onClick={() => setDateRange(scope.value)}
                sx={{ 
                  borderRadius: '8px', 
                  fontWeight: 600,
                  bgcolor: dateRange === scope.value ? '#1e3a8a' : 'transparent',
                  color: dateRange === scope.value ? '#ffffff' : '#64748b',
                  border: dateRange === scope.value ? 'none' : '1px solid #cbd5e1',
                  '&:hover': { bgcolor: dateRange === scope.value ? '#1e3a8a' : '#f1f5f9' }
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* SUMMARY STATS GRID */}
      <Grid container spacing={3} mb={5}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Total Consultations" 
            value={loading ? <CircularProgress size={20} /> : stats?.visits?.total || '0'}
            subtitle="Clinical engagements recorded"
            icon={<ReportIcon />}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Avg Satisfaction" 
            value={loading ? <CircularProgress size={20} /> : `${stats?.satisfaction?.average || '0.0'}/5`}
            subtitle="Patient sentiment index"
            icon={<TrendIcon />}
            color="#16a34a"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Active Patients" 
            value={loading ? <CircularProgress size={20} /> : stats?.demographics?.total_active || '0'}
            subtitle="Registered with recent activity"
            icon={<SummaryIcon />}
            color="#7c3aed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Clinic Peak Load" 
            value={loading ? <CircularProgress size={20} /> : stats?.operations?.peak_hours?.[0] ? `${stats.operations.peak_hours[0].hour}:00` : 'N/A'}
            subtitle="Highest traffic hour"
            icon={<HistoryIcon />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* INTEGRATED CLINICAL WORKSHOP PREVIEW - Long Card at Bottom */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>
          Clinical Diagnostics Workshop
        </Typography>
        <ClinicalStatsPreview 
          dateRange={dateRange} 
          customStart={customStart} 
          customEnd={customEnd} 
        />
      </Box>

    </Box>
  );
};

export default MedicalReports;