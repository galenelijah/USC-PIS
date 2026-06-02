import React, { useState, useEffect, useCallback } from 'react';
/**
 * MedicalReports.jsx
 * Updated: June 2, 2026 - Clinical Activity Master Workshop
 * Restored Master Audit Log and Analytical Workshops Shortcuts
 */
import { 
  Box, Card, CardContent, Typography, Grid, Button, 
  CircularProgress, Alert, Chip, Divider, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TableSortLabel, TextField, InputAdornment
} from '@mui/material';
import { 
  Assessment as ReportIcon,
  Timeline as TrendIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Medication as MedicineIcon,
  HealthAndSafety as HealthIcon,
  FactCheck as OutcomesIcon,
  SettingsSuggest as SystemIcon,
  ChevronRight as ArrowIcon
} from '@mui/icons-material';
import { reportService, api } from '../../services/api';

const MedicalReports = ({ dateRange, setDateRange }) => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('visit_date');
  const [sortDirection, setSortDirection] = useState('desc');

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients/medical-records/');
      setRecords(response.data.results || response.data || []);
    } catch (err) {
      console.error("Failed to fetch medical records:", err);
      setError("Unable to load master clinical activity log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
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

  const getSortedRecords = () => {
    let filtered = [...records];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.patient_name || '').toLowerCase().includes(query) ||
        (r.patient_usc_id || '').toLowerCase().includes(query) ||
        (r.diagnosis || '').toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'visit_date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (sortDirection === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
  };

  const WorkshopCard = ({ title, subtitle, icon, color, onClick }) => (
    <Card 
      onClick={onClick}
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
        border: '1px solid #e2e8f0',
        borderRadius: '12px'
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: `${color}15`, color: color }}>
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
              {title}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
              {subtitle}
            </Typography>
          </Box>
          <ArrowIcon sx={{ color: '#cbd5e1' }} />
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
            onClick={fetchRecords}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>

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
                onClick={() => setDateRange && setDateRange(scope.value)}
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
            value={loading ? <CircularProgress size={20} /> : records.length}
            subtitle="Clinical engagements recorded"
            icon={<ReportIcon />}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Unique Diagnoses" 
            value={loading ? <CircularProgress size={20} /> : new Set(records.map(r => r.diagnosis)).size}
            subtitle="Distinct disease profiles"
            icon={<TrendIcon />}
            color="#16a34a"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Last Activity" 
            value={loading ? <CircularProgress size={20} /> : records[0] ? new Date(records[0].visit_date).toLocaleDateString() : 'N/A'}
            subtitle="Most recent record date"
            icon={<HistoryIcon />}
            color="#7c3aed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Workshop Status" 
            value="ACTIVE"
            subtitle="Clinical Audit Ready"
            icon={<SystemIcon />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>
      {/* WORKSHOP SHORTCUTS SECTION */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SystemIcon color="primary" /> Reporting Analytics Workshops
      </Typography>
      
      <Grid container spacing={2} mb={5}>
        <Grid item xs={12} sm={6} md={3}>
          <WorkshopCard 
            title="Treatment Outcomes" 
            subtitle="Efficacy & recovery analysis" 
            icon={<OutcomesIcon />} 
            color="#2563eb"
            onClick={() => console.log("Open Treatment Outcomes")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <WorkshopCard 
            title="Health Metrics" 
            subtitle="Vitals & BMI distribution" 
            icon={<HealthIcon />} 
            color="#16a34a"
            onClick={() => console.log("Open Health Metrics")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <WorkshopCard 
            title="Health History" 
            subtitle="Unified interaction timelines" 
            icon={<HistoryIcon />} 
            color="#7c3aed"
            onClick={() => console.log("Open Health History")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <WorkshopCard 
            title="System Audit" 
            subtitle="Administrative activity logs" 
            icon={<ReportIcon />} 
            color="#f59e0b"
            onClick={() => console.log("Open System Audit")}
          />
        </Grid>
      </Grid>

      {/* MASTER CLINICAL AUDIT LOG TABLE */}
      <Box sx={{ p: 3, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
              Master Clinical Activity Log
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
              Live monitoring of all institutional medical consultations
            </Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <TextField 
              size="small"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              }}
              sx={{ width: 280 }}
            />
            <Button startIcon={<RefreshIcon />} onClick={fetchRecords} size="small">Refresh</Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: '8px' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700 }}>
                  <TableSortLabel active={sortField === 'patient_name'} direction={sortField === 'patient_name' ? sortDirection : 'asc'} onClick={() => handleRequestSort('patient_name')}>
                    Patient Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700 }}>USC ID</TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700 }}>Diagnosis</TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700 }}>
                  <TableSortLabel active={sortField === 'visit_date'} direction={sortField === 'visit_date' ? sortDirection : 'asc'} onClick={() => handleRequestSort('visit_date')}>
                    Visit Date
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : getSortedRecords().length > 0 ? (
                getSortedRecords().map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.patient_name}</TableCell>
                    <TableCell>{row.patient_usc_id}</TableCell>
                    <TableCell>
                      <Chip label={row.diagnosis} size="small" variant="outlined" sx={{ fontWeight: 600, color: '#2563eb', borderColor: '#dbeafe', bgcolor: '#f0f9ff' }} />
                    </TableCell>
                    <TableCell>{new Date(row.visit_date).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary"><ViewIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No clinical activity found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default MedicalReports;
