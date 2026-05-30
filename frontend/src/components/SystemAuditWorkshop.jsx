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
  Dns
} from '@mui/icons-material';
import { auditService } from '../services/api';
import dayjs from 'dayjs';

const SystemAuditWorkshop = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filtering
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  
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
  }, [page, rowsPerPage, search, actionFilter, modelFilter]);

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

  const renderChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return "No data changes captured.";
    
    if (changes.status === 'new' || changes.status === 'deleted') {
        return (
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {changes.status === 'new' ? 'Resource Created: ' : 'Resource Deleted: '}
                {changes.description || 'N/A'}
            </Typography>
        );
    }

    return (
      <Box sx={{ mt: 1 }}>
        {Object.entries(changes).map(([field, delta]) => (
          <Box key={field} sx={{ mb: 1, p: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: theme.palette.primary.dark }}>
              {field.replace(/_/g, ' ')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">FROM</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', color: theme.palette.error.main }}>
                  {delta.old === null || delta.old === 'None' ? '—' : String(delta.old)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">TO</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', color: theme.palette.success.main }}>
                  {delta.new === null || delta.new === 'None' ? '—' : String(delta.new)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        ))}
      </Box>
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
            Exhaustive administrative activity logging and field-level data tracking.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />} 
          onClick={fetchLogs}
          disabled={loading}
        >
          Refresh Logs
        </Button>
      </Stack>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by user email or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
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
                <MenuItem value="LOGIN">Login</MenuItem>
                <MenuItem value="LOGOUT">Logout</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Module/Model</InputLabel>
              <Select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                label="Module/Model"
              >
                <MenuItem value="">All Modules</MenuItem>
                <MenuItem value="User">User Management</MenuItem>
                <MenuItem value="Patient">Patient Profiles</MenuItem>
                <MenuItem value="MedicalRecord">Medical Consultations</MenuItem>
                <MenuItem value="DentalRecord">Dental Consultations</MenuItem>
                <MenuItem value="MedicalCertificate">Medical Certificates</MenuItem>
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

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: theme.shadows[3] }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <TableRow>
              <TableCell />
              <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actor</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Module</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Object ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                  <CircularProgress size={40} />
                  <Typography sx={{ mt: 2 }} color="text.secondary">Gathering audit trail...</Typography>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                  <Typography color="text.secondary">No activity logs found matching your criteria.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow 
                    hover 
                    sx={{ 
                        '& > *': { borderBottom: 'unset' },
                        bgcolor: expandedRow === log.id ? alpha(theme.palette.primary.main, 0.02) : 'inherit'
                    }}
                  >
                    <TableCell>
                      <IconButton size="small" onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}>
                        {expandedRow === log.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {dayjs(log.timestamp).format('MMM DD, YYYY')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(log.timestamp).format('hh:mm:ss A')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{log.actor_name || 'System'}</Typography>
                          <Typography variant="caption" color="text.secondary">{log.actor_email || 'automated-task@usc.edu'}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.action_type} 
                        size="small" 
                        sx={{ 
                          bgcolor: alpha(getActionColor(log.action_type), 0.1), 
                          color: getActionColor(log.action_type),
                          fontWeight: 'bold',
                          borderRadius: 1
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Dns sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{log.target_model}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1 }}>
                            #{log.target_object_id}
                        </Typography>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        startIcon={<Visibility />}
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      >
                        {expandedRow === log.id ? 'Hide' : 'View Changes'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expandable Row for Diff View */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                      <Collapse in={expandedRow === log.id} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, p: 2, bgcolor: '#fcfcfc', border: '1px solid #eee', borderRadius: 2 }}>
                          <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                            <EventNote sx={{ mr: 1, fontSize: 18 }} /> Activity Context & Data Mutations
                          </Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">REQUEST CONTEXT</Typography>
                                    <Stack spacing={1.5}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                                <Devices sx={{ mr: 1, fontSize: 14 }} /> IP ADDRESS
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{log.ip_address || 'N/A'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                                <Person sx={{ mr: 1, fontSize: 14 }} /> ACTOR ROLE
                                            </Typography>
                                            <Typography variant="body2">{log.actor_role || 'N/A'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>USER AGENT</Typography>
                                            <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', lineHeight: 1.2 }}>
                                                {log.user_agent || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">FIELD-LEVEL CHANGES (DIFF)</Typography>
                                    {renderChanges(log.changes_summary)}
                                </Paper>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalLogs}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          * Audit logs are immutable and stored for system-wide accountability as per USC Clinical Data Standards.
        </Typography>
      </Box>
    </Box>
  );
};

export default SystemAuditWorkshop;
