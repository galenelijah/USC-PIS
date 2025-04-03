import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalRecords: 0,
    recentPatients: [],
    visitsByMonth: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/dashboard-stats/');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: color }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const QuickAction = ({ title, icon, onClick }) => (
    <Button
      variant="outlined"
      startIcon={icon}
      onClick={onClick}
      sx={{ height: '100%', width: '100%' }}
    >
      {title}
    </Button>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* User Info Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Welcome, {user?.first_name || user?.email}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Role: {user?.role || 'User'}
              </Typography>
            </Box>
            <Box>
              <Button
                component={Link}
                to="/profile"
                variant="outlined"
                color="primary"
                sx={{ mr: 2 }}
              >
                Profile
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={onLogout}
              >
                Logout
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Links Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Quick Links</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" gutterBottom>Patient Records</Typography>
            <Button
              component={Link}
              to="/patients"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              View Patients
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" gutterBottom>Student Records</Typography>
            <Button
              component={Link}
              to="/students"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              View Students
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" gutterBottom>Medical Records</Typography>
            <Button
              component={Link}
              to="/medical"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              View Medical Records
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 