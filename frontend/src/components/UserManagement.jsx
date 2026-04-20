import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Edit,
  Delete,
  PersonAdd,
  Search,
  FilterList,
  AdminPanelSettings,
  LocalHospital,
  HealthAndSafety,
  Work,
  School,
  MedicalServices,
  HistoryEdu,
  ToggleOff,
  ToggleOn,
  Refresh,
  VerifiedUser,
  Security,
  Email,
  AddCircle,
  RemoveCircle,
  CheckCircle,
  Cancel,
  PendingActions,
  HowToReg
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import { userManagementService } from '../services/api';
import InfoTooltip from './utils/InfoTooltip';

const UserManagement = () => {
  const theme = useTheme();
  const currentUser = useSelector(selectCurrentUser);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Filtering
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roleCounts, setRoleCounts] = useState({});
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Safe List Management state
  const [safeEmails, setSafeEmails] = useState([]);
  const [newSafeEmail, setNewSafeEmail] = useState('');
  const [newSafeRole, setNewSafeRole] = useState('STUDENT');
  const [safeListLoading, setSafeListLoading] = useState(false);
  
  // Dialog states
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null, newRole: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });

  const roles = [
    { value: 'ADMIN', label: 'Admin', icon: AdminPanelSettings, color: 'error' },
    { value: 'DOCTOR', label: 'Doctor', icon: LocalHospital, color: 'primary' },
    { value: 'DENTIST', label: 'Dentist', icon: MedicalServices, color: 'warning' },
    { value: 'NURSE', label: 'Nurse', icon: HealthAndSafety, color: 'secondary' },
    { value: 'STAFF', label: 'Staff', icon: Work, color: 'info' },
    { value: 'TEACHER', label: 'Teacher', icon: HistoryEdu, color: 'primary' },
    { value: 'STUDENT', label: 'Student', icon: School, color: 'success' }
  ];

  const getRoleConfig = (role) => roles.find(r => r.value === role) || roles[roles.length - 1];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
        role: roleFilter
      };
      
      const response = await userManagementService.getAllUsers(params);
      setUsers(response.users || []);
      setTotalUsers(response.pagination?.total_users || 0);
      setRoleCounts(response.role_counts || {});
      setError('');
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSafeEmails = async () => {
    try {
      setSafeListLoading(true);
      const data = await userManagementService.getSafeEmails();
      setSafeEmails(data?.safe_emails || []);
    } catch (err) {
      setError('Failed to load safe emails');
    } finally {
      setSafeListLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      setError('Admin privileges required to access user management');
      return;
    }
    
    if (activeTab === 0 || activeTab === 1) {
      fetchUsers();
    } else if (activeTab === 2) {
      fetchSafeEmails();
    }
  }, [page, rowsPerPage, search, roleFilter, currentUser, activeTab]);

  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  const handleRoleUpdate = async (userToUpdate = null, specificRole = null) => {
    const targetUser = userToUpdate || roleDialog.user;
    const targetRole = specificRole || roleDialog.newRole;

    try {
      await userManagementService.updateUserRole(targetUser.id, targetRole);
      setSuccess(`Role updated successfully for ${targetUser.email}`);
      setRoleDialog({ open: false, user: null, newRole: '' });
      fetchUsers();
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await userManagementService.toggleUserStatus(user.id);
      setSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (err) {
      setError('Failed to toggle user status');
    }
  };

  const handleToggleVerification = async (user) => {
    try {
      await userManagementService.toggleUserVerification(user.id);
      setSuccess(`User ${user.is_verified ? 'unverified' : 'verified'} successfully`);
      fetchUsers();
    } catch (err) {
      setError('Failed to toggle user verification');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await userManagementService.deleteUser(deleteDialog.user.id);
      setSuccess(`User ${deleteDialog.user.email} deleted successfully`);
      setDeleteDialog({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleAddSafeEmail = async () => {
    if (!newSafeEmail || !newSafeEmail.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    try {
      await userManagementService.addSafeEmail(newSafeEmail, newSafeRole);
      setSuccess('Email added to safe list');
      setNewSafeEmail('');
      fetchSafeEmails();
    } catch (err) {
      setError('Failed to add safe email');
    }
  };

  const handleRemoveSafeEmail = async (id) => {
    try {
      await userManagementService.removeSafeEmail(id);
      setSuccess('Email removed from safe list');
      fetchSafeEmails();
    } catch (err) {
      setError('Failed to remove safe email');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const roleRequests = users.filter(u => u.requested_role);

  if (currentUser?.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Admin privileges required to access user management
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            User & Role Management
          </Typography>
          <InfoTooltip title="Approve role requests, manage safe list, and control user access." />
        </Box>
        <Typography variant="body1" color="text.secondary">
          Centralized administrative control for the USC-PIS identity system
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab icon={<PersonAdd sx={{ fontSize: '1.2rem' }} />} iconPosition="start" label="All Users" />
          <Tab 
            icon={<PendingActions sx={{ fontSize: '1.2rem' }} />} 
            iconPosition="start" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Role Requests
                {roleCounts.PENDING_REQUESTS > 0 && (
                  <Chip label={roleCounts.PENDING_REQUESTS} size="small" color="error" sx={{ height: 20 }} />
                )}
              </Box>
            } 
          />
          <Tab icon={<Security sx={{ fontSize: '1.2rem' }} />} iconPosition="start" label="Safe List (Pre-Auth)" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          {/* Role Statistics Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {roles.map((role) => {
              const count = roleCounts[role.value] || 0;
              const IconComponent = role.icon;
              return (
                <Grid item xs={6} sm={4} md={1.7} key={role.value}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                      bgcolor: roleFilter === role.value ? alpha(theme.palette[role.color]?.main || '#ccc', 0.1) : 'background.paper',
                      border: roleFilter === role.value ? 2 : 0,
                      borderColor: `${role.color}.main`
                    }}
                    onClick={() => setRoleFilter(roleFilter === role.value ? '' : role.value)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2, px: 1 }}>
                      <IconComponent 
                        sx={{ 
                          fontSize: 28, 
                          color: `${role.color}.main`,
                          mb: 0.5
                        }} 
                      />
                      <Typography variant="h6" fontWeight="bold">
                        {count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                        {role.label}s
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Filters */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Search Users"
                variant="outlined"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Filter by Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<Search />}
              >
                Search
              </Button>
              
              <Button
                variant="outlined"
                onClick={fetchUsers}
                startIcon={<Refresh />}
              >
                Refresh
              </Button>
            </Stack>
          </Paper>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Users Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Verification</strong></TableCell>
                  <TableCell><strong>Join Date</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const roleConfig = getRoleConfig(user.role);
                    const IconComponent = roleConfig.icon;
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: alpha(theme.palette[roleConfig.color]?.main || '#800000', 0.2), color: theme.palette[roleConfig.color]?.main }}>
                              {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {user.first_name} {user.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Stack direction="column" spacing={0.5}>
                            <Chip
                              icon={<IconComponent sx={{ fontSize: '1rem !important' }} />}
                              label={roleConfig.label}
                              color={roleConfig.color}
                              size="small"
                            />
                            {user.requested_role && (
                              <Typography variant="caption" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PendingActions sx={{ fontSize: 12 }} />
                                Requested: {user.requested_role}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            icon={user.is_verified ? <VerifiedUser sx={{ fontSize: '0.9rem !important' }} /> : <Security sx={{ fontSize: '0.9rem !important' }} />}
                            label={user.is_verified ? 'Verified' : 'Unverified'}
                            color={user.is_verified ? 'info' : 'warning'}
                            variant={user.is_verified ? 'filled' : 'outlined'}
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(user.created_at)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Update User">
                              <IconButton
                                size="small"
                                onClick={() => setRoleDialog({ 
                                  open: true, 
                                  user, 
                                  newRole: user.role 
                                })}
                                disabled={user.id === currentUser?.id}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleStatus(user)}
                                disabled={user.id === currentUser?.id}
                              >
                                {user.is_active ? <ToggleOn /> : <ToggleOff />}
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Delete User">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteDialog({ open: true, user })}
                                disabled={user.id === currentUser?.id}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            
            <TablePagination
              component="div"
              count={totalUsers}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        </>
      )}

      {activeTab === 1 && (
        /* Role Requests Tab */
        <Paper sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold">Pending Role Requests</Typography>
            <Typography variant="body2" color="text.secondary">
              Users who have requested professional role upgrades.
            </Typography>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : roleRequests.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.light', mb: 2, opacity: 0.5 }} />
              <Typography color="text.secondary">No pending role requests. Everything is up to date!</Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {roleRequests.map((user, index) => {
                const reqRoleConfig = getRoleConfig(user.requested_role);
                const currentRoleConfig = getRoleConfig(user.role);
                
                return (
                  <React.Fragment key={user.id}>
                    <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 3 }}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                          {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </Avatar>
                        
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {user.first_name} {user.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Chip label={user.role} size="small" variant="outlined" />
                            <Typography variant="body2">requested upgrade to</Typography>
                            <Chip 
                              icon={<reqRoleConfig.icon sx={{ fontSize: '1rem !important' }} />}
                              label={user.requested_role} 
                              color={reqRoleConfig.color}
                              size="small" 
                            />
                          </Box>
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Button 
                            variant="contained" 
                            color="success" 
                            startIcon={<HowToReg />}
                            onClick={() => setRoleDialog({ 
                              open: true, 
                              user, 
                              newRole: user.requested_role || 'STAFF' 
                            })}
                          >
                            Approve & Assign Role
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleRoleUpdate(user, user.role)} // Re-assigning current role clears the request
                          >
                            Deny
                          </Button>
                        </Stack>
                      </Box>
                    </ListItem>
                    {index < roleRequests.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      )}

      {activeTab === 2 && (
        /* Safe List / Pre-Auth Tab */
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Pre-Authorize Role
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Authorized emails automatically receive their assigned role and verification status upon registration.
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Email Address"
                  placeholder="e.g. clinic_doctor@usc.edu.ph"
                  value={newSafeEmail}
                  onChange={(e) => setNewSafeEmail(e.target.value)}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
                
                <FormControl fullWidth>
                  <InputLabel>Pre-Authorized Role</InputLabel>
                  <Select
                    value={newSafeRole}
                    onChange={(e) => setNewSafeRole(e.target.value)}
                    label="Pre-Authorized Role"
                  >
                    {roles.map(r => (
                      <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<AddCircle />}
                  onClick={handleAddSafeEmail}
                  disabled={!newSafeEmail || safeListLoading}
                  sx={{ py: 1.5 }}
                >
                  Add to Safe List
                </Button>
              </Stack>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="h6" fontWeight="bold">
                  Authorized Safe List
                </Typography>
                <Chip label={`${safeEmails.length} Pre-Authorized Accounts`} size="small" color="primary" variant="outlined" />
              </Box>
              
              {safeListLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
              ) : safeEmails.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                  <Typography color="text.secondary">The safe list is currently empty.</Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Target Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {safeEmails.map((item) => {
                        const safeRoleConfig = getRoleConfig(item.role);
                        return (
                          <TableRow key={item.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">{item.email}</Typography>
                              <Typography variant="caption" color="text.secondary">Added {formatDate(item.created_at)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                icon={<safeRoleConfig.icon sx={{ fontSize: '0.9rem !important' }} />}
                                label={item.role} 
                                color={safeRoleConfig.color}
                                size="small" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label="ACTIVE" color="success" size="small" variant="filled" />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton color="error" onClick={() => handleRemoveSafeEmail(item.id)}>
                                <RemoveCircle />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Role Update Dialog */}
      <Dialog open={roleDialog.open} onClose={() => setRoleDialog({ open: false, user: null, newRole: '' })}>
        <DialogTitle>
          {roleDialog.user?.requested_role ? 'Approve & Assign Role' : 'Administrative Role Override'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {roleDialog.user?.requested_role 
              ? `Approving professional request for: `
              : `Overriding role for: `}
            <strong>{roleDialog.user?.email}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Final Role</InputLabel>
            <Select
              value={roleDialog.newRole}
              onChange={(e) => setRoleDialog(prev => ({ ...prev, newRole: e.target.value }))}
              label="Select Final Role"
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mt: 3 }}>
            Assigning a professional role (Doctor, Nurse, etc.) will grant system-wide clinical permissions and clear any pending requests.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setRoleDialog({ open: false, user: null, newRole: '' })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleRoleUpdate()}
            variant="contained"
            color="success"
            disabled={!roleDialog.newRole}
          >
            Confirm & Activate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })}>
        <DialogTitle>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            CRITICAL: This will permanently delete the user's account and all associated clinical links.
          </Alert>
          <Typography>
            Delete user: <strong>{deleteDialog.user?.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
          >
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
