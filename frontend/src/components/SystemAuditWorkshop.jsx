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
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Grid,
  Stack,
  Divider,
  CircularProgress,
  Collapse
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Search,
  FilterList,
  Refresh,
  History as HistoryIcon,
  Visibility,
  KeyboardArrowDown,
  KeyboardArrowUp,
  EventNote,
  Person,
  Devices,
  Dns,
  LocalHospital,
  MedicalServices,
  AccountCircle,
  Description,
  ArrowForward,
  InfoOutlined,
  Security,
  AssignmentTurnedIn,
  Settings,
  Group,
  VpnKey,
  Shield,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import { auditService, reportService } from '../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const SystemAuditWorkshop = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null);
  
  // Workshop Mode
  const [viewMode, setViewMode] = useState('clinical'); // 'clinical' or 'forensic'
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filtering
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [actorRoleFilter, setActorRoleFilter] = useState('');
  
  // Expandable row state
  const [expandedRow, setExpandedRow] = useState(null);

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
  }, [page, rowsPerPage, search, actionFilter, modelFilter, actorRoleFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError('');
      
      const payload = {
        title: `System Accountability & Audit Report - ${dayjs().format('MMM DD, YYYY')}`,
        export_format: 'PDF',
        filters: {
          search: search,
          action_type: actionFilter,
          target_model: modelFilter,
          actor_role: actorRoleFilter
        }
      };

      const response = await reportService.generateReport('USER_ACTIVITY', payload);
      setExportSuccess(`Audit report generation initialized! ID: ${response.data.report_id}`);
      
      setTimeout(() => {
        setExportSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to initialize audit report generation.');
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
      default: return theme.palette.grey[500];
    }
  };

  const getModuleConfig = (model, action) => {
    if (action === 'LOGIN' || action === 'LOGOUT') {
        return { icon: <VpnKey />, color: '#1a237e', label: 'System Access' };
    }

    switch (model) {
      case 'User': return { icon: <AccountCircle />, color: '#1976d2', label: 'User Management' };
      case 'Patient': return { icon: <Person />, color: '#2e7d32', label: 'Patient Profile' };
      case 'MedicalRecord': return { icon: <LocalHospital />, color: '#d32f2f', label: 'Medical Consultation' };
      case 'DentalRecord': return { icon: <MedicalServices />, color: '#7b1fa2', label: 'Dental Consultation' };
      case 'MedicalCertificate': return { icon: <Description />, color: '#ed6c02', label: 'Medical Certificate' };
      default: return { icon: <Dns />, color: '#757575', label: model };
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return <Shield sx={{ fontSize: 16 }} />;
      case 'DOCTOR': 
      case 'DENTIST': return <LocalHospital sx={{ fontSize: 16 }} />;
      case 'NURSE': return <AssignmentTurnedIn sx={{ fontSize: 16 }} />;
      case 'STAFF': return <Group sx={{ fontSize: 16 }} />;
      default: return <Person sx={{ fontSize: 16 }} />;
    }
  };

  const maskIP = (ip) => {
    if (!ip) return 'Internal';
    const parts = ip.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.X`;
    }
    return ip;
  };

  const generateSummary = (log) => {
    const actor = log.actor_name || 'System';
    const action = log.action_type;
    const module = getModuleConfig(log.target_model, action).label;
    
    if (action === 'LOGIN') return `${actor} entered the system.`;
    if (action === 'LOGOUT') return `${actor} left the system.`;
    
    let description = log.changes_summary?.description || `record #${log.target_object_id}`;
    
    // Clean up description if it's too technical
    if (description.includes('Object') || description.includes('at 0x')) {
        description = `record #${log.target_object_id}`;
    }

    switch (action) {
        case 'CREATE': return `${actor} created a new ${module.toLowerCase()} (${description}).`;
        case 'UPDATE': 
            const changedFields = log.changes_summary ? Object.keys(log.changes_summary).filter(k => k !== 'status' && k !== 'description') : [];
            if (changedFields.length === 1) {
                return `${actor} updated ${changedFields[0].replace(/_/g, ' ')} for ${module.toLowerCase()}.`;
            }
            return `${actor} updated ${changedFields.length} data points in ${module.toLowerCase()}.`;
        case 'DELETE': return `${actor} removed a ${module.toLowerCase()} from the system.`;
        default: return `${actor} performed ${action.toLowerCase()} on ${module.toLowerCase()}.`;
    }
  };

  const renderChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return (
        <Alert severity="info" variant="outlined" icon={<InfoOutlined />}>
            No deep field-level changes were captured for this event.
        </Alert>
    );
    
    const fieldEntries = Object.entries(changes).filter(([k]) => k !== 'status' && k !== 'description');

    if (changes.status === 'new' || changes.status === 'deleted') {
        return (
            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2, border: '1px dashed', borderColor: theme.palette.divider }}>
                <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlined fontSize="small" color="info" />
                    {changes.status === 'new' ? 'Full record initialization summary:' : 'Record removal context:'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                    {changes.description || 'N/A'}
                </Typography>
            </Box>
        );
    }

    if (fieldEntries.length === 0) return (
        <Alert severity="info" variant="outlined">
            Only metadata changed for this record.
        </Alert>
    );

    return (
      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {fieldEntries.map(([field, delta]) => (
          <Paper key={field} variant="outlined" sx={{ p: 1.5, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ 
                position: 'absolute', 
                left: 0, 
                top: 0, 
                bottom: 0, 
                width: 4, 
                bgcolor: theme.palette.info.main 
            }} />
            <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: theme.palette.primary.dark, display: 'block', mb: 1 }}>
              {field.replace(/_/g, ' ')}
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={5.5}>
                <Box sx={{ p: 1, bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1) }}>
                    <Typography variant="caption" color="error.dark" sx={{ fontWeight: 'bold', display: 'block' }}>PREVIOUS STATE</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {delta.old === null || delta.old === 'None' || delta.old === '' ? <Typography component="span" variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>EMPTY</Typography> : String(delta.old)}
                    </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowForward color="disabled" />
              </Grid>
              
              <Grid item xs={5.5}>
                <Box sx={{ p: 1, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1) }}>
                    <Typography variant="caption" color="success.dark" sx={{ fontWeight: 'bold', display: 'block' }}>UPDATED STATE</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', fontWeight: 500 }}>
                        {delta.new === null || delta.new === 'None' || delta.new === '' ? <Typography component="span" variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>EMPTY</Typography> : String(delta.new)}
                    </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark, display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 2, fontSize: 35 }} /> System Audit Workshop
          </Typography>
          <Typography variant="body1" color="text.secondary">
            High-level clinical accountability and system security monitoring.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Workshop Mode</InputLabel>
                <Select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    label="Workshop Mode"
                    sx={{ bgcolor: 'white' }}
                >
                    <MenuItem value="clinical">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Visibility fontSize="small" color="primary" />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Clinical Activity Feed</Typography>
                        </Stack>
                    </MenuItem>
                    <MenuItem value="forensic">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Settings fontSize="small" color="secondary" />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Forensic Audit Trail</Typography>
                        </Stack>
                    </MenuItem>
                </Select>
            </FormControl>
            <Button 
                variant="outlined" 
                startIcon={<Refresh />} 
                onClick={fetchLogs}
                disabled={loading}
            >
                Refresh
            </Button>
            <Button 
                variant="contained" 
                startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />} 
                onClick={handleExport}
                disabled={loading || exporting}
                sx={{ bgcolor: theme.palette.success.main, '&:hover': { bgcolor: theme.palette.success.dark } }}
            >
                {exporting ? 'Processing...' : 'Export Audit Log'}
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
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Clinical Module</InputLabel>
              <Select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                label="Clinical Module"
              >
                <MenuItem value="">All Modules</MenuItem>
                <MenuItem value="User">User Accounts</MenuItem>
                <MenuItem value="Patient">Patient Profiles</MenuItem>
                <MenuItem value="MedicalRecord">Consultations</MenuItem>
                <MenuItem value="DentalRecord">Dental</MenuItem>
                <MenuItem value="MedicalCertificate">Certificates</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
                fullWidth 
                variant="contained" 
                startIcon={<FilterList />}
                onClick={() => setPage(0)}
            >
                Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Data Privacy & Compliance Banner */}
      <Alert 
        severity="info" 
        variant="outlined" 
        icon={<Security />}
        sx={{ mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.02) }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>DATA PRIVACY & SECURITY COMPLIANCE NOTICE</Typography>
        <Typography variant="caption" color="text.secondary">
            System logs are mandatory under the Data Privacy Act to ensure clinical accountability. Access monitoring (Login/Logout) is logged to protect sensitive patient records and detect unauthorized access.
        </Typography>
      </Alert>

      {viewMode === 'clinical' ? (
        <Box sx={{ minHeight: 400 }}>
            {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }} color="text.secondary">Gathering activity feed...</Typography>
                </Box>
            ) : logs.length === 0 ? (
                <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 3, border: '1px dashed #ccc' }}>
                    <Typography color="text.secondary">No clinical activities found matching your filters.</Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {logs.map((log) => {
                        const module = getModuleConfig(log.target_model, log.action_type);
                        const isSecurity = log.action_type === 'LOGIN' || log.action_type === 'LOGOUT';
                        
                        return (
                            <Paper 
                                key={log.id} 
                                elevation={0} 
                                sx={{ 
                                    p: 2, 
                                    borderRadius: 3, 
                                    border: '1px solid',
                                    borderColor: isSecurity ? alpha(theme.palette.info.main, 0.3) : '#eee',
                                    bgcolor: isSecurity ? alpha(theme.palette.info.main, 0.02) : 'white',
                                    '&:hover': { boxShadow: theme.shadows[2] },
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item>
                                        <Box sx={{ 
                                            width: 48, 
                                            height: 48, 
                                            borderRadius: '50%', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            bgcolor: alpha(module.color, 0.1),
                                            color: module.color
                                        }}>
                                            {isSecurity ? <Security /> : module.icon}
                                        </Box>
                                    </Grid>
                                    <Grid item xs>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {generateSummary(log)}
                                            </Typography>
                                            <Chip 
                                                label={module.label} 
                                                size="small" 
                                                sx={{ 
                                                    height: 20, 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 'bold',
                                                    bgcolor: alpha(module.color, 0.1),
                                                    color: module.color
                                                }} 
                                            />
                                        </Stack>
                                        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                {getRoleIcon(log.actor_role)}
                                                <Box component="span" sx={{ ml: 0.5, fontWeight: 500 }}>{log.actor_role}</Box>
                                                <Box component="span" sx={{ mx: 0.5 }}>•</Box>
                                                {log.actor_email}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Devices sx={{ fontSize: 12, mr: 0.5 }} /> {maskIP(log.ip_address)}
                                            </Typography>
                                        </Stack>
                                    </Grid>
                                    <Grid item sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                            {dayjs(log.timestamp).fromNow()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {dayjs(log.timestamp).format('MMM DD, hh:mm A')}
                                        </Typography>
                                        <Button 
                                            size="small" 
                                            sx={{ mt: 1, textTransform: 'none' }}
                                            onClick={() => {
                                                setExpandedRow(log.id);
                                                setViewMode('forensic');
                                            }}
                                        >
                                            Inspect Data
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                        );
                    })}
                </Stack>
            )}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: theme.shadows[3], overflow: 'hidden' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <TableRow>
              <TableCell width={50} />
              <TableCell sx={{ fontWeight: 'bold' }}>Activity Timeline</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Summary of Action</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Security Context</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <CircularProgress size={40} />
                  <Typography sx={{ mt: 2 }} color="text.secondary">Gathering system audit trail...</Typography>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <Typography color="text.secondary">No activity logs found matching your criteria.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const module = getModuleConfig(log.target_model, log.action_type);
                return (
                  <React.Fragment key={log.id}>
                    <TableRow 
                      hover 
                      sx={{ 
                          '& > *': { borderBottom: 'unset' },
                          bgcolor: expandedRow === log.id ? alpha(theme.palette.primary.main, 0.02) : 'inherit',
                          transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <IconButton size="small" onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}>
                          {expandedRow === log.id ? <KeyboardArrowUp color="primary" /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {dayjs(log.timestamp).format('MMM DD, YYYY')}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                                bgcolor: alpha(theme.palette.divider, 0.5), 
                                px: 0.5, 
                                borderRadius: 0.5, 
                                width: 'fit-content',
                                fontFamily: 'monospace'
                            }}>
                                {dayjs(log.timestamp).format('hh:mm:ss A')}
                            </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
                            {generateSummary(log)}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                             <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Person sx={{ fontSize: 12, mr: 0.5 }} /> {log.actor_email || 'System'}
                             </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={React.cloneElement(module.icon, { style: { fontSize: 16, color: 'inherit' } })}
                          label={module.label} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(module.color, 0.1), 
                            color: module.color,
                            fontWeight: 'bold',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: alpha(module.color, 0.2)
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                            <Chip 
                                label={log.action_type} 
                                size="small" 
                                sx={{ 
                                    bgcolor: alpha(getActionColor(log.action_type), 0.1), 
                                    color: getActionColor(log.action_type),
                                    fontWeight: 'bold',
                                    height: 18,
                                    fontSize: '0.65rem'
                                }} 
                            />
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                <Devices sx={{ fontSize: 10, mr: 0.5 }} /> {log.ip_address || 'Internal'}
                            </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          variant={expandedRow === log.id ? "contained" : "text"}
                          startIcon={<Visibility />}
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          sx={{ borderRadius: 2 }}
                        >
                          {expandedRow === log.id ? 'Hide' : 'Details'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expandable Row for Diff View */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={expandedRow === log.id} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2, p: 3, bgcolor: '#fcfcfc', border: '1px solid #eee', borderRadius: 3, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                            <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 2 }}>
                              <EventNote sx={{ mr: 1, fontSize: 18, color: theme.palette.primary.main }} /> Data Mutation & Request Context
                            </Typography>
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={4}>
                                  <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                                      <Typography variant="caption" color="text.secondary" gutterBottom display="block" sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Origin Metadata</Typography>
                                      <Stack spacing={2} sx={{ mt: 2 }}>
                                          <Box>
                                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                  <Devices sx={{ mr: 1, fontSize: 14 }} /> NETWORK IP ADDRESS
                                              </Typography>
                                              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 0.5, borderRadius: 0.5, width: 'fit-content' }}>{log.ip_address || 'N/A'}</Typography>
                                          </Box>
                                          <Box>
                                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                  <AccountCircle sx={{ mr: 1, fontSize: 14 }} /> ACTOR PERMISSION ROLE
                                              </Typography>
                                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{log.actor_role || 'N/A'}</Typography>
                                          </Box>
                                          <Divider />
                                          <Box>
                                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>HTTP USER AGENT</Typography>
                                              <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', lineHeight: 1.4, color: 'text.secondary', bgcolor: '#fafafa', p: 1, borderRadius: 1 }}>
                                                  {log.user_agent || 'System/Automated'}
                                              </Typography>
                                          </Box>
                                          <Box>
                                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>OBJECT REFERENCE</Typography>
                                              <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#e3f2fd', color: '#1565c0', px: 1, py: 0.5, borderRadius: 1 }}>
                                                  {log.target_model} ID: {log.target_object_id}
                                              </Typography>
                                          </Box>
                                      </Stack>
                                  </Paper>
                              </Grid>
                              <Grid item xs={12} md={8}>
                                  <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                                      <Typography variant="caption" color="text.secondary" gutterBottom display="block" sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Field-Level Audit Trail (Old vs. New)</Typography>
                                      <Box sx={{ mt: 2 }}>
                                        {renderChanges(log.changes_summary)}
                                      </Box>
                                  </Paper>
                              </Grid>
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={totalLogs}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          * Audit logs are immutable and stored for system-wide accountability as per USC Clinical Data Standards.
        </Typography>
      </Box>
    </Box>
  );
};

export default SystemAuditWorkshop;
