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

  // Workshop State
  const [activeWorkshop, setActiveWorkshop] = useState(null);
  const [recentReports, setRecentReports] = useState([]);

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
      
      // Also fetch recent reports for the history tab
      const historyResponse = await reportService.getReportHistory({ limit: 5 });
      setRecentReports(historyResponse.data.results || []);
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

  const workshopConfigs = [
    { 
      id: 'clinical', 
      title: 'Clinical Diagnostics Workshop', 
      desc: 'Deep-dive into medical complaints, diagnoses, and treatment patterns.',
      icon: <ReportIcon color="primary" />,
      component: <ClinicalStatsPreview dateRange={dateRange} customStart={customStart} customEnd={customEnd} />
    },
    { 
      id: 'dental', 
      title: 'Oral Health Workshop', 
      desc: 'Analyze dental procedures, tooth-specific distributions, and clinic usage.',
      icon: <DocIcon sx={{ color: '#7c3aed' }} />,
      component: <DentalStatsPreview dateRange={dateRange} customStart={customStart} customEnd={customEnd} />
    },
    { 
      id: 'feedback', 
      title: 'Sentiment Workshop', 
      desc: 'Evaluate patient satisfaction, staff courtesy, and qualitative feedback.',
      icon: <TrendIcon color="success" />,
      component: <FeedbackAnalysisPreview dateRange={dateRange} customStart={customStart} customEnd={customEnd} />
    },
    { 
      id: 'operations', 
      title: 'Operational Density', 
      desc: 'Clinic traffic analysis, peak hours, and resource utilization efficiency.',
      icon: <TrendIcon sx={{ color: '#f59e0b' }} />,
      component: <OperationsPreview dateRange={dateRange} customStart={customStart} customEnd={customEnd} />
    },
    { 
      id: 'patient', 
      title: 'Demographics Workshop', 
      desc: 'Student distribution by college, year level, and campus locations.',
      icon: <SummaryIcon sx={{ color: '#1e3a8a' }} />,
      component: <PatientSummaryPreview dateRange={dateRange} customStart={customStart} customEnd={customEnd} />
    }
  ];

  const handleDownloadReport = async (reportId) => {
    try {
      const response = await reportService.downloadReport(reportId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `USC-Report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download report file.");
    }
  };

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
            value={loading ? <CircularProgress size={20} /> : stats?.counts?.total_records || '0'}
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

      {/* WORKSHOP GRID */}
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>
        Reporting Analytics Workshops
      </Typography>
      <Grid container spacing={3} mb={6}>
        {workshopConfigs.map((config) => (
          <Grid item xs={12} md={6} lg={4} key={config.id}>
            <Card 
              sx={{ 
                height: '100%', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.08)', borderColor: '#1e3a8a' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" gap={2} mb={2}>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#f8fafc' }}>{config.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{config.title}</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3, minHeight: '40px' }}>
                  {config.desc}
                </Typography>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  endIcon={<ArrowIcon />}
                  onClick={() => setActiveWorkshop(config)}
                  sx={{ 
                    borderRadius: '8px', 
                    textTransform: 'none', 
                    fontWeight: 600,
                    borderColor: '#cbd5e1',
                    color: '#334155',
                    '&:hover': { borderColor: '#1e3a8a', bgcolor: '#f0f9ff', color: '#1e3a8a' }
                  }}
                >
                  Enter Workshop
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* REPORT HISTORY TABLE */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
          Recent Export Archive
        </Typography>
        <Button 
          startIcon={<HistoryIcon />} 
          color="inherit"
          sx={{ fontWeight: 600, textTransform: 'none' }}
        >
          View Full Archive
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Report ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Technical Template</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Format</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Generated By</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentReports.map((report) => (
              <TableRow key={report.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>#{report.report_id}</TableCell>
                <TableCell>
                  <Chip 
                    label={report.template_name || 'System Report'} 
                    size="small" 
                    sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }} 
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={report.export_format} 
                    size="small" 
                    color={report.export_format === 'PDF' ? 'error' : 'success'}
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                  />
                </TableCell>
                <TableCell>
                    {report.provider_name ? (
                        report.provider_name
                    ) : (
                        report.provider_first_name ? `${report.provider_first_name} ${report.provider_last_name}` : 'Clinic System'
                    )}
                </TableCell>
                <TableCell sx={{ color: 'textSecondary' }}>
                  {new Date(report.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => handleDownloadReport(report.report_id)}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {recentReports.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'textSecondary' }}>
                  No reports in the recent archive.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* WORKSHOP DIALOG */}
      <Dialog 
        open={!!activeWorkshop} 
        onClose={() => setActiveWorkshop(null)}
        fullWidth
        maxWidth="xl"
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <Box display="flex" alignItems="center" gap={2}>
            {activeWorkshop?.icon}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{activeWorkshop?.title}</Typography>
              <Typography variant="caption" color="textSecondary">{activeWorkshop?.desc}</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setActiveWorkshop(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: '#fdfdfd' }}>
          {activeWorkshop?.component}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Button 
            onClick={() => setActiveWorkshop(null)} 
            variant="outlined"
            sx={{ borderRadius: '8px', px: 4, borderColor: '#16a34a', color: '#16a34a', '&:hover': { borderColor: '#11823b', bgcolor: '#f4fbf7' }, fontWeight: 600 }}
          >
            Close View
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default MedicalReports;