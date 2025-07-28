import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  CircularProgress, 
  TextField, 
  InputAdornment, 
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Alert,
  Stack,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as MedicalIcon,
  Healing as DentalIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Medication as MedicationIcon,
  Assignment as DiagnosisIcon,
  Description as NotesIcon,
  Print as PrintIcon,
  GetApp as ExportIcon,
  Favorite as VitalIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Assignment as CertificateIcon,
  Feedback as FeedbackIcon,
  Warning as WarningIcon,
  DateRange as DateRangeIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

import { Autocomplete } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { healthRecordsService, patientService } from '../services/api';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`medical-history-tabpanel-${index}`}
      aria-labelledby={`medical-history-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const MedicalHistoryPage = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showAllergyAlert, setShowAllergyAlert] = useState(false);
  
  const user = useSelector(state => state.auth.user);
  const isStaffOrMedical = user?.role && ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(user.role);
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    fetchRecords();
    if (isStaffOrMedical) {
      fetchPatients();
    }
  }, []);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, records, selectedPatient, tabValue, startDate, endDate]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthRecordsService.getAll();
      const recordsData = response.data || [];
      setRecords(recordsData);
    } catch (err) {
      setError('Failed to load medical records.');
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    // Filter by selected patient (for staff/medical)
    if (selectedPatient) {
      filtered = filtered.filter(record => record.patient?.id === selectedPatient.id);
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(record => 
        record.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.treatment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.medications?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(record => 
        dayjs(record.visit_date).isAfter(dayjs(startDate).subtract(1, 'day'))
      );
    }
    if (endDate) {
      filtered = filtered.filter(record => 
        dayjs(record.visit_date).isBefore(dayjs(endDate).add(1, 'day'))
      );
    }

    // Filter by record type based on tab
    if (tabValue === 1) {
      // Health Insights tab - show all records for analysis
      // No filtering needed
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

    setFilteredRecords(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = dayjs(dateString);
      return {
        formatted: date.format('MMM DD, YYYY'),
        relative: date.fromNow()
      };
    } catch {
      return { formatted: dateString, relative: '' };
    }
  };

  const getRecordIcon = (recordType) => {
    return recordType === 'DENTAL' ? <DentalIcon /> : <MedicalIcon />;
  };

  const getRecordColor = (recordType) => {
    return recordType === 'DENTAL' ? '#f093fb' : '#667eea';
  };

  const handleExpandRecord = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  // Export functionality
  const handleExportRecords = () => {
    const exportData = filteredRecords.map(record => ({
      Date: formatDate(record.visit_date).formatted,
      Patient: record.patient_name || `Patient ID: ${record.patient}`,
      Type: record.record_type || 'MEDICAL',
      Diagnosis: record.diagnosis || 'No diagnosis',
      Treatment: record.treatment || 'No treatment',
      'Chief Complaint': record.chief_complaint || 'N/A',
      Medications: record.medications || 'None listed',
      Notes: record.notes || 'No notes'
    }));

    const csvContent = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(record => 
        Object.values(record).map(value => 
          `"${String(value).replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `medical-history-${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print functionality
  const handlePrintRecords = () => {
    const printWindow = window.open('', '_blank');
    
    const patientInfo = selectedPatient 
      ? `<h2>Medical History for ${selectedPatient.first_name} ${selectedPatient.last_name}</h2>`
      : '<h2>Medical History Report</h2>';
    
    const recordsHtml = filteredRecords.map(record => `
      <div style="border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px;">
        <h3 style="color: #667eea; margin: 0 0 10px 0;">${record.diagnosis || 'No diagnosis'}</h3>
        <p><strong>Date:</strong> ${formatDate(record.visit_date).formatted}</p>
        <p><strong>Patient:</strong> ${record.patient_name || `Patient ID: ${record.patient}`}</p>
        <p><strong>Type:</strong> ${record.record_type || 'MEDICAL'}</p>
        ${record.chief_complaint ? `<p><strong>Chief Complaint:</strong> ${record.chief_complaint}</p>` : ''}
        ${record.treatment ? `<p><strong>Treatment:</strong> ${record.treatment}</p>` : ''}
        ${record.medications ? `<p><strong>Medications:</strong> ${record.medications}</p>` : ''}
        ${record.notes ? `<p><strong>Notes:</strong> ${record.notes}</p>` : ''}
      </div>
    `).join('');
    
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Medical History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #333; }
            h3 { color: #667eea; }
            .header { text-align: center; margin-bottom: 30px; }
            .date { text-align: right; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>USC Patient Information System</h1>
            ${patientInfo}
            <p class="date">Generated on: ${dayjs().format('MMMM DD, YYYY')}</p>
          </div>
          ${recordsHtml}
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            This report contains ${filteredRecords.length} medical record(s).
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Date filter helpers
  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // Check for allergies in selected patient's records
  const checkForAllergies = () => {
    if (!selectedPatient || !filteredRecords.length) return [];
    
    const allergies = [];
    filteredRecords.forEach(record => {
      if (record.notes?.toLowerCase().includes('allerg') || 
          record.diagnosis?.toLowerCase().includes('allerg') ||
          record.medications?.toLowerCase().includes('allerg')) {
        allergies.push({
          date: record.visit_date,
          note: record.notes || record.diagnosis,
          type: 'allergy'
        });
      }
    });
    return allergies;
  };

  const renderHealthInsights = () => {
    if (filteredRecords.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No health data available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Health insights will appear here once you have medical records.
          </Typography>
        </Box>
      );
    }

    const insights = generateHealthInsights();

    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
          Your Health Insights
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Personalized insights based on your medical history to help you understand your health better.
        </Typography>

        <Grid container spacing={3}>
          {/* Health Summary */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: 'fit-content' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📊 Health Summary
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CalendarIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Total Visits" 
                      secondary={`${insights.totalVisits} medical appointments`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><MedicalIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Last Visit" 
                      secondary={insights.lastVisit || 'No recent visits'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TimelineIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Health Trend" 
                      secondary={insights.trend}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Common Conditions */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: 'fit-content' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  🏥 Health Patterns
                </Typography>
                {insights.commonConditions.length > 0 ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Most frequently addressed conditions:
                    </Typography>
                    <Stack spacing={1}>
                      {insights.commonConditions.map((condition, index) => (
                        <Chip 
                          key={index}
                          label={`${condition.condition} (${condition.count} times)`}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recurring conditions identified.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Health Recommendations */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  💡 Personalized Recommendations
                </Typography>
                <Grid container spacing={2}>
                  {insights.recommendations.map((rec, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Alert severity={rec.type} sx={{ borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {rec.title}
                        </Typography>
                        <Typography variant="body2">
                          {rec.description}
                        </Typography>
                      </Alert>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Health Timeline Chart */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📈 Visit Frequency
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {insights.monthlyVisits.map((month, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{month.month}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {month.visits} visit{month.visits !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(month.visits / Math.max(...insights.monthlyVisits.map(m => m.visits))) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(102, 126, 234, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#667eea',
                            borderRadius: 3,
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const generateHealthInsights = () => {
    const insights = {
      totalVisits: filteredRecords.length,
      lastVisit: filteredRecords.length > 0 ? formatDate(filteredRecords[0].visit_date).formatted : null,
      trend: getTrend(),
      commonConditions: getCommonConditions(),
      recommendations: getRecommendations(),
      monthlyVisits: getMonthlyVisits()
    };
    return insights;
  };

  const getTrend = () => {
    if (filteredRecords.length < 2) return 'Insufficient data for trend analysis';
    
    const recentVisits = filteredRecords.filter(r => 
      dayjs(r.visit_date).isAfter(dayjs().subtract(6, 'month'))
    ).length;
    
    const olderVisits = filteredRecords.filter(r => 
      dayjs(r.visit_date).isBetween(dayjs().subtract(12, 'month'), dayjs().subtract(6, 'month'))
    ).length;
    
    if (recentVisits > olderVisits) {
      return 'Increased medical attention recently';
    } else if (recentVisits < olderVisits) {
      return 'Fewer visits recently - good health trend';
    } else {
      return 'Consistent healthcare monitoring';
    }
  };

  const getCommonConditions = () => {
    const conditions = {};
    filteredRecords.forEach(record => {
      if (record.diagnosis) {
        conditions[record.diagnosis] = (conditions[record.diagnosis] || 0) + 1;
      }
    });
    
    return Object.entries(conditions)
      .filter(([, count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([condition, count]) => ({ condition, count }));
  };

  const getRecommendations = () => {
    const recommendations = [
      {
        type: 'info',
        title: 'Regular Check-ups',
        description: 'Schedule annual health check-ups to maintain optimal health and catch any issues early.'
      }
    ];

    // Add specific recommendations based on conditions
    const hasRecentVisits = filteredRecords.some(r => 
      dayjs(r.visit_date).isAfter(dayjs().subtract(3, 'month'))
    );
    
    if (!hasRecentVisits) {
      recommendations.push({
        type: 'warning',
        title: 'Health Check Due',
        description: 'Consider scheduling a routine health check-up as it has been a while since your last visit.'
      });
    }

    const commonDiagnoses = getCommonConditions();
    if (commonDiagnoses.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Monitor Recurring Conditions',
        description: `Keep track of symptoms related to ${commonDiagnoses[0].condition} and follow your healthcare provider's advice.`
      });
    }

    if (filteredRecords.length >= 5) {
      recommendations.push({
        type: 'success',
        title: 'Good Health Monitoring',
        description: 'You are actively monitoring your health. Keep up the good work with regular medical care.'
      });
    }

    return recommendations;
  };

  const getMonthlyVisits = () => {
    const months = {};
    filteredRecords.forEach(record => {
      const month = dayjs(record.visit_date).format('MMM YYYY');
      months[month] = (months[month] || 0) + 1;
    });

    return Object.entries(months)
      .sort(([a], [b]) => dayjs(a, 'MMM YYYY').isAfter(dayjs(b, 'MMM YYYY')) ? -1 : 1)
      .slice(0, 6)
      .map(([month, visits]) => ({ month, visits }));
  };

  const renderPatientSelector = () => {
    if (!isStaffOrMedical) return null;

    return (
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            👤 Patient Selection
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.first_name} ${option.last_name}${option.id_number ? ` (${option.id_number})` : ''}`}
                value={selectedPatient}
                onChange={(event, newValue) => setSelectedPatient(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search and select patient"
                    variant="outlined"
                    size="medium"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonIcon sx={{ color: 'action.active', mr: 1 }} />,
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#667eea', width: 32, height: 32 }}>
                      {option.first_name?.[0]}{option.last_name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.first_name} {option.last_name}
                      </Typography>
                      {option.id_number && (
                        <Typography variant="caption" color="text.secondary">
                          USC ID: {option.id_number}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                noOptionsText="No patients found"
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedPatient && (
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={() => setSelectedPatient(null)}
                    startIcon={<ClearIcon />}
                    size="small"
                  >
                    Clear Selection
                  </Button>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
                  {patients.length} patients available
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Allergy Alert */}
          {selectedPatient && checkForAllergies().length > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mt: 2, borderColor: '#ff9800', backgroundColor: '#fff3e0' }}
              icon={<WarningIcon />}
            >
              <Typography variant="body2" fontWeight="bold">
                ⚠️ ALLERGY ALERT: {selectedPatient.first_name} {selectedPatient.last_name}
              </Typography>
              <Typography variant="body2">
                Patient has documented allergies. Review medical history carefully.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderRecordTimeline = () => {
    if (filteredRecords.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No medical records found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedPatient 
              ? `No records available for ${selectedPatient.first_name} ${selectedPatient.last_name}`
              : 'Select a patient to view their medical history'
            }
          </Typography>
        </Paper>
      );
    }

    return (
      <Stack spacing={2}>
        {filteredRecords.map((record, index) => (
          <Card key={record.id} sx={{ position: 'relative' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: getRecordColor(record.record_type),
                    width: 40,
                    height: 40
                  }}
                >
                  {getRecordIcon(record.record_type)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
              <Card 
                elevation={2} 
                sx={{ 
                  mb: 2,
                  border: `2px solid ${getRecordColor(record.record_type)}20`,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent>
                  {/* Allergy/Medication Alerts */}
                  {(record.notes?.toLowerCase().includes('allerg') || 
                    record.diagnosis?.toLowerCase().includes('allerg') ||
                    record.medications?.toLowerCase().includes('allerg')) && (
                    <Alert 
                      severity="warning" 
                      sx={{ mb: 2, borderColor: '#ff9800', backgroundColor: '#fff8e1' }}
                      icon={<WarningIcon />}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        ⚠️ ALLERGY DOCUMENTED
                      </Typography>
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                          {record.diagnosis || 'No diagnosis recorded'}
                        </Typography>
                        <Chip 
                          label={record.record_type || 'MEDICAL'} 
                          color={record.record_type === 'DENTAL' ? 'secondary' : 'primary'}
                          size="small"
                        />
                      </Box>
                      
                      {/* Patient Name Header - Always Visible */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: getRecordColor(record.record_type),
                            width: 24, height: 24, fontSize: '0.75rem'
                          }}
                        >
                          {record.patient_name ? 
                            record.patient_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                            record.patient?.first_name?.[0] + record.patient?.last_name?.[0] || 'P'
                          }
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium" color="text.primary">
                          {record.patient_name || 
                           (record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : 'Unknown Patient')}
                          {(record.patient?.id_number || record.patient_usc_id) && 
                            <Chip 
                              label={record.patient?.id_number || record.patient_usc_id} 
                              size="small" 
                              variant="outlined"
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          }
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(record.visit_date).formatted}
                          <span style={{ marginLeft: 8, fontStyle: 'italic' }}>
                            ({formatDate(record.visit_date).relative})
                          </span>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {record.chief_complaint && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Chief Complaint:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.chief_complaint}
                      </Typography>
                    </Box>
                  )}

                  {record.treatment && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Treatment:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.treatment}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {record.vital_signs && Object.values(record.vital_signs).some(v => v) && (
                        <Chip 
                          icon={<VitalIcon />} 
                          label="Vitals Recorded" 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                      {record.medications && (
                        <Chip 
                          icon={<MedicationIcon />} 
                          label="Medications" 
                          size="small" 
                          variant="outlined"
                          color="info"
                        />
                      )}
                      {record.notes && (
                        <Chip 
                          icon={<NotesIcon />} 
                          label="Has Notes" 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                      {(record.notes?.toLowerCase().includes('allerg') || 
                        record.diagnosis?.toLowerCase().includes('allerg') ||
                        record.medications?.toLowerCase().includes('allerg')) && (
                        <Chip 
                          icon={<WarningIcon />} 
                          label="Allergy Alert" 
                          size="small" 
                          color="warning"
                          variant="filled"
                        />
                      )}
                    </Box>
                    <IconButton
                      onClick={() => handleExpandRecord(record.id)}
                      size="small"
                    >
                      {expandedRecord === record.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={expandedRecord === record.id}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      {record.vital_signs && Object.values(record.vital_signs).some(v => v) && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            Vital Signs:
                          </Typography>
                          <List dense>
                            {record.vital_signs.temperature && (
                              <ListItem>
                                <ListItemText 
                                  primary="Temperature" 
                                  secondary={`${record.vital_signs.temperature}°C`} 
                                />
                              </ListItem>
                            )}
                            {record.vital_signs.blood_pressure && (
                              <ListItem>
                                <ListItemText 
                                  primary="Blood Pressure" 
                                  secondary={`${record.vital_signs.blood_pressure} mmHg`} 
                                />
                              </ListItem>
                            )}
                            {record.vital_signs.heart_rate && (
                              <ListItem>
                                <ListItemText 
                                  primary="Heart Rate" 
                                  secondary={`${record.vital_signs.heart_rate} bpm`} 
                                />
                              </ListItem>
                            )}
                            {record.vital_signs.respiratory_rate && (
                              <ListItem>
                                <ListItemText 
                                  primary="Respiratory Rate" 
                                  secondary={`${record.vital_signs.respiratory_rate} breaths/min`} 
                                />
                              </ListItem>
                            )}
                            {record.vital_signs.oxygen_saturation && (
                              <ListItem>
                                <ListItemText 
                                  primary="Oxygen Saturation" 
                                  secondary={`${record.vital_signs.oxygen_saturation}%`} 
                                />
                              </ListItem>
                            )}
                          </List>
                        </Grid>
                      )}
                      {record.medications && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            💊 Medications:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {record.medications}
                          </Typography>
                        </Grid>
                      )}
                      {record.notes && (
                        <Grid item xs={12} md={record.medications ? 6 : 12}>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            Clinical Notes:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {record.notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Collapse>
                </CardContent>
              </Card>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Medical History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isStaffOrMedical 
            ? 'Browse patient medical histories in a timeline format. View comprehensive records, vital signs, and treatment progression.' 
            : 'View your complete medical history and health records in an easy-to-read timeline format.'
          }
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Patient Selector for Staff/Medical */}
      {renderPatientSelector()}

      {/* Mobile-Friendly Patient Selector for Small Screens */}
      {isStaffOrMedical && (
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Patient
              </Typography>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.first_name} ${option.last_name}${option.id_number ? ` (${option.id_number})` : ''}`}
                value={selectedPatient}
                onChange={(event, newValue) => setSelectedPatient(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search patients"
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Avatar sx={{ mr: 2, bgcolor: '#667eea' }}>
                      {option.first_name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {option.first_name} {option.last_name}
                      </Typography>
                      {option.id_number && (
                        <Typography variant="caption" color="text.secondary">
                          ID: {option.id_number}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              />
              {selectedPatient && (
                <Button 
                  variant="outlined" 
                  color="secondary"
                  onClick={() => setSelectedPatient(null)}
                  size="small"
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  Clear Selection
                </Button>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Search and Filters */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            🔍 Search & Filters
          </Typography>
          <Grid container spacing={2}>
            {/* Search Box */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search medical records"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Search by diagnosis, treatment, medications..."
              />
            </Grid>
            
            {/* Date Range Filters */}
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <DatePicker
                    label="From Date"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{ 
                      textField: { 
                        size: 'small',
                        sx: { flex: 1 }
                      } 
                    }}
                    maxDate={endDate || dayjs()}
                  />
                  <DatePicker
                    label="To Date"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{ 
                      textField: { 
                        size: 'small',
                        sx: { flex: 1 }
                      } 
                    }}
                    minDate={startDate}
                    maxDate={dayjs()}
                  />
                  {(startDate || endDate) && (
                    <IconButton onClick={clearDateFilters} size="small" title="Clear dates">
                      <ClearIcon />
                    </IconButton>
                  )}
                </Box>
              </LocalizationProvider>
            </Grid>
            
            {/* Action Buttons */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', height: '100%' }}>
                {isStaffOrMedical && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={() => window.open('/health-records', '_blank')}
                    sx={{
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                      }
                    }}
                  >
                    New Record
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<CertificateIcon />}
                  size="small"
                  disabled={filteredRecords.length === 0}
                  onClick={() => window.open('/medical-certificates', '_blank')}
                >
                  Certificate
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  size="small"
                  disabled={filteredRecords.length === 0}
                  onClick={handlePrintRecords}
                >
                  Print
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  size="small"
                  disabled={filteredRecords.length === 0}
                  onClick={handleExportRecords}
                >
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {/* Active Filters Display */}
          {(searchTerm || selectedPatient || startDate || endDate) && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active filters:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {searchTerm && (
                  <Chip 
                    label={`Search: "${searchTerm}"`} 
                    onDelete={() => setSearchTerm('')} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                )}
                {selectedPatient && (
                  <Chip 
                    label={`Patient: ${selectedPatient.first_name} ${selectedPatient.last_name}`} 
                    onDelete={() => setSelectedPatient(null)} 
                    size="small" 
                    color="secondary"
                    variant="outlined"
                  />
                )}
                {startDate && (
                  <Chip 
                    label={`From: ${dayjs(startDate).format('MMM DD, YYYY')}`} 
                    onDelete={() => setStartDate(null)} 
                    size="small" 
                    variant="outlined"
                  />
                )}
                {endDate && (
                  <Chip 
                    label={`To: ${dayjs(endDate).format('MMM DD, YYYY')}`} 
                    onDelete={() => setEndDate(null)} 
                    size="small" 
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="medical history tabs">
          <Tab label="All Records" id="medical-history-tab-0" />
          {isStudent && (
            <Tab label="Health Insights" id="medical-history-tab-1" icon={<ExpandMoreIcon />} iconPosition="start" />
          )}
        </Tabs>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards - Mobile Optimized */}
          {filteredRecords.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <Card elevation={1}>
                  <CardContent sx={{ textAlign: 'center', py: { xs: 1, md: 2 } }}>
                    <Typography variant={{ xs: 'h5', md: 'h4' }} color="primary">
                      {filteredRecords.length}
                    </Typography>
                    <Typography variant={{ xs: 'caption', md: 'body2' }} color="text.secondary">
                      Total Records
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card elevation={1}>
                  <CardContent sx={{ textAlign: 'center', py: { xs: 1, md: 2 } }}>
                    <Typography variant={{ xs: 'h5', md: 'h4' }} color="primary">
                      {filteredRecords.filter(r => r.record_type === 'MEDICAL').length}
                    </Typography>
                    <Typography variant={{ xs: 'caption', md: 'body2' }} color="text.secondary">
                      Medical
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card elevation={1}>
                  <CardContent sx={{ textAlign: 'center', py: { xs: 1, md: 2 } }}>
                    <Typography variant={{ xs: 'h5', md: 'h4' }} color="primary">
                      {filteredRecords.filter(r => r.record_type === 'DENTAL').length}
                    </Typography>
                    <Typography variant={{ xs: 'caption', md: 'body2' }} color="text.secondary">
                      Dental
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card elevation={1}>
                  <CardContent sx={{ textAlign: 'center', py: { xs: 1, md: 2 } }}>
                    <Typography variant={{ xs: 'h5', md: 'h4' }} color="primary">
                      {filteredRecords.filter(r => dayjs(r.visit_date).isAfter(dayjs().subtract(30, 'day'))).length}
                    </Typography>
                    <Typography variant={{ xs: 'caption', md: 'body2' }} color="text.secondary">
                      Recent
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Timeline or Health Insights */}
          <Paper elevation={1} sx={{ p: 3 }}>
            {tabValue === 1 && isStudent ? renderHealthInsights() : renderRecordTimeline()}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default MedicalHistoryPage;