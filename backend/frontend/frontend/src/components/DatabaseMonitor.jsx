import { useState, useEffect } from 'react';
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
    CircularProgress, 
    Alert,
    Button,
    Grid,
    Chip,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    Snackbar,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
    TextField,
    Stack,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Divider
} from '@mui/material';
import { 
    Storage,
    Backup,
    CloudUpload,
    CheckCircle,
    Error,
    Warning,
    Schedule,
    Refresh,
    Settings,
    History,
    Security,
    Download,
    Restore,
    FileUpload,
    Delete,
    Visibility,
    GetApp
} from '@mui/icons-material';
import { authService } from '../services/api';
import InfoTooltip from './utils/InfoTooltip';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`database-tabpanel-${index}`}
            aria-labelledby={`database-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const DatabaseMonitor = () => {
    const [tabValue, setTabValue] = useState(0);
    const [dbData, setDbData] = useState(null);
    const [backupData, setBackupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [backupLoading, setBackupLoading] = useState(false);
    const [error, setError] = useState(null);
    const [backupError, setBackupError] = useState(null);
    const [backupDialogOpen, setBackupDialogOpen] = useState(false);
    const [backupType, setBackupType] = useState('database');
    const [verifyBackup, setVerifyBackup] = useState(true);
    const [quickBackup, setQuickBackup] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [selectedBackupId, setSelectedBackupId] = useState(null);
    const [mergeStrategy, setMergeStrategy] = useState('replace');
    const [restorePreview, setRestorePreview] = useState(null);
    const [restoreLoading, setRestoreLoading] = useState(false);
    
    // Upload-related state
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadedBackups, setUploadedBackups] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadType, setUploadType] = useState('database');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    // Schedules state
    const [schedules, setSchedules] = useState([]);
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [newSchedule, setNewSchedule] = useState({ backup_type: 'database', schedule_type: 'daily', schedule_time: '01:00', is_active: true, retention_days: 7 });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dbResponse, backupResponse, backupListResponse, uploadedBackupsResponse, schedulesRes] = await Promise.all([
                authService.getDatabaseHealth(),
                authService.getBackupHealth(),
                authService.getBackupList(15), // Get last 15 backups
                authService.getUploadedBackups(10), // Get last 10 uploaded backups
                authService.getBackupSchedules()
            ]);
            setDbData(dbResponse);
            
            // Merge backup health data with recent backups list
            setBackupData({
                ...backupResponse,
                recent_backups: backupListResponse.backups || []
            });
            
            setUploadedBackups(uploadedBackupsResponse.backups || []);
            setSchedules(schedulesRes.schedules || []);
            
            setError(null);
            setBackupError(null);
        } catch (err) {
            console.error('Error fetching data:', err);
            if (err.message.includes('backup')) {
                setBackupError('Failed to fetch backup information');
            } else {
                setError('Failed to fetch database health information');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Set up periodic refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCreateBackup = async () => {
        setBackupLoading(true);
        try {
            const result = await authService.triggerManualBackup(backupType, verifyBackup, quickBackup);
            setSnackbar({
                open: true,
                message: `Backup initiated successfully! Backup ID: ${result.backup_id}`,
                severity: 'success'
            });
            setBackupDialogOpen(false);
            // Refresh backup data after a short delay
            setTimeout(fetchData, 2000);
        } catch (err) {
            setSnackbar({
                open: true,
                message: `Failed to create backup: ${err.message}`,
                severity: 'error'
            });
        } finally {
            setBackupLoading(false);
        }
    };

    const handleDownloadBackup = async (backupId) => {
        try {
            setSnackbar({
                open: true,
                message: 'Starting download...',
                severity: 'info'
            });

            const result = await authService.downloadBackup(backupId);
            
            setSnackbar({
                open: true,
                message: `Backup downloaded successfully: ${result.filename}`,
                severity: 'success'
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: `Failed to download backup: ${err.message}`,
                severity: 'error'
            });
        }
    };

    const handleVerifyDryRun = async (backupId) => {
        try {
            const res = await authService.verifyBackupDryRun(backupId);
            setSnackbar({ open: true, message: res.valid ? `Dry-run OK: ${res.message}` : `Dry-run failed: ${res.message}` , severity: res.valid ? 'success' : 'error' });
        } catch (err) {
            setSnackbar({ open: true, message: `Dry-run error: ${err.message}`, severity: 'error' });
        }
    };

    const handleCreateSchedule = async () => {
        try {
            await authService.createBackupSchedule(newSchedule);
            setSnackbar({ open: true, message: 'Schedule created', severity: 'success' });
            setScheduleDialogOpen(false);
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: `Failed to create schedule: ${err.message}`, severity: 'error' });
        }
    };

    const handleToggleSchedule = async (id) => {
        try {
            await authService.toggleBackupSchedule(id);
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: `Failed to toggle schedule: ${err.message}`, severity: 'error' });
        }
    };

    const handleRunScheduleNow = async (id) => {
        try {
            const res = await authService.runBackupScheduleNow(id);
            setSnackbar({ open: true, message: `Run started (backup #${res.backup_id})`, severity: 'info' });
            setTimeout(fetchData, 2000);
        } catch (err) {
            setSnackbar({ open: true, message: `Failed to run schedule: ${err.message}`, severity: 'error' });
        }
    };

    const handleRestoreBackup = (backupId) => {
        setSelectedBackupId(backupId);
        setRestoreDialogOpen(true);
        setRestorePreview(null);
        setMergeStrategy('replace');
    };

    const handlePreviewRestore = async () => {
        if (!selectedBackupId) return;
        
        setRestoreLoading(true);
        try {
            const preview = await authService.previewRestore(selectedBackupId, mergeStrategy);
            setRestorePreview(preview);
            
            setSnackbar({
                open: true,
                message: 'Restore preview generated successfully',
                severity: 'info'
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: `Failed to preview restore: ${err.message}`,
                severity: 'error'
            });
        } finally {
            setRestoreLoading(false);
        }
    };

    const handleConfirmRestore = async () => {
        if (!selectedBackupId) return;
        
        setRestoreLoading(true);
        try {
            const result = await authService.restoreBackup(selectedBackupId, mergeStrategy);
            
            setSnackbar({
                open: true,
                message: `Backup restored successfully! Created: ${result.restore_result.records_created}, Updated: ${result.restore_result.records_updated}`,
                severity: 'success'
            });
            
            setRestoreDialogOpen(false);
            setSelectedBackupId(null);
            setRestorePreview(null);
            
            // Refresh data after restore
            setTimeout(fetchData, 1000);
        } catch (err) {
            setSnackbar({
                open: true,
                message: `Failed to restore backup: ${err.message}`,
                severity: 'error'
            });
        } finally {
            setRestoreLoading(false);
        }
    };

    // Upload handler functions
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUploadBackup = async () => {
        if (!selectedFile) {
            setSnackbar({
                open: true,
                message: 'Please select a backup file to upload',
                severity: 'warning'
            });
            return;
        }

        setUploadLoading(true);
        setUploadProgress(0);

        try {
            const result = await authService.uploadBackup(
                selectedFile,
                uploadType,
                uploadDescription
            );

            setSnackbar({
                open: true,
                message: `Backup uploaded successfully! ID: ${result.backup_id}`,
                severity: 'success'
            });

            // Reset form and close dialog
            setSelectedFile(null);
            setUploadDescription('');
            setUploadDialogOpen(false);
            
            // Refresh data
            setTimeout(fetchData, 1000);

        } catch (err) {
            setSnackbar({
                open: true,
                message: `Failed to upload backup: ${err.message}`,
                severity: 'error'
            });
        } finally {
            setUploadLoading(false);
            setUploadProgress(0);
        }
    };

    const handleRestoreUploadedBackup = async (backupId, previewOnly = true) => {
        setRestoreLoading(true);
        try {
            const result = await authService.restoreUploadedBackup(
                backupId,
                mergeStrategy,
                previewOnly
            );

            if (previewOnly) {
                setRestorePreview(result);
                setSnackbar({
                    open: true,
                    message: `Preview: Would restore ${result.total_records || result.file_count || 'multiple'} items`,
                    severity: 'info'
                });
            } else {
                setSnackbar({
                    open: true,
                    message: 'Backup restored successfully!',
                    severity: 'success'
                });
                // Refresh data after restore
                setTimeout(fetchData, 1000);
            }
        } catch (err) {
            setSnackbar({
                open: true,
                message: `Failed to restore backup: ${err.message}`,
                severity: 'error'
            });
        } finally {
            setRestoreLoading(false);
        }
    };

    const handleDeleteUploadedBackup = async (backupId) => {
        try {
            await authService.deleteUploadedBackup(backupId);
            setSnackbar({
                open: true,
                message: 'Uploaded backup deleted successfully!',
                severity: 'success'
            });
            // Refresh data
            setTimeout(fetchData, 500);
        } catch (err) {
            setSnackbar({
                open: true,
                message: `Failed to delete backup: ${err.message}`,
                severity: 'error'
            });
        }
    };

    const getHealthStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'healthy':
            case 'success':
                return <CheckCircle sx={{ color: 'green' }} />;
            case 'warning':
                return <Warning sx={{ color: 'orange' }} />;
            case 'error':
            case 'failed':
            case 'critical':
                return <Error sx={{ color: 'red' }} />;
            default:
                return <Warning sx={{ color: 'gray' }} />;
        }
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString();
    };

    const formatFileSize = (sizeInMB) => {
        if (!sizeInMB) return 'N/A';
        if (sizeInMB < 1) return `${(sizeInMB * 1024).toFixed(1)} KB`;
        if (sizeInMB < 1024) return `${sizeInMB.toFixed(1)} MB`;
        return `${(sizeInMB / 1024).toFixed(2)} GB`;
    };

    if (loading && !dbData && !backupData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" gutterBottom>
                        Database & Backup Monitor
                    </Typography>
                    <InfoTooltip title="Check database health, manage backups, view history, and upload/restore backups." />
                </Box>
                <Box>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={fetchData} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="database monitor tabs">
                    <Tab 
                        icon={<Storage />} 
                        label="Database Health" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<Backup />} 
                        label="Backup Management" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<History />} 
                        label="Backup History" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<FileUpload />} 
                        label="Upload & Restore" 
                        iconPosition="start"
                    />
                </Tabs>
            </Box>

            {/* Database Health Tab */}
            <TabPanel value={tabValue} index={0}>
                {error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <>
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Database Status</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {getHealthStatusIcon(dbData?.overall_status)}
                                <Typography variant="body1" sx={{ ml: 1, mr: 2 }}>Status:</Typography>
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        color: dbData?.overall_status === 'healthy' ? 'green' : 'red',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {dbData?.overall_status?.toUpperCase() || 'UNKNOWN'}
                                </Typography>
                            </Box>
                            <Typography variant="body1">Database Size: {dbData?.checks?.storage?.size || 'Unknown'}</Typography>
                            <Typography variant="body1">Active Connections: {dbData?.checks?.connection?.active_connections || 'Unknown'}</Typography>
                        </Paper>

                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Tables</Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Table Name</TableCell>
                                            <TableCell align="right">Columns</TableCell>
                                            <TableCell align="right">Rows</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {dbData?.tables?.map((table, index) => (
                                            <TableRow key={index}>
                                                <TableCell component="th" scope="row">{table.name}</TableCell>
                                                <TableCell align="right">{table.columns}</TableCell>
                                                <TableCell align="right">{table.rows}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </>
                )}
            </TabPanel>

            {/* Backup Management Tab */}
            <TabPanel value={tabValue} index={1}>
                {backupError ? (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {backupError}
                        <Button onClick={fetchData} sx={{ ml: 2 }}>Retry</Button>
                    </Alert>
                ) : (
                    <>
                        {/* System Health Overview */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Security sx={{ mr: 1 }} />
                                            <Typography variant="h6">System Health</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {getHealthStatusIcon(backupData?.backup_summary?.health_status)}
                                            <Typography 
                                                variant="h6" 
                                                sx={{ 
                                                    ml: 1,
                                                    color: backupData?.system_health?.backup_system_healthy ? 'green' : 'red'
                                                }}
                                            >
                                                {backupData?.system_health?.backup_system_healthy ? 'Healthy' : 'Issues Detected'}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Schedule sx={{ mr: 1 }} />
                                            <Typography variant="h6">Last Backup</Typography>
                                        </Box>
                                        <Typography variant="body1">
                                            {backupData?.system_health?.last_successful_backup 
                                                ? formatDateTime(backupData.system_health.last_successful_backup)
                                                : 'No recent backups'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <CloudUpload sx={{ mr: 1 }} />
                                            <Typography variant="h6">Actions</Typography>
                                        </Box>
                                        <Button 
                                            variant="contained" 
                                            startIcon={<Backup />}
                                            onClick={() => setBackupDialogOpen(true)}
                                            disabled={backupLoading}
                                        >
                                            Create Backup
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Backup Statistics */}
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Backup Statistics</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary">
                                            {backupData?.statistics?.total_backups || 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Total Backups
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="success.main">
                                            {backupData?.statistics?.successful_backups || 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Successful
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="error.main">
                                            {backupData?.statistics?.failed_backups || 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Failed
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="info.main">
                                            {backupData?.kpis?.success_rate_7d !== undefined 
                                                ? `${(backupData.kpis.success_rate_7d * 100).toFixed(1)}%`
                                                : 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Success Rate (7d)
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* KPIs */}
                        {backupData?.kpis && (
                            <Paper sx={{ p: 2, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Key Performance Indicators</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Card><CardContent>
                                            <Typography variant="body2">Success 24h</Typography>
                                            <Typography variant="h5">{(backupData.kpis.success_rate_24h * 100).toFixed(1)}%</Typography>
                                        </CardContent></Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Card><CardContent>
                                            <Typography variant="body2">Avg Duration (7d)</Typography>
                                            <Typography variant="h5">{backupData.kpis.avg_duration_7d_sec ? `${Math.round(backupData.kpis.avg_duration_7d_sec)}s` : 'N/A'}</Typography>
                                        </CardContent></Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Card><CardContent>
                                            <Typography variant="body2">Avg Size (7d)</Typography>
                                            <Typography variant="h5">{backupData.kpis.avg_size_7d_bytes ? `${(backupData.kpis.avg_size_7d_bytes/1024/1024).toFixed(1)} MB` : 'N/A'}</Typography>
                                        </CardContent></Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Card><CardContent>
                                            <Typography variant="body2">Last Verification</Typography>
                                            <Typography variant="h6">{backupData.kpis.last_verification ? formatDateTime(backupData.kpis.last_verification) : 'N/A'}</Typography>
                                        </CardContent></Card>
                                    </Grid>
                                </Grid>
                                {backupData.kpis.retention_issues && backupData.kpis.retention_issues.length > 0 && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        Retention issues detected: {backupData.kpis.retention_issues.length}
                                    </Alert>
                                )}
                            </Paper>
                        )}

                        {/* Schedules */}
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">Backup Schedules</Typography>
                                <Button variant="contained" onClick={() => setScheduleDialogOpen(true)} startIcon={<Schedule />}>New Schedule</Button>
                            </Box>
                            {schedules && schedules.length > 0 ? (
                                <TableContainer sx={{ mt: 2 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Type</TableCell>
                                                <TableCell>When</TableCell>
                                                <TableCell>Active</TableCell>
                                                <TableCell>Retention</TableCell>
                                                <TableCell>Next Run</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {schedules.map(s => (
                                                <TableRow key={s.id}>
                                                    <TableCell><Chip label={s.backup_type.toUpperCase()} size="small" /></TableCell>
                                                    <TableCell>{s.schedule_type.toUpperCase()} @ {s.schedule_time}</TableCell>
                                                    <TableCell><Chip label={s.is_active ? 'ON' : 'OFF'} color={s.is_active ? 'success' : 'default'} size="small" /></TableCell>
                                                    <TableCell>{s.retention_days} days</TableCell>
                                                    <TableCell>{s.next_run_time ? formatDateTime(s.next_run_time) : 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Button size="small" onClick={() => handleToggleSchedule(s.id)}>Toggle</Button>
                                                        <Button size="small" onClick={() => handleRunScheduleNow(s.id)} startIcon={<Backup />}>Run Now</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="info" sx={{ mt: 2 }}>No schedules configured.</Alert>
                            )}
                        </Paper>

                        {/* Health Recommendations */}
                        {backupData?.health_recommendations?.length > 0 && (
                            <Paper sx={{ p: 2, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Recommendations</Typography>
                                {backupData.health_recommendations.map((rec, index) => (
                                    <Alert 
                                        key={index} 
                                        severity={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                                        sx={{ mb: 1 }}
                                    >
                                        <Typography variant="body2">
                                            <strong>{rec.action}:</strong> {rec.message}
                                        </Typography>
                                    </Alert>
                                ))}
                            </Paper>
                        )}
                    </>
                )}
            </TabPanel>

            {/* Backup History Tab */}
            <TabPanel value={tabValue} index={2}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Recent Backup History</Typography>
                    {backupData?.recent_backups?.length > 0 ? (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Started</TableCell>
                                        <TableCell>Duration</TableCell>
                                        <TableCell>Size</TableCell>
                                        <TableCell>Recent</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {backupData.recent_backups.map((backup) => (
                                        <TableRow key={backup.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {getHealthStatusIcon(backup.status)}
                                                    <Chip 
                                                        label={backup.status.toUpperCase()} 
                                                        color={
                                                            backup.status === 'success' ? 'success' : 
                                                            backup.status === 'failed' ? 'error' : 'warning'
                                                        }
                                                        size="small"
                                                        sx={{ ml: 1 }}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={backup.backup_type.toUpperCase()} 
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{formatDateTime(backup.started_at)}</TableCell>
                                            <TableCell>
                                                {backup.duration_seconds 
                                                    ? `${Math.round(backup.duration_seconds)}s` 
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell>{formatFileSize(backup.file_size_mb)}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={backup.is_recent ? 'Recent' : 'Old'} 
                                                    color={backup.is_recent ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<Download />}
                                                    onClick={() => handleDownloadBackup(backup.id)}
                                                    disabled={backup.status !== 'success'}
                                                    sx={{ mr: 1 }}
                                                >
                                                    Download
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<Visibility />}
                                                    onClick={() => handleVerifyDryRun(backup.id)}
                                                    disabled={backup.status !== 'success'}
                                                    sx={{ mr: 1 }}
                                                >
                                                    Verify (Dry)
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<Restore />}
                                                    onClick={() => handleRestoreBackup(backup.id)}
                                                    disabled={backup.status !== 'success' || backup.backup_type !== 'database'}
                                                    color="warning"
                                                    sx={{ mr: 1 }}
                                                >
                                                    Restore
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info">No backup history available</Alert>
                    )}
                </Paper>
            </TabPanel>

            {/* Upload & Restore Tab */}
            <TabPanel value={tabValue} index={3}>
                <Grid container spacing={3}>
                    {/* Upload Section */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <FileUpload sx={{ mr: 1 }} />
                                Upload Backup
                            </Typography>
                            <Stack spacing={2}>
                                <Button
                                    variant="contained"
                                    component="label"
                                    startIcon={<CloudUpload />}
                                    fullWidth
                                >
                                    Select Backup File
                                    <input
                                        type="file"
                                        hidden
                                        accept=".json,.gz,.zip"
                                        onChange={handleFileSelect}
                                    />
                                </Button>
                                
                                {selectedFile && (
                                    <Alert severity="info">
                                        Selected: {selectedFile.name} ({(selectedFile.size / (1024*1024)).toFixed(2)} MB)
                                    </Alert>
                                )}

                                <FormControl fullWidth>
                                    <InputLabel>Backup Type</InputLabel>
                                    <Select
                                        value={uploadType}
                                        label="Backup Type"
                                        onChange={(e) => setUploadType(e.target.value)}
                                    >
                                        <MenuItem value="database">Database (.json, .json.gz)</MenuItem>
                                        <MenuItem value="media">Media Files (.zip)</MenuItem>
                                        <MenuItem value="full">Full System (.zip)</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Description (Optional)"
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                    multiline
                                    rows={2}
                                    fullWidth
                                />

                                <Button
                                    variant="contained"
                                    onClick={handleUploadBackup}
                                    disabled={!selectedFile || uploadLoading}
                                    startIcon={uploadLoading ? <CircularProgress size={20} /> : <CloudUpload />}
                                    fullWidth
                                >
                                    {uploadLoading ? 'Uploading...' : 'Upload Backup'}
                                </Button>

                                {uploadLoading && (
                                    <LinearProgress variant="indeterminate" />
                                )}
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Uploaded Backups List */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <GetApp sx={{ mr: 1 }} />
                                Uploaded Backups ({uploadedBackups.length})
                            </Typography>
                            
                            {uploadedBackups.length > 0 ? (
                                <List>
                                    {uploadedBackups.map((backup, index) => (
                                        <div key={backup.id}>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <Chip 
                                                        label={backup.backup_type.toUpperCase()} 
                                                        color="primary"
                                                        size="small"
                                                    />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={backup.original_filename || `Backup ${backup.id}`}
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {backup.description || 'No description'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Size: {backup.file_size_mb?.toFixed(2)} MB | 
                                                                Uploaded: {formatDateTime(backup.uploaded_at)} |
                                                                Records: {backup.record_count || backup.file_count || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Tooltip title="Preview Restore">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleRestoreUploadedBackup(backup.id, true)}
                                                                disabled={restoreLoading}
                                                            >
                                                                <Visibility />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Restore Backup">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleRestoreUploadedBackup(backup.id, false)}
                                                                disabled={restoreLoading}
                                                            >
                                                                <Restore />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteUploadedBackup(backup.id)}
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                            {index < uploadedBackups.length - 1 && <Divider />}
                                        </div>
                                    ))}
                                </List>
                            ) : (
                                <Alert severity="info">
                                    No uploaded backups available. Upload a backup file to get started.
                                </Alert>
                            )}
                        </Paper>
                    </Grid>

                    {/* Upload Instructions */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Upload Instructions
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Alert severity="info">
                                        <Typography variant="subtitle2">Database Backups</Typography>
                                        Upload .json or .json.gz files containing Django fixture data.
                                        Max size: 500MB
                                    </Alert>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Alert severity="info">
                                        <Typography variant="subtitle2">Media Backups</Typography>
                                        Upload .zip files containing media files with directory structure.
                                        Max size: 500MB
                                    </Alert>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Alert severity="warning">
                                        <Typography variant="subtitle2">Full System Backups</Typography>
                                        Upload .zip files containing both database JSON and media files.
                                        Max size: 500MB
                                    </Alert>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Create Backup Dialog */}
            <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create Manual Backup</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Backup Type</InputLabel>
                            <Select
                                value={backupType}
                                onChange={(e) => setBackupType(e.target.value)}
                                label="Backup Type"
                            >
                                <MenuItem value="database">Database Only</MenuItem>
                                <MenuItem value="media">Media Files Only</MenuItem>
                                <MenuItem value="full">Complete System Backup</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={verifyBackup}
                                    onChange={(e) => setVerifyBackup(e.target.checked)}
                                />
                            }
                            label="Verify backup integrity after creation"
                        />
                        
                        {backupType === 'database' && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={quickBackup}
                                        onChange={(e) => setQuickBackup(e.target.checked)}
                                    />
                                }
                                label="Quick backup (exclude logs and reports for faster completion)"
                            />
                        )}
                        
                        <Alert severity="info" sx={{ mt: 2 }}>
                            {backupType === 'database' && (
                                quickBackup 
                                    ? 'Creates a fast database export of essential data (patient records, users, campaigns). Excludes logs and reports for faster completion.'
                                    : 'Creates a complete export of all database tables including patient records and system settings.'
                            )}
                            {backupType === 'media' && 'Backs up all uploaded files, images, and documents.'}
                            {backupType === 'full' && 'Creates a complete system backup including both database and media files. Note: This may take longer due to file uploads.'}
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleCreateBackup} 
                        variant="contained"
                        disabled={backupLoading}
                        startIcon={backupLoading ? <CircularProgress size={20} /> : <Backup />}
                    >
                        {backupLoading ? 'Creating...' : 'Create Backup'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Restore Backup Dialog */}
            <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Restore sx={{ mr: 1 }} />
                        Restore Backup
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        <strong>Warning:</strong> Restoring a backup will modify your current data. 
                        This action cannot be undone. Please review the restore plan carefully.
                    </Alert>

                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Merge Strategy</InputLabel>
                            <Select
                                value={mergeStrategy}
                                onChange={(e) => setMergeStrategy(e.target.value)}
                                label="Merge Strategy"
                            >
                                <MenuItem value="replace">Replace - Overwrite existing data with backup data</MenuItem>
                                <MenuItem value="merge">Merge - Only update empty/null fields</MenuItem>
                                <MenuItem value="skip">Skip - Only add new records, skip existing ones</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ mb: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={handlePreviewRestore}
                                disabled={restoreLoading || !selectedBackupId}
                                startIcon={<Settings />}
                                fullWidth
                            >
                                {restoreLoading ? 'Generating Preview...' : 'Preview Restore'}
                            </Button>
                        </Box>

                        {restorePreview && (
                            <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                                <Typography variant="h6" gutterBottom>Restore Preview</Typography>
                                
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="primary">
                                                {restorePreview.restore_plan.summary.total_records}
                                            </Typography>
                                            <Typography variant="body2">Total Records</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="success.main">
                                                {restorePreview.restore_plan.summary.new_records}
                                            </Typography>
                                            <Typography variant="body2">New Records</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="warning.main">
                                                {restorePreview.restore_plan.summary.existing_records}
                                            </Typography>
                                            <Typography variant="body2">Existing Records</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="error.main">
                                                {restorePreview.restore_plan.summary.conflicts}
                                            </Typography>
                                            <Typography variant="body2">Conflicts</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Models Affected:</strong> {restorePreview.restore_plan.summary.models_affected.join(', ')}
                                </Typography>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    <strong>Strategy:</strong> {mergeStrategy.toUpperCase()} - {
                                        mergeStrategy === 'replace' ? 'Existing data will be overwritten' :
                                        mergeStrategy === 'merge' ? 'Only empty fields will be updated' :
                                        'Existing records will be skipped'
                                    }
                                </Typography>

                                {restorePreview.restore_plan.conflicts.length > 0 && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        {restorePreview.restore_plan.conflicts.length} data conflicts detected. 
                                        Review your merge strategy carefully.
                                    </Alert>
                                )}

                                {restorePreview.restore_plan.safe_to_restore ? (
                                    <Alert severity="success" sx={{ mt: 2 }}>
                                        Safe to restore with current settings.
                                    </Alert>
                                ) : (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        Review conflicts before proceeding.
                                    </Alert>
                                )}
                            </Paper>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRestoreDialogOpen(false)} disabled={restoreLoading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmRestore}
                        variant="contained"
                        color="warning"
                        disabled={restoreLoading || !restorePreview}
                        startIcon={<Restore />}
                    >
                        {restoreLoading ? 'Restoring...' : 'Confirm Restore'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DatabaseMonitor;
