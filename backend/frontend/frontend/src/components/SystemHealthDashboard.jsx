import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Refresh,
  Storage,
  Memory,
  Speed,
  NetworkCheck
} from '@mui/icons-material';
import { authService } from '../services/api';
import InfoTooltip from './utils/InfoTooltip';

const SystemHealthDashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [systemHealth, dbHealth, perfStats, resourceHealth] = await Promise.all([
        authService.getSystemHealth(),
        authService.getDatabaseHealth(),
        authService.getPerformanceStats(),
        authService.getResourceHealth()
      ]);

      setHealthData({
        system: systemHealth,
        database: dbHealth,
        performance: perfStats,
        resources: resourceHealth
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError('Failed to fetch system health information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'critical':
      case 'error':
        return <Error color="error" />;
      default:
        return <CheckCircle color="disabled" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading && !healthData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <IconButton onClick={fetchHealthData} size="small">
            <Refresh />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Typography variant="h4" component="h1">
            System Health Dashboard
          </Typography>
          <InfoTooltip title="Monitor app, database, and resource health. Use the refresh button to update status." />
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {lastUpdated && (
            <Typography variant="body2" color="textSecondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh">
            <IconButton onClick={fetchHealthData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overall System Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="h6">Overall System Status</Typography>
            {getStatusIcon(healthData?.system?.overall_status)}
            <Chip 
              label={healthData?.system?.overall_status?.toUpperCase() || 'UNKNOWN'}
              color={getStatusColor(healthData?.system?.overall_status)}
              size="small"
            />
          </Box>
          <Typography variant="body2" color="textSecondary">
            Timestamp: {healthData?.system?.timestamp}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Database Health */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Storage />
                <Typography variant="h6">Database Health</Typography>
                {getStatusIcon(healthData?.database?.overall_status)}
              </Box>
              
              {healthData?.database?.checks && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Check</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(healthData.database.checks).map(([check, data]) => (
                        <TableRow key={check}>
                          <TableCell>{check.replace('_', ' ').toUpperCase()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={data.status?.toUpperCase()}
                              color={getStatusColor(data.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {data.active_connections && `${data.active_connections}/${data.max_connections} connections`}
                            {data.query_time && `${data.query_time.toFixed(2)}s`}
                            {data.size && data.size}
                            {data.blocked_locks && `${data.blocked_locks} locks`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Resources */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Memory />
                <Typography variant="h6">System Resources</Typography>
                {getStatusIcon(healthData?.resources?.overall_status)}
              </Box>
              
              {healthData?.resources && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">CPU Usage</Typography>
                    <Typography variant="h6">
                      {healthData.resources.cpu?.percent?.toFixed(1)}%
                    </Typography>
                    <Chip 
                      label={healthData.resources.cpu?.status?.toUpperCase()}
                      color={getStatusColor(healthData.resources.cpu?.status)}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Memory Usage</Typography>
                    <Typography variant="h6">
                      {healthData.resources.memory?.percent?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                      {healthData.resources.memory?.available_gb?.toFixed(1)}GB available
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Disk Usage</Typography>
                    <Typography variant="h6">
                      {healthData.resources.disk?.percent?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                      {healthData.resources.disk?.free_gb?.toFixed(1)}GB free
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Processes</Typography>
                    <Typography variant="h6">
                      {healthData.resources.processes}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Speed />
                <Typography variant="h6">Performance Statistics</Typography>
                {getStatusIcon(healthData?.performance?.status)}
              </Box>
              
              {healthData?.performance && healthData.performance.status !== 'no_data' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="textSecondary">Total Requests</Typography>
                    <Typography variant="h6">
                      {healthData.performance.total_requests}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="textSecondary">Avg Response Time</Typography>
                    <Typography variant="h6">
                      {(healthData.performance.avg_response_time * 1000).toFixed(0)}ms
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="textSecondary">Error Rate</Typography>
                    <Typography variant="h6">
                      {formatPercentage(healthData.performance.error_rate)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="textSecondary">Max Response Time</Typography>
                    <Typography variant="h6">
                      {(healthData.performance.max_response_time * 1000).toFixed(0)}ms
                    </Typography>
                  </Grid>
                </Grid>
              )}
              
              {healthData?.performance?.status_codes && (
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary" mb={1}>
                    Status Code Distribution
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(healthData.performance.status_codes).map(([code, count]) => (
                      <Grid item key={code}>
                        <Chip 
                          label={`${code}: ${count}`}
                          color={code.startsWith('2') ? 'success' : code.startsWith('4') ? 'warning' : 'error'}
                          size="small"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemHealthDashboard; 
