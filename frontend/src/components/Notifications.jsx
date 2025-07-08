import React, { useState, useEffect } from 'react';
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
    Paper
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
    MoreVert
} from '@mui/icons-material';
import { format } from 'date-fns';
import { notificationService } from '../services/api';

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
    const [typeFilter, setTypeFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Load data
    useEffect(() => {
        loadNotifications();
        loadUnreadNotifications();
        loadStats();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getNotifications({
                search: searchTerm,
                notification_type: typeFilter,
                priority: priorityFilter,
                status: statusFilter
            });
            setNotifications(response.data.results || response.data);
        } catch (err) {
            console.error('Error loading notifications:', err);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const loadUnreadNotifications = async () => {
        try {
            const response = await notificationService.getUnreadNotifications();
            setUnreadNotifications(response.data);
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
            await notificationService.markAsRead(notificationId);
            setSuccess('Notification marked as read');
            loadNotifications();
            loadUnreadNotifications();
        } catch (err) {
            setError('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setSuccess('All notifications marked as read');
            loadNotifications();
            loadUnreadNotifications();
        } catch (err) {
            setError('Failed to mark all notifications as read');
        }
    };

    const handleViewDetails = (notification) => {
        setSelectedNotification(notification);
        setDetailsOpen(true);
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT': return 'error';
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'primary';
            case 'LOW': return 'success';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'READ': return 'success';
            case 'delivered': return 'info';
            case 'sent': return 'primary';
            case 'pending': return 'warning';
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'APPOINTMENT_REMINDER': return <Schedule />;
            case 'MEDICATION_REMINDER': return <Info />;
            case 'HEALTH_CAMPAIGN': return <Campaign />;
            case 'CLINIC_UPDATE': return <NotificationImportant />;
            case 'FOLLOW_UP': return <Schedule />;
            case 'VACCINATION_REMINDER': return <Info />;
            case 'DENTAL_REMINDER': return <Schedule />;
            default: return <NotificationsIcon />;
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            notification.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !typeFilter || notification.notification_type === typeFilter;
        const matchesPriority = !priorityFilter || notification.priority === priorityFilter;
        const matchesStatus = !statusFilter || notification.status === statusFilter;
        
        return matchesSearch && matchesType && matchesPriority && matchesStatus;
    });

    // Notification types for filters
    const notificationTypes = [
        { value: 'APPOINTMENT_REMINDER', label: 'Appointment Reminder' },
        { value: 'MEDICATION_REMINDER', label: 'Medication Reminder' },
        { value: 'HEALTH_CAMPAIGN', label: 'Health Campaign' },
        { value: 'CLINIC_UPDATE', label: 'Clinic Update' },
        { value: 'FOLLOW_UP', label: 'Follow-up' },
        { value: 'VACCINATION_REMINDER', label: 'Vaccination Reminder' },
        { value: 'DENTAL_REMINDER', label: 'Dental Reminder' },
    ];

    const priorities = [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'URGENT', label: 'Urgent' },
    ];

    const statuses = [
        { value: 'PENDING', label: 'Pending' },
        { value: 'SENT', label: 'Sent' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'READ', label: 'Read' },
        { value: 'FAILED', label: 'Failed' },
    ];

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Header */}
                <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Notifications
                            {unreadNotifications.length > 0 && (
                                <Badge badgeContent={unreadNotifications.length} color="error" sx={{ ml: 2 }}>
                                    <NotificationsIcon />
                                </Badge>
                            )}
                        </Typography>
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
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search notifications..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
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
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        value={priorityFilter}
                                        label="Priority"
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                    >
                                        <MenuItem value="">All Priorities</MenuItem>
                                        {priorities.map(priority => (
                                            <MenuItem key={priority.value} value={priority.value}>
                                                {priority.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
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
                                ) : filteredNotifications.length === 0 ? (
                                    <Box textAlign="center" p={3}>
                                        <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                        <Typography variant="h6" color="textSecondary">
                                            No notifications found
                                        </Typography>
                                        <Typography color="textSecondary">
                                            {searchTerm || typeFilter || priorityFilter || statusFilter
                                                ? 'Try adjusting your filters'
                                                : 'You have no notifications yet'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List>
                                        {filteredNotifications.map((notification, index) => (
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
                                                                    label={notification.priority_display}
                                                                    color={getPriorityColor(notification.priority)}
                                                                />
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
                                                                        WebkitBoxOrient: 'vertical'
                                                                    }}
                                                                >
                                                                    {notification.message}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {format(new Date(notification.created_at), 'PPp')}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItemButton>
                                                {index < filteredNotifications.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </TabPanel>

                            <TabPanel value={currentTab} index={1}>
                                {unreadNotifications.length === 0 ? (
                                    <Box textAlign="center" p={3}>
                                        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                                        <Typography variant="h6" color="textSecondary">
                                            All caught up!
                                        </Typography>
                                        <Typography color="textSecondary">
                                            You have no unread notifications
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List>
                                        {unreadNotifications.map((notification, index) => (
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
                                                                    label={notification.priority_display}
                                                                    color={getPriorityColor(notification.priority)}
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
                                                                        WebkitBoxOrient: 'vertical'
                                                                    }}
                                                                >
                                                                    {notification.message}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {format(new Date(notification.created_at), 'PPp')}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItemButton>
                                                {index < unreadNotifications.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </TabPanel>
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
                                    label={selectedNotification.priority_display}
                                    color={getPriorityColor(selectedNotification.priority)}
                                />
                                <Chip
                                    size="small"
                                    label={selectedNotification.status_display}
                                    color={getStatusColor(selectedNotification.status)}
                                    variant="outlined"
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body1" paragraph>
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
                                        {format(new Date(selectedNotification.created_at), 'PPp')}
                                    </Typography>
                                </Grid>
                                
                                {selectedNotification.sent_at && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Sent
                                        </Typography>
                                        <Typography variant="body2">
                                            {format(new Date(selectedNotification.sent_at), 'PPp')}
                                        </Typography>
                                    </Grid>
                                )}
                                
                                {selectedNotification.read_at && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Read
                                        </Typography>
                                        <Typography variant="body2">
                                            {format(new Date(selectedNotification.read_at), 'PPp')}
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
                            <Button onClick={() => setDetailsOpen(false)}>
                                Close
                            </Button>
                            {!selectedNotification.is_read && (
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