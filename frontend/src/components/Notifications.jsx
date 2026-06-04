import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemButton,
    Chip,
    Button,
    IconButton,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Grid,
    TextField,
    MenuItem,
    Tooltip,
    Menu,
    MenuItem as MenuItemComponent,
    Divider,
    FormControl,
    InputLabel,
    Select,
    Alert,
    Snackbar,
    CircularProgress,
    Paper,
    TablePagination
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    NotificationImportant,
    Schedule,
    CheckCircle,
    Info,
    Refresh,
    Settings,
    MarkEmailRead,
    Search,
    Campaign,
    MoreVert,
    Delete,
    DeleteSweep
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { setUnreadCount, decrementUnreadCount } from '../features/notificationSlice';
import InfoTooltip from './utils/InfoTooltip';
import { notificationService, authService } from '../services/api';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`notification-tabpanel-${index}`}
            aria-labelledby={`notification-tab-${index}`}
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

const Notifications = () => {
    const dispatch = useDispatch();
    const [currentTab, setCurrentTab] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    
    // Ref to track component mount status
    const isMountedRef = useRef(true);
    
    // Cleanup on unmount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await authService.getCurrentUser();
                if (isMountedRef.current) {
                    setCurrentUser(response.data);
                }
            } catch (err) {
                console.error('Error fetching current user:', err);
            }
        };

        fetchUser();

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((term) => {
            if (isMountedRef.current) {
                setSearchTerm(term);
            }
        }, 300),
        []
    );

    // Load data with dependency on filters and current tab
    useEffect(() => {
        if (isMountedRef.current) {
            setPage(0); // Reset to first page on filter change
            loadNotifications(0, rowsPerPage);
        }
    }, [currentTab, searchTerm, typeFilter, statusFilter]);

    useEffect(() => {
        if (isMountedRef.current) {
            loadUnreadNotifications();
            loadStats();
        }
        
        // ... (rest of useEffect remains same)

        // Polling mechanism
        const pollInterval = 30000; // 30 seconds
        let timeoutId;

        const poll = async () => {
            // Only poll if window is visible to save resources
            if (document.visibilityState === 'visible' && isMountedRef.current) {
                try {
                    // We only background refresh unread count and stats to be lightweight
                    // The full list refresh happens only if user manually refreshes or filters change
                    // This prevents the list from jumping around while reading
                    await Promise.all([
                        loadUnreadNotifications(),
                        loadStats()
                    ]);
                } catch (error) {
                    console.debug('Background polling failed:', error);
                }
            }
            timeoutId = setTimeout(poll, pollInterval);
        };

        // Start polling
        timeoutId = setTimeout(poll, pollInterval);

        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    const loadNotifications = async (p = page, ps = rowsPerPage) => {
        try {
            setLoading(true);
            setError(''); // Clear previous errors
            
            const params = {
                search: searchTerm,
                notification_type: typeFilter,
                page: p + 1, // API uses 1-based indexing
                page_size: ps
            };

            // If on Unread tab, force status filter to SENT (maps to SENT/DELIVERED in backend)
            if (currentTab === 1) {
                params.status = 'SENT';
            } else if (statusFilter) {
                params.status = statusFilter;
            }

            const response = await notificationService.getNotifications(params);
            
            if (response.data.results) {
                setNotifications(response.data.results);
                setTotalCount(response.data.count);
            } else {
                setNotifications(response.data);
                setTotalCount(response.data.length);
            }
        } catch (err) {
            console.error('Error loading notifications:', err);
            setError('Failed to load notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        loadNotifications(newPage, rowsPerPage);
    };

    const handleChangeRowsPerPage = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setPage(0);
        loadNotifications(0, newRowsPerPage);
    };

    const loadUnreadNotifications = async () => {
        try {
            const response = await notificationService.getUnreadNotifications();
            setUnreadNotifications(response.data);
            dispatch(setUnreadCount(response.data?.length || 0));
        } catch (err) {
            console.error('Error loading unread notifications:', err);
        }
    };

    const loadStats = async () => {
        try {
            const response = await notificationService.getStats();
            setStats(response.data);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            setLoading(true);
            await notificationService.markAsRead(notificationId);
            setSuccess('Notification marked as read');
            
            // Optimistic update - immediately update the notification in the list
            setNotifications(prev => prev.map(n => 
                n.id === notificationId ? { ...n, is_read: true, status: 'READ' } : n
            ));
            setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
            dispatch(decrementUnreadCount());
            
            // Reload data to ensure consistency
            await Promise.all([loadNotifications(), loadUnreadNotifications(), loadStats()]);
        } catch (err) {
            console.error('Error marking notification as read:', err);
            setError('Failed to mark notification as read. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setLoading(true);
            await notificationService.markAllAsRead();
            setSuccess('All notifications marked as read');
            
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true, status: 'READ' })));
            setUnreadNotifications([]);
            dispatch(setUnreadCount(0));
            
            // Reload data to ensure consistency
            await Promise.all([loadNotifications(), loadUnreadNotifications(), loadStats()]);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            setError('Failed to mark all notifications as read. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            setLoading(true);
            const notificationToDelete = notifications.find(n => n.id === notificationId);
            await notificationService.deleteNotification(notificationId);
            setSuccess('Notification deleted');
            
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
            
            if (notificationToDelete && !notificationToDelete.is_read) {
                dispatch(decrementUnreadCount());
            }
            
            // Reload data
            await Promise.all([loadNotifications(), loadUnreadNotifications(), loadStats()]);
        } catch (err) {
            console.error('Error deleting notification:', err);
            setError('Failed to delete notification. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRead = async () => {
        try {
            setLoading(true);
            await notificationService.deleteReadNotifications();
            setSuccess('Read notifications deleted');
            
            // Reload data
            await Promise.all([loadNotifications(), loadUnreadNotifications(), loadStats()]);
        } catch (err) {
            console.error('Error deleting read notifications:', err);
            setError('Failed to delete read notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('Are you sure you want to delete ALL notifications? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            await notificationService.deleteAllNotifications();
            setSuccess('All notifications deleted');
            
            setNotifications([]);
            setUnreadNotifications([]);
            dispatch(setUnreadCount(0));
            
            // Reload data
            await Promise.all([loadNotifications(), loadUnreadNotifications(), loadStats()]);
        } catch (err) {
            console.error('Error deleting all notifications:', err);
            setError('Failed to delete all notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (notification) => {
        setSelectedNotification(notification);
        setDetailsOpen(true);
        // Only mark as read if it's not already read AND the current user is the recipient
        if (!notification.is_read && currentUser && notification.recipient === currentUser.id) {
            handleMarkAsRead(notification.id);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'READ': return 'success';
            case 'DELIVERED': return 'success';
            case 'SENT': return 'success';
            case 'PENDING': return 'warning';
            case 'FAILED': return 'error';
            default: return 'default';
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'APPOINTMENT_REMINDER': return <Schedule />;
            case 'MEDICATION_REMINDER': return <Schedule />;
            case 'HEALTH_CAMPAIGN': return <Campaign />;
            case 'CLINIC_UPDATE': return <NotificationImportant />;
            case 'FOLLOW_UP': return <CheckCircle />;
            case 'VACCINATION_REMINDER': return <Schedule />;
            case 'DENTAL_REMINDER': return <Schedule />;
            case 'MEDICAL_CERTIFICATE': return <NotificationsIcon />;
            case 'SYSTEM_ALERT': return <NotificationImportant />;
            case 'CUSTOM': return <NotificationsIcon />;
            default: return <NotificationsIcon />;
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return format(date, 'PPp');
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid date';
        }
    };

    const currentNotifications = notifications;

    // Notification types for filters
    const notificationTypes = [
        { value: 'HEALTH_CAMPAIGN', label: 'Health Campaign' },
        { value: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate' },
        { value: 'FOLLOW_UP', label: 'Patient Feedback' },
        { value: 'CLINIC_UPDATE', label: 'Clinic Update' },
        { value: 'SYSTEM_ALERT', label: 'System Alert' },
    ];

    const statuses = [
        { value: 'SENT', label: 'Delivered' },
        { value: 'READ', label: 'Read' },
        { value: 'FAILED', label: 'Failed' },
    ];

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Header */}
                <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Box display="flex" alignItems="center">
                          <Typography variant="h4" component="h1" gutterBottom>
                              <Badge 
                                badgeContent={unreadNotifications.length} 
                                color="error" 
                                invisible={unreadNotifications.length === 0}
                                sx={{ mr: 1 }}
                              >
                                <NotificationsIcon sx={{ verticalAlign: 'middle' }} />
                              </Badge>
                              Notifications
                          </Typography>
                          <InfoTooltip title="View, search, and filter your notifications. Use the actions to refresh or mark all as read." />
                        </Box>
                        <Box>
                            <Tooltip title="Refresh">
                                <IconButton onClick={loadNotifications}>
                                    <Refresh />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Mark All Read">
                                <IconButton onClick={handleMarkAllAsRead}>
                                    <MarkEmailRead />
                                </IconButton>
                            </Tooltip>
                            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                                <MoreVert />
                            </IconButton>
                        </Box>
                    </Box>
                </Grid>

                {/* Statistics Cards */}
                {stats && (
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                                    <CardContent>
                                        <Typography variant="h6">Total</Typography>
                                        <Typography variant="h4">{stats.total_notifications}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                                    <CardContent>
                                        <Typography variant="h6">Unread</Typography>
                                        <Typography variant="h4">{stats.pending_notifications + stats.delivered_notifications}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                                    <CardContent>
                                        <Typography variant="h6">Read</Typography>
                                        <Typography variant="h4">{stats.read_notifications}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
                                    <CardContent>
                                        <Typography variant="h6">Failed</Typography>
                                        <Typography variant="h4">{stats.failed_notifications}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                )}

                {/* Filters */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search notifications..."
                                    value={searchInput}
                                    onChange={(e) => {
                                        setSearchInput(e.target.value);
                                        debouncedSearch(e.target.value);
                                    }}
                                    InputProps={{
                                        startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={typeFilter}
                                        label="Type"
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                    >
                                        <MenuItem value="">All Types</MenuItem>
                                        {notificationTypes.map(type => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Status"
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <MenuItem value="">All Statuses</MenuItem>
                                        {statuses.map(status => (
                                            <MenuItem key={status.value} value={status.value}>
                                                {status.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Notifications List */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                                <Tab label="All Notifications" />
                                <Tab label={`Unread (${unreadNotifications.length})`} />
                            </Tabs>

                            <TabPanel value={currentTab} index={0}>
                                {loading ? (
                                    <Box display="flex" justifyContent="center" p={3}>
                                        <CircularProgress />
                                    </Box>
                                ) : currentNotifications.length === 0 ? (
                                    <Box textAlign="center" p={3}>
                                        <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                        <Typography variant="h6" color="textSecondary">
                                            No notifications found
                                        </Typography>
                                        <Typography color="textSecondary">
                                            {searchTerm || typeFilter || statusFilter
                                                ? 'Try adjusting your filters'
                                                : 'You have no notifications yet'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List>
                                        {currentNotifications.map((notification, index) => (
                                            <React.Fragment key={notification.id}>
                                                <ListItemButton
                                                    onClick={() => handleViewDetails(notification)}
                                                    sx={{
                                                        bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                                                        '&:hover': { bgcolor: 'action.selected' }
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        {getNotificationIcon(notification.notification_type)}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Typography
                                                                    variant="subtitle1"
                                                                    sx={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}
                                                                >
                                                                    {notification.title}
                                                                </Typography>
                                                                <Chip
                                                                    size="small"
                                                                    label={notification.status_display}
                                                                    color={getStatusColor(notification.status)}
                                                                    variant="outlined"
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                    sx={{
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical',
                                                                        whiteSpace: 'pre-line'
                                                                    }}
                                                                >
                                                                    {notification.message}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {formatDate(notification.created_at)}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItemButton>
                                                {index < currentNotifications.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </TabPanel>

                            <TabPanel value={currentTab} index={1}>
                                {loading ? (
                                    <Box display="flex" justifyContent="center" p={3}>
                                        <CircularProgress />
                                    </Box>
                                ) : currentNotifications.length === 0 ? (
                                    <Box textAlign="center" p={3}>
                                        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                                        <Typography variant="h6" color="textSecondary">
                                            {searchTerm || typeFilter || statusFilter ? 'No matching unread notifications' : 'All caught up!'}
                                        </Typography>
                                        <Typography color="textSecondary">
                                            {searchTerm || typeFilter || statusFilter 
                                                ? 'Try adjusting your filters' 
                                                : 'You have no unread notifications'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List>
                                        {currentNotifications.map((notification, index) => (
                                            <React.Fragment key={notification.id}>
                                                <ListItemButton onClick={() => handleViewDetails(notification)}>
                                                    <ListItemIcon>
                                                        {getNotificationIcon(notification.notification_type)}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                                    {notification.title}
                                                                </Typography>
                                                                <Chip
                                                                    size="small"
                                                                    label={notification.status_display}
                                                                    color={getStatusColor(notification.status)}
                                                                    variant="outlined"
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                    sx={{
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical',
                                                                        whiteSpace: 'pre-line'
                                                                    }}
                                                                >
                                                                    {notification.message}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {formatDate(notification.created_at)}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItemButton>
                                                {index < currentNotifications.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </TabPanel>

                            <Divider />
                            <TablePagination
                                component="div"
                                count={totalCount}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Notification Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedNotification && (
                    <>
                        <DialogTitle>
                            <Box display="flex" alignItems="center" gap={1}>
                                {getNotificationIcon(selectedNotification.notification_type)}
                                <Typography variant="h6">{selectedNotification.title}</Typography>
                                <Chip
                                    size="small"
                                    label={selectedNotification.status_display}
                                    color={getStatusColor(selectedNotification.status)}
                                    variant="outlined"
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography 
                                        variant="body1" 
                                        sx={{ 
                                            whiteSpace: 'pre-line',
                                            lineHeight: 1.6,
                                            color: 'text.primary'
                                        }}
                                    >
                                        {selectedNotification.message}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Type
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedNotification.notification_type_display}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Delivery Method
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedNotification.delivery_method_display}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Created
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDate(selectedNotification.created_at)}
                                    </Typography>
                                </Grid>
                                
                                {selectedNotification.sent_at && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Sent
                                        </Typography>
                                        <Typography variant="body2">
                                            {formatDate(selectedNotification.sent_at)}
                                        </Typography>
                                    </Grid>
                                )}
                                
                                {selectedNotification.read_at && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Read
                                        </Typography>
                                        <Typography variant="body2">
                                            {formatDate(selectedNotification.read_at)}
                                        </Typography>
                                    </Grid>
                                )}
                                
                                {selectedNotification.action_url && (
                                    <Grid item xs={12}>
                                        <Button
                                            variant="contained"
                                            href={selectedNotification.action_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ mt: 2 }}
                                        >
                                            {selectedNotification.action_text || 'Take Action'}
                                        </Button>
                                    </Grid>
                                )}
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button 
                                color="error" 
                                onClick={() => {
                                    handleDelete(selectedNotification.id);
                                    setDetailsOpen(false);
                                }}
                                startIcon={<Delete />}
                            >
                                Delete
                            </Button>
                            <Button onClick={() => setDetailsOpen(false)}>
                                Close
                            </Button>
                            {!selectedNotification.is_read && currentUser && selectedNotification.recipient === currentUser.id && (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        handleMarkAsRead(selectedNotification.id);
                                        setDetailsOpen(false);
                                    }}
                                >
                                    Mark as Read
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
            >
                <MenuItemComponent onClick={() => {
                    setMenuAnchor(null);
                    loadNotifications();
                }}>
                    <ListItemIcon><Refresh fontSize="small" /></ListItemIcon>
                    <ListItemText>Refresh</ListItemText>
                </MenuItemComponent>
                <Divider />
                <MenuItemComponent onClick={() => {
                    setMenuAnchor(null);
                    handleMarkAllAsRead();
                }}>
                    <ListItemIcon><MarkEmailRead fontSize="small" /></ListItemIcon>
                    <ListItemText>Mark All Read</ListItemText>
                </MenuItemComponent>
                <Divider />
                <MenuItemComponent 
                    onClick={() => {
                        setMenuAnchor(null);
                        handleDeleteRead();
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon><DeleteSweep fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>Delete Read</ListItemText>
                </MenuItemComponent>
                <MenuItemComponent 
                    onClick={() => {
                        setMenuAnchor(null);
                        handleDeleteAll();
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>Delete All</ListItemText>
                </MenuItemComponent>
            </Menu>

            {/* Success/Error Snackbars */}
            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
            >
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Notifications;

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
