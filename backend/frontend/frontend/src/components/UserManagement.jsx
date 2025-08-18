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
  CircularProgress
} from '@mui/material';
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
  ToggleOff,
  ToggleOn,
  Refresh
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import api from '../services/api';

const UserManagement = () => {
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
  
  // Dialog states
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null, newRole: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });

  const roles = [
    { value: 'ADMIN', label: 'Admin', icon: AdminPanelSettings, color: 'error' },
    { value: 'DOCTOR', label: 'Doctor', icon: LocalHospital, color: 'primary' },
    { value: 'NURSE', label: 'Nurse', icon: HealthAndSafety, color: 'secondary' },
    { value: 'STAFF', label: 'Staff', icon: Work, color: 'info' },
    { value: 'STUDENT', label: 'Student', icon: School, color: 'success' }
  ];

  const getRoleConfig = (role) => roles.find(r => r.value === role) || roles[4];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
        role: roleFilter
      };
      
      const response = await api.getAllUsers(params);
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

  useEffect(() => {
    // Check if current user is admin
    if (currentUser?.role !== 'ADMIN') {
      setError('Admin privileges required to access user management');
      return;
    }
    
    fetchUsers();
  }, [page, rowsPerPage, search, roleFilter, currentUser]);

  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  const handleRoleUpdate = async () => {
    try {
      await api.updateUserRole(roleDialog.user.id, roleDialog.newRole);
      setSuccess(`Role updated successfully for ${roleDialog.user.email}`);
      setRoleDialog({ open: false, user: null, newRole: '' });
      fetchUsers();
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.toggleUserStatus(user.id);
      setSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (err) {
      setError('Failed to toggle user status');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.deleteUser(deleteDialog.user.id);
      setSuccess(`User ${deleteDialog.user.email} deleted successfully`);
      setDeleteDialog({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage user roles and permissions across the USC-PIS system
        </Typography>
      </Box>

      {/* Role Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {roles.map((role) => {
          const count = roleCounts[role.value] || 0;
          const IconComponent = role.icon;
          return (
            <Grid item xs={12} sm={6} md={2.4} key={role.value}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }
                }}
                onClick={() => setRoleFilter(roleFilter === role.value ? '' : role.value)}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <IconComponent 
                    sx={{ 
                      fontSize: 32, 
                      color: `${role.color}.main`,
                      mb: 1
                    }} 
                  />
                  <Typography variant="h5" fontWeight="bold">
                    {count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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
              <TableCell><strong>Join Date</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
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
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.first_name} {user.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                        {user.id_number && (
                          <Typography variant="caption" color="text.secondary">
                            <br />ID: {user.id_number}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        icon={<IconComponent />}
                        label={roleConfig.label}
                        color={roleConfig.color}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        color={user.is_active ? 'success' : 'default'}
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
                        <Tooltip title="Change Role">
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

      {/* Role Update Dialog */}
      <Dialog open={roleDialog.open} onClose={() => setRoleDialog({ open: false, user: null, newRole: '' })}>
        <DialogTitle>Update User Role</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Change role for: <strong>{roleDialog.user?.email}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Role</InputLabel>
            <Select
              value={roleDialog.newRole}
              onChange={(e) => setRoleDialog(prev => ({ ...prev, newRole: e.target.value }))}
              label="New Role"
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog({ open: false, user: null, newRole: '' })}>
            Cancel
          </Button>
          <Button 
            onClick={handleRoleUpdate}
            variant="contained"
            disabled={!roleDialog.newRole || roleDialog.newRole === roleDialog.user?.role}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography>
            Are you sure you want to delete user: <strong>{deleteDialog.user?.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;