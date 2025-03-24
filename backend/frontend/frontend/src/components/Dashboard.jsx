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

const Dashboard = () => {
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
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Medical Records"
            value={stats.totalRecords}
            icon={<EventNoteIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Visits"
            value={stats.totalRecords}
            icon={<AssessmentIcon />}
            color="#ed6c02"
          />
        </Grid>
      </Grid>

      {/* Quick Actions and Recent Patients */}
      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <QuickAction
                  title="Add Patient"
                  icon={<AddIcon />}
                  onClick={() => {/* Navigate to add patient */}}
                />
              </Grid>
              <Grid item xs={6}>
                <QuickAction
                  title="Search"
                  icon={<SearchIcon />}
                  onClick={() => {/* Navigate to search */}}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Patients */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Recent Patients
              </Typography>
              <Button
                variant="text"
                endIcon={<PeopleIcon />}
                onClick={() => {/* Navigate to patients list */}}
              >
                View All
              </Button>
            </Box>
            <List>
              {stats.recentPatients.map((patient, index) => (
                <React.Fragment key={patient.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>{patient.first_name[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${patient.first_name} ${patient.last_name}`}
                      secondary={patient.email}
                    />
                  </ListItem>
                  {index < stats.recentPatients.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 