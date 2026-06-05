import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Grid,
  Stack,
  CircularProgress
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Search,
  FilterList,
  Refresh,
  History as HistoryIcon,
  Security,
  AccountCircle,
  Person,
  LocalHospital,
  MedicalServices,
  Description,
  Dns,
  VpnKey,
  Campaign as CampaignIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import { auditService, reportService } from '../services/api';
import dayjs from 'dayjs';

const SystemAuditWorkshop = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filtering
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [actorRoleFilter, setActorRoleFilter] = useState('');
  const [dateRange, setDateRange] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getTodayString = () => dayjs().format('YYYY-MM-DD');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        search: search,
        action_type: actionFilter,
        target_model: modelFilter,
        actor_role: actorRoleFilter,
        ordering: '-timestamp'
      };

      if (dateRange !== 'all') {
        if (dateRange === 'custom') {
          if (startDate) params.timestamp__gte = dayjs(startDate).startOf('day').toISOString();
          if (endDate) params.timestamp__lte = dayjs(endDate).endOf('day').toISOString();
        } else {
          const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 180;
          params.timestamp__gte = dayjs().subtract(days, 'day').startOf('day').toISOString();
        }
      }
      
      const response = await auditService.getLogs(params);
      setLogs(response.results);
      setTotalLogs(response.count);
      setError('');
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit trail. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, actionFilter, modelFilter, actorRoleFilter, dateRange, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle filter changes specifically to reset page
  useEffect(() => {
    setPage(0);
  }, [dateRange, startDate, endDate, search, actionFilter, modelFilter, actorRoleFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = async (format = 'PDF') => {
    try {
      setExporting(true);
      setError('');
      
      const payload = {
        title: `System Accountability & Audit Report - ${dayjs().format('MMM DD, YYYY')}`,
        export_format: format,
        date_range: dateRange,
        date_range_start: dateRange === 'custom' ? startDate : undefined,
        date_range_end: dateRange === 'custom' ? endDate : undefined,
        filters: {
          search: search,
          action_type: actionFilter,
          target_model: modelFilter,
          actor_role: actorRoleFilter
        }
      };

      // Generate report synchronously
      const response = await reportService.generateReport('USER_ACTIVITY', payload, { sync: 'true' });
      const reportId = response.data.report_id;

      if (reportId) {
        // Trigger direct download
        const downloadResponse = await reportService.downloadReport(reportId);
        
        // Create a blob from the response data
        const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        
        const extension = format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase();
        const filename = `System_Audit_Log_${dayjs().format('YYYYMMDD')}.${extension}`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setExportSuccess(`Audit report (${format}) downloaded successfully!`);
      } else {
        throw new Error('Failed to obtain report ID');
      }
      
      setTimeout(() => {
        setExportSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Export failed:', err);
      setError(`Failed to generate or download audit report (${format}).`);
    } finally {
      setExporting(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return theme.palette.success.main;
      case 'UPDATE': return theme.palette.info.main;
      case 'DELETE': return theme.palette.error.main;
      case 'LOGIN': return theme.palette.primary.main;
      case 'LOGOUT': return theme.palette.secondary.main;
      case 'GENERATE': return theme.palette.secondary.dark;
      case 'EXPORT': return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  };

  const getModuleConfig = (model, action) => {
    if (action === 'LOGIN' || action === 'LOGOUT') {
        return { icon: <VpnKey />, color: '#1a237e', label: 'Authentication' };
    }

    switch (model) {
      case 'User': return { icon: <AccountCircle />, color: '#1976d2', label: 'Authentication' };
      case 'MedicalRecord': return { icon: <LocalHospital />, color: '#d32f2f', label: 'Medical Records' };
      case 'DentalRecord': return { icon: <MedicalServices />, color: '#7b1fa2', label: 'Dental Records' };
      case 'PatientDocument': return { icon: <Description />, color: '#455a64', label: 'Uploads' };
      case 'MedicalCertificate': return { icon: <Description />, color: '#ed6c02', label: 'Certificates' };
      case 'GeneratedReport': return { icon: <DownloadIcon />, color: '#4527a0', label: 'Reports' };
      case 'HealthCampaign': return { icon: <CampaignIcon />, color: '#c2185b', label: 'Campaigns' };
      default: return { icon: <Dns />, color: '#757575', label: model };
    }
  };

  const generateSummary = (log) => {
    const actor = log.actor_name || log.actor_email || 'System';
    const action = log.action_type;
    const moduleConfig = getModuleConfig(log.target_model, action);
    const moduleLabel = (moduleConfig && moduleConfig.label) ? moduleConfig.label : (log.target_model || 'record');
    
    // 1. Extract context from changes_summary
    let context = log.changes_summary?.description;
    
    // If description is technical or missing, try to build a better one
    if (!context || String(context).includes('Object') || String(context).includes('at 0x')) {
        if (log.target_model === 'MedicalRecord' || log.target_model === 'DentalRecord') {
            context = `a visit record`;
        } else if (log.target_model === 'User') {
            context = `account for ${log.changes_summary?.email || 'a user'}`;
        } else if (log.target_model === 'GeneratedReport') {
            context = `report: ${log.changes_summary?.title || 'a system report'}`;
        } else {
            context = `a ${moduleLabel.toLowerCase()} record`;
        }
    }

    // 2. Handle specific actions
    if (action === 'LOGIN') return `${actor} successfully logged in to the system.`;
    if (action === 'LOGOUT') return `${actor} logged out.`;
    if (action === 'GENERATE') return `${actor} generated ${context}.`;
    if (action === 'EXPORT') return `${actor} exported/downloaded ${context}.`;
    
    // 3. Handle CRUD actions with context
    switch (action) {
        case 'CREATE': 
            return `${actor} created ${context}.`;
        case 'UPDATE': 
            const changedFields = log.changes_summary ? Object.keys(log.changes_summary).filter(k => k !== 'status' && k !== 'description') : [];
            if (changedFields.length > 0) {
                const fieldsList = changedFields.map(f => f.replace(/_/g, ' ')).join(', ');
                return `${actor} updated ${fieldsList} for ${context}.`;
            }
            return `${actor} updated ${context}.`;
        case 'DELETE': 
            return `${actor} removed ${context} from the system.`;
        default: 
            return `${actor} performed ${action.toLowerCase()} on ${context}.`;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark, display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 2, fontSize: 35 }} /> Admin System Audit
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Human-readable activity logging and clinical accountability.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
            <Button 
                variant="outlined" 
                startIcon={<Refresh />} 
                onClick={fetchLogs}
                disabled={loading}
            >
                Refresh
            </Button>
            <Button 
                variant="outlined" 
                size="small"
                onClick={() => handleExport('CSV')}
                disabled={loading || exporting}
            >
                CSV
            </Button>
            <Button 
                variant="outlined" 
                size="small"
                onClick={() => handleExport('EXCEL')}
                disabled={loading || exporting}
            >
                Excel
            </Button>
            <Button 
                variant="contained" 
                startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />} 
                onClick={() => handleExport('PDF')}
                disabled={loading || exporting}
                sx={{ bgcolor: theme.palette.success.main, '&:hover': { bgcolor: theme.palette.success.dark } }}
            >
                {exporting ? 'Processing...' : 'Export PDF'}
            </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {exportSuccess && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setExportSuccess(null)}>{exportSuccess}</Alert>}

      <Paper sx={{ mb: 3, p: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by user or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Reporting Range</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Reporting Range"
              >
                <MenuItem value="all">Full History</MenuItem>
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {dateRange === 'custom' && (
            <>
              <Grid item xs={12} md={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="From"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: endDate || getTodayString() }}
                />
              </Grid>
              <Grid item xs={12} md={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="To"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate, max: getTodayString() }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Actor Role</InputLabel>
              <Select
                value={actorRoleFilter}
                onChange={(e) => setActorRoleFilter(e.target.value)}
                label="Actor Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="ADMIN">Administrator</MenuItem>
                <MenuItem value="DOCTOR">Doctor</MenuItem>
                <MenuItem value="DENTIST">Dentist</MenuItem>
                <MenuItem value="NURSE">Nurse</MenuItem>
                <MenuItem value="STAFF">Staff</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Action Type</InputLabel>
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                label="Action Type"
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="CREATE">Create</MenuItem>
                <MenuItem value="UPDATE">Update</MenuItem>
                <MenuItem value="DELETE">Delete</MenuItem>
                <MenuItem value="LOGIN">Security: Login</MenuItem>
                <MenuItem value="LOGOUT">Security: Logout</MenuItem>
                <MenuItem value="GENERATE">System: Generate</MenuItem>
                <MenuItem value="EXPORT">System: Export/Download</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Module</InputLabel>
              <Select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                label="Module"
              >
                <MenuItem value="">All Modules</MenuItem>
                <MenuItem value="User">Authentication</MenuItem>
                <MenuItem value="MedicalRecord">Medical Records</MenuItem>
                <MenuItem value="DentalRecord">Dental Records</MenuItem>
                <MenuItem value="MedicalCertificate">Certificates</MenuItem>
                <MenuItem value="GeneratedReport">System Reports</MenuItem>
                <MenuItem value="HealthCampaign">Health Campaigns</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Compliance Banner */}
      <Alert 
        severity="info" 
        variant="outlined" 
        icon={<Security />}
        sx={{ mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.02) }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>ADMINISTRATIVE AUDIT NOTICE</Typography>
        <Typography variant="caption" color="text.secondary">
            All administrative and clinical activities are logged for accountability under the Data Privacy Act. System background tasks are filtered to focus on human user interactions.
        </Typography>
      </Alert>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: theme.shadows[3], width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1200 }}>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actor (Role/Email)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Module</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Action Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Change Summary</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <CircularProgress size={40} />
                  <Typography sx={{ mt: 2 }} color="text.secondary">Loading audit logs...</Typography>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <Typography color="text.secondary">No activity logs found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const module = getModuleConfig(log.target_model, log.action_type);
                return (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {dayjs(log.timestamp).format('MMM DD, YYYY')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(log.timestamp).format('hh:mm A')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {log.actor_role || 'System'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.actor_email || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={module.label} 
                        size="small" 
                        sx={{ 
                          bgcolor: alpha(module.color, 0.1), 
                          color: module.color,
                          fontWeight: 'bold',
                          borderRadius: 1
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.action_type} 
                        size="small" 
                        sx={{ 
                          bgcolor: alpha(getActionColor(log.action_type), 0.1), 
                          color: getActionColor(log.action_type),
                          fontWeight: 'bold',
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                        {generateSummary(log)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={totalLogs}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          * Audit logs are immutable and stored for clinical accountability as per institutional standards.
        </Typography>
      </Box>
    </Box>
  );
};

export default SystemAuditWorkshop;
