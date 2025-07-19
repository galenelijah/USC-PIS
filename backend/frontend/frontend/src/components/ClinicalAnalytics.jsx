import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  LocalHospital as MedicalIcon,
  Healing as DentalIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Analytics as AnalyticsIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

const ClinicalAnalytics = ({ records = [] }) => {
  const [analytics, setAnalytics] = useState({
    recordTrends: [],
    diagnosisFrequency: [],
    patientDemographics: {},
    treatmentEffectiveness: [],
    monthlyStats: []
  });

  useEffect(() => {
    if (records.length > 0) {
      generateAnalytics();
    }
  }, [records]);

  const generateAnalytics = () => {
    // Record trends by month
    const recordTrends = generateRecordTrends();
    
    // Most common diagnoses
    const diagnosisFrequency = generateDiagnosisFrequency();
    
    // Patient demographics
    const patientDemographics = generatePatientDemographics();
    
    // Treatment effectiveness (follow-up analysis)
    const treatmentEffectiveness = generateTreatmentEffectiveness();
    
    // Monthly statistics
    const monthlyStats = generateMonthlyStats();

    setAnalytics({
      recordTrends,
      diagnosisFrequency,
      patientDemographics,
      treatmentEffectiveness,
      monthlyStats
    });
  };

  const generateRecordTrends = () => {
    const trends = {};
    records.forEach(record => {
      const month = dayjs(record.visit_date).format('YYYY-MM');
      if (!trends[month]) {
        trends[month] = { medical: 0, dental: 0, total: 0 };
      }
      if (record.record_type === 'MEDICAL') {
        trends[month].medical++;
      } else {
        trends[month].dental++;
      }
      trends[month].total++;
    });

    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        month: dayjs(month).format('MMM YYYY'),
        ...data
      }));
  };

  const generateDiagnosisFrequency = () => {
    const frequency = {};
    records.forEach(record => {
      if (record.diagnosis) {
        frequency[record.diagnosis] = (frequency[record.diagnosis] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([diagnosis, count]) => ({
        diagnosis,
        count,
        percentage: ((count / records.length) * 100).toFixed(1)
      }));
  };

  const generatePatientDemographics = () => {
    const uniquePatients = records.reduce((acc, record) => {
      if (record.patient && !acc.find(p => p.id === record.patient.id)) {
        acc.push(record.patient);
      }
      return acc;
    }, []);

    const demographics = {
      totalPatients: uniquePatients.length,
      newPatientsThisMonth: records.filter(r => 
        dayjs(r.visit_date).isAfter(dayjs().startOf('month'))
      ).map(r => r.patient?.id).filter((id, index, arr) => arr.indexOf(id) === index).length,
      avgVisitsPerPatient: uniquePatients.length > 0 ? (records.length / uniquePatients.length).toFixed(1) : 0,
      recordTypes: {
        medical: records.filter(r => r.record_type === 'MEDICAL').length,
        dental: records.filter(r => r.record_type === 'DENTAL').length
      }
    };

    return demographics;
  };

  const generateTreatmentEffectiveness = () => {
    // Analyze patterns in follow-up visits for similar diagnoses
    const treatmentGroups = {};
    
    records.forEach(record => {
      if (record.diagnosis && record.treatment) {
        const key = record.diagnosis.toLowerCase();
        if (!treatmentGroups[key]) {
          treatmentGroups[key] = {
            diagnosis: record.diagnosis,
            treatments: {},
            totalCases: 0,
            avgDaysBetweenVisits: 0
          };
        }
        
        if (!treatmentGroups[key].treatments[record.treatment]) {
          treatmentGroups[key].treatments[record.treatment] = 0;
        }
        treatmentGroups[key].treatments[record.treatment]++;
        treatmentGroups[key].totalCases++;
      }
    });

    return Object.values(treatmentGroups)
      .filter(group => group.totalCases >= 2)
      .sort((a, b) => b.totalCases - a.totalCases)
      .slice(0, 5);
  };

  const generateMonthlyStats = () => {
    const currentMonth = dayjs().startOf('month');
    const lastMonth = currentMonth.subtract(1, 'month');
    
    const currentMonthRecords = records.filter(r => 
      dayjs(r.visit_date).isAfter(currentMonth)
    );
    
    const lastMonthRecords = records.filter(r => 
      dayjs(r.visit_date).isBetween(lastMonth, currentMonth)
    );

    return {
      currentMonth: {
        total: currentMonthRecords.length,
        medical: currentMonthRecords.filter(r => r.record_type === 'MEDICAL').length,
        dental: currentMonthRecords.filter(r => r.record_type === 'DENTAL').length
      },
      lastMonth: {
        total: lastMonthRecords.length,
        medical: lastMonthRecords.filter(r => r.record_type === 'MEDICAL').length,
        dental: lastMonthRecords.filter(r => r.record_type === 'DENTAL').length
      },
      growth: {
        total: lastMonthRecords.length > 0 ? 
          (((currentMonthRecords.length - lastMonthRecords.length) / lastMonthRecords.length) * 100).toFixed(1) : 0
      }
    };
  };

  const renderTrendChart = () => {
    const maxValue = Math.max(...analytics.recordTrends.map(t => t.total));
    
    return (
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <TrendingUpIcon sx={{ color: '#667eea' }} />
            <Typography variant="h6" fontWeight="bold">
              Record Trends (Last 6 Months)
            </Typography>
          </Box>
          
          {analytics.recordTrends.map((trend, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {trend.month}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {trend.total} records
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(trend.total / maxValue) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#667eea',
                    borderRadius: 4,
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  label={`Medical: ${trend.medical}`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={`Dental: ${trend.dental}`} 
                  size="small" 
                  color="secondary" 
                  variant="outlined"
                />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderDiagnosisFrequency = () => (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <BarChartIcon sx={{ color: '#f093fb' }} />
          <Typography variant="h6" fontWeight="bold">
            Most Common Diagnoses
          </Typography>
        </Box>
        
        <List dense>
          {analytics.diagnosisFrequency.map((item, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                      {item.diagnosis}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {item.count} cases
                      </Typography>
                      <Chip 
                        label={`${item.percentage}%`} 
                        size="small" 
                        color="primary"
                      />
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderPatientDemographics = () => (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <PeopleIcon sx={{ color: '#f5576c' }} />
          <Typography variant="h6" fontWeight="bold">
            Patient Demographics
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {analytics.patientDemographics.totalPatients}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Patients
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(245, 87, 108, 0.1)', borderRadius: 2 }}>
              <Typography variant="h4" color="error" fontWeight="bold">
                {analytics.patientDemographics.newPatientsThisMonth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New This Month
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(240, 147, 251, 0.1)', borderRadius: 2 }}>
              <Typography variant="h5" color="secondary" fontWeight="bold">
                {analytics.patientDemographics.avgVisitsPerPatient}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Visits per Patient
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderMonthlyComparison = () => (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CalendarIcon sx={{ color: '#4caf50' }} />
          <Typography variant="h6" fontWeight="bold">
            Monthly Comparison
          </Typography>
        </Box>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Medical</TableCell>
                <TableCell align="center">Dental</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>This Month</TableCell>
                <TableCell align="center">
                  <Chip label={analytics.monthlyStats.currentMonth?.total || 0} color="primary" size="small" />
                </TableCell>
                <TableCell align="center">{analytics.monthlyStats.currentMonth?.medical || 0}</TableCell>
                <TableCell align="center">{analytics.monthlyStats.currentMonth?.dental || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Last Month</TableCell>
                <TableCell align="center">
                  <Chip label={analytics.monthlyStats.lastMonth?.total || 0} color="default" size="small" />
                </TableCell>
                <TableCell align="center">{analytics.monthlyStats.lastMonth?.medical || 0}</TableCell>
                <TableCell align="center">{analytics.monthlyStats.lastMonth?.dental || 0}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        {analytics.monthlyStats.growth && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Growth Rate: 
              <span style={{ 
                color: analytics.monthlyStats.growth.total >= 0 ? '#4caf50' : '#f44336',
                fontWeight: 'bold',
                marginLeft: '4px'
              }}>
                {analytics.monthlyStats.growth.total >= 0 ? '+' : ''}{analytics.monthlyStats.growth.total}%
              </span>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (records.length === 0) {
    return (
      <Card elevation={2}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No Data Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Clinical analytics will appear here once you have created some records.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <InsightsIcon sx={{ color: '#667eea', fontSize: 28 }} />
        <Typography variant="h5" fontWeight="bold">
          Clinical Analytics Dashboard
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderTrendChart()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderDiagnosisFrequency()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderPatientDemographics()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderMonthlyComparison()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClinicalAnalytics;