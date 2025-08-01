import React, { useEffect, useState, useCallback } from 'react';
import { 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  CircularProgress, 
  TextField, 
  InputAdornment, 
  Chip,
  Tab,
  Tabs,
  Grid,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  LinearProgress,
  Stack,
  Divider,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  LocalHospital as MedicalIcon,
  Healing as DentalIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Print as PrintIcon,
  GetApp as ExportIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Medication as MedicationIcon,
  Favorite as VitalIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { healthRecordsService, dentalRecordService, patientService } from '../services/api';
import { useSelector } from 'react-redux';

dayjs.extend(relativeTime);

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`medical-records-tabpanel-${index}`}
      aria-labelledby={`medical-records-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const MedicalRecordsPage = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [dentalRecords, setDentalRecords] = useState([]);
  const [filteredMedicalRecords, setFilteredMedicalRecords] = useState([]);
  const [filteredDentalRecords, setFilteredDentalRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [procedureFilter, setProcedureFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  const user = useSelector(state => state.auth.user);
  const isStaffOrMedical = user?.role && ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(user.role);
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    fetchMedicalRecords();
    fetchDentalRecords();
    if (isStaffOrMedical) {
      fetchPatients();
    }
  }, []);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, medicalRecords, dentalRecords, selectedPatient, startDate, endDate, procedureFilter, priorityFilter]);

  const fetchMedicalRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthRecordsService.getAll();
      const recordsData = response.data || [];
      setMedicalRecords(recordsData);
    } catch (err) {
      setError('Failed to load medical records.');
      console.error('Error fetching medical records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentalRecords = async () => {
    try {
      const response = await dentalRecordService.getAll();
      const recordsData = response.data || [];
      setDentalRecords(recordsData);
    } catch (err) {
      console.error('Error fetching dental records:', err);
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
    // Enhanced search functionality
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Filter medical records with enhanced multi-field search
    let filteredMedical = medicalRecords;
    
    if (selectedPatient) {
      filteredMedical = filteredMedical.filter(record => record.patient?.id === selectedPatient.id);
    }
    
    if (searchLower !== '') {
      filteredMedical = filteredMedical.filter(record => 
        // Patient information
        record.patient_name?.toLowerCase().includes(searchLower) ||
        record.patient?.first_name?.toLowerCase().includes(searchLower) ||
        record.patient?.last_name?.toLowerCase().includes(searchLower) ||
        record.patient?.email?.toLowerCase().includes(searchLower) ||
        record.patient_usc_id?.toLowerCase().includes(searchLower) ||
        
        // Medical information
        record.diagnosis?.toLowerCase().includes(searchLower) ||
        record.treatment?.toLowerCase().includes(searchLower) ||
        record.chief_complaint?.toLowerCase().includes(searchLower) ||
        record.medications?.toLowerCase().includes(searchLower) ||
        record.notes?.toLowerCase().includes(searchLower) ||
        
        // Vital signs search
        record.temperature?.toString().includes(searchLower) ||
        record.blood_pressure?.toLowerCase().includes(searchLower) ||
        record.pulse_rate?.toString().includes(searchLower) ||
        
        // Full name search
        `${record.patient?.first_name} ${record.patient?.last_name}`.toLowerCase().includes(searchLower)
      );
    }
    
    if (startDate) {
      filteredMedical = filteredMedical.filter(record => 
        dayjs(record.visit_date).isAfter(dayjs(startDate).subtract(1, 'day'))
      );
    }
    
    if (endDate) {
      filteredMedical = filteredMedical.filter(record => 
        dayjs(record.visit_date).isBefore(dayjs(endDate).add(1, 'day'))
      );
    }
    
    setFilteredMedicalRecords(filteredMedical.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date)));
    
    // Filter dental records with enhanced search
    let filteredDental = dentalRecords;
    
    if (selectedPatient) {
      filteredDental = filteredDental.filter(record => record.patient?.id === selectedPatient.id);
    }
    
    if (searchLower !== '') {
      filteredDental = filteredDental.filter(record => 
        // Patient information
        record.patient_name?.toLowerCase().includes(searchLower) ||
        record.patient?.first_name?.toLowerCase().includes(searchLower) ||
        record.patient?.last_name?.toLowerCase().includes(searchLower) ||
        record.patient?.email?.toLowerCase().includes(searchLower) ||
        record.patient_usc_id?.toLowerCase().includes(searchLower) ||
        
        // Dental information
        record.diagnosis?.toLowerCase().includes(searchLower) ||
        record.treatment_performed?.toLowerCase().includes(searchLower) ||
        record.procedure_performed_display?.toLowerCase().includes(searchLower) ||
        record.procedure_performed?.toLowerCase().includes(searchLower) ||
        record.chief_complaint?.toLowerCase().includes(searchLower) ||
        record.notes?.toLowerCase().includes(searchLower) ||
        record.affected_teeth_display?.toLowerCase().includes(searchLower) ||
        
        // Priority and other fields
        record.priority?.toLowerCase().includes(searchLower) ||
        record.cost?.toString().includes(searchLower) ||
        
        // Full name search
        `${record.patient?.first_name} ${record.patient?.last_name}`.toLowerCase().includes(searchLower)
      );
    }
    
    if (startDate) {
      filteredDental = filteredDental.filter(record => 
        dayjs(record.visit_date).isAfter(dayjs(startDate).subtract(1, 'day'))
      );
    }
    
    if (endDate) {
      filteredDental = filteredDental.filter(record => 
        dayjs(record.visit_date).isBefore(dayjs(endDate).add(1, 'day'))
      );
    }
    
    if (procedureFilter) {
      filteredDental = filteredDental.filter(record => record.procedure_performed === procedureFilter);
    }
    
    if (priorityFilter) {
      filteredDental = filteredDental.filter(record => record.priority === priorityFilter);
    }
    
    setFilteredDentalRecords(filteredDental.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date)));
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return '#f44336';
      case 'HIGH': return '#ff9800';
      case 'MEDIUM': return '#2196f3';
      case 'LOW': return '#4caf50';
      default: return '#757575';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPatient(null);
    setStartDate(null);
    setEndDate(null);
    setProcedureFilter('');
    setPriorityFilter('');
  };

  const handleExportRecords = (recordType = 'all') => {
    let exportData = [];
    
    if (recordType === 'medical' || recordType === 'all') {
      const medicalExport = filteredMedicalRecords.map(record => ({
        Type: 'Medical',
        Date: formatDate(record.visit_date).formatted,
        Patient: record.patient_name || `Patient ID: ${record.patient}`,
        Diagnosis: record.diagnosis || 'No diagnosis',
        Treatment: record.treatment || 'No treatment',
        Notes: record.notes || 'No notes'
      }));
      exportData = [...exportData, ...medicalExport];
    }
    
    if (recordType === 'dental' || recordType === 'all') {
      const dentalExport = filteredDentalRecords.map(record => ({
        Type: 'Dental',
        Date: formatDate(record.visit_date).formatted,
        Patient: record.patient_name || `Patient ID: ${record.patient}`,
        Procedure: record.procedure_performed_display || 'No procedure',
        Diagnosis: record.diagnosis || 'No diagnosis',
        Treatment: record.treatment_performed || 'No treatment',
        Priority: record.priority || 'N/A',
        Cost: formatCurrency(record.cost)
      }));
      exportData = [...exportData, ...dentalExport];
    }
    
    if (exportData.length === 0) return;
    
    const csvContent = [
      Object.keys(exportData[0]).join(','),
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
    link.setAttribute('download', `${recordType}-records-${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate insights data
  const generateInsights = () => {
    const allRecords = [...filteredMedicalRecords, ...filteredDentalRecords];
    
    const insights = {
      totalRecords: allRecords.length,
      medicalRecords: filteredMedicalRecords.length,
      dentalRecords: filteredDentalRecords.length,
      recentRecords: allRecords.filter(r => 
        dayjs(r.visit_date).isAfter(dayjs().subtract(30, 'day'))
      ).length,
      commonConditions: getCommonConditions(allRecords),
      healthTrend: getHealthTrend(allRecords),
      monthlyVisits: getMonthlyVisits(allRecords),
      recommendations: getRecommendations(allRecords)
    };
    
    return insights;
  };

  const getCommonConditions = (records) => {
    const conditions = {};
    records.forEach(record => {
      if (record.diagnosis) {
        conditions[record.diagnosis] = (conditions[record.diagnosis] || 0) + 1;
      }
    });
    
    return Object.entries(conditions)
      .filter(([, count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([condition, count]) => ({ condition, count }));
  };

  const getHealthTrend = (records) => {
    if (records.length < 2) return 'insufficient-data';
    
    const recentVisits = records.filter(r => 
      dayjs(r.visit_date).isAfter(dayjs().subtract(6, 'month'))
    ).length;
    
    const olderVisits = records.filter(r => 
      dayjs(r.visit_date).isBetween(dayjs().subtract(12, 'month'), dayjs().subtract(6, 'month'))
    ).length;
    
    if (recentVisits > olderVisits) return 'increasing';
    if (recentVisits < olderVisits) return 'decreasing';
    return 'stable';
  };

  const getMonthlyVisits = (records) => {
    const months = {};
    records.forEach(record => {
      const month = dayjs(record.visit_date).format('MMM YYYY');
      months[month] = (months[month] || 0) + 1;
    });

    return Object.entries(months)
      .sort(([a], [b]) => dayjs(a, 'MMM YYYY').isAfter(dayjs(b, 'MMM YYYY')) ? -1 : 1)
      .slice(0, 6)
      .map(([month, visits]) => ({ month, visits }));
  };

  const getRecommendations = (records) => {
    const recommendations = [];
    
    const hasRecentVisits = records.some(r => 
      dayjs(r.visit_date).isAfter(dayjs().subtract(3, 'month'))
    );
    
    if (!hasRecentVisits) {
      recommendations.push({
        type: 'warning',
        title: 'Schedule Health Check-up',
        description: 'Consider scheduling a routine health check-up as it has been a while since your last visit.'
      });
    }
    
    const commonConditions = getCommonConditions(records);
    if (commonConditions.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Monitor Recurring Conditions',
        description: `Keep track of symptoms related to ${commonConditions[0].condition} and follow your healthcare provider's advice.`
      });
    }
    
    const dentalVisits = records.filter(r => r.procedure_performed || r.treatment_performed);
    if (dentalVisits.length === 0) {
      recommendations.push({
        type: 'info',
        title: 'Dental Care',
        description: 'Regular dental check-ups are important for overall health. Consider scheduling a dental examination.'
      });
    }
    
    if (records.length >= 5) {
      recommendations.push({
        type: 'success',
        title: 'Good Health Monitoring',
        description: 'You are actively monitoring your health. Keep up with regular medical care.'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        title: 'Maintain Regular Check-ups',
        description: 'Continue with regular health check-ups to maintain optimal health and catch any issues early.'
      });
    }
    
    return recommendations;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Patient Medical History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isStaffOrMedical 
              ? 'Browse and search through patient medical and dental history records with advanced filtering capabilities.' 
              : 'View your complete medical and dental records history, plus personalized health insights.'
            }
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="medical records tabs">
            <Tab 
              label={`Medical Records (${filteredMedicalRecords.length})`} 
              icon={<MedicalIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={`Dental Records (${filteredDentalRecords.length})`} 
              icon={<DentalIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Health Insights" 
              icon={<AnalyticsIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" gutterBottom color="primary">
            🔍 Search & Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
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
                placeholder="Search by patient name, diagnosis, treatment, medications, notes..."
                helperText="Search across all medical and dental records"
              />
            </Grid>
            
            {/* Enhanced Patient Filter for Staff */}
            {isStaffOrMedical && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Patient</InputLabel>
                  <Select
                    value={selectedPatient?.id || ''}
                    label="Filter by Patient"
                    onChange={(e) => {
                      const patient = patients.find(p => p.id === e.target.value);
                      setSelectedPatient(patient || null);
                    }}
                    startAdornment={<PersonIcon sx={{ color: 'action.active', mr: 1 }} />}
                  >
                    <MenuItem value="">
                      <em>All Patients ({patients.length} total)</em>
                    </MenuItem>
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
                            {patient.first_name?.[0]}{patient.last_name?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {patient.first_name} {patient.last_name}
                            </Typography>
                            {patient.usc_id && (
                              <Typography variant="caption" color="text.secondary">
                                USC ID: {patient.usc_id}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} md={2}>
              <DatePicker
                label="From Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                maxDate={endDate || dayjs()}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <DatePicker
                label="To Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                minDate={startDate}
                maxDate={dayjs()}
              />
            </Grid>

            {tabValue === 1 && (
              <>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={priorityFilter}
                      label="Priority"
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <MenuItem value="">All Priorities</MenuItem>
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="URGENT">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12} md={tabValue === 1 ? 1 : 3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  size="small"
                >
                  Clear
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  onClick={() => handleExportRecords(tabValue === 0 ? 'medical' : tabValue === 1 ? 'dental' : 'all')}
                  size="small"
                  disabled={tabValue === 0 ? filteredMedicalRecords.length === 0 : tabValue === 1 ? filteredDentalRecords.length === 0 : (filteredMedicalRecords.length + filteredDentalRecords.length) === 0}
                >
                  Export
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Tab Panels */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress size={60} />
            <Typography sx={{ ml: 2 }}>Loading records...</Typography>
          </Box>
        ) : (
          <>
            {/* Medical Records Tab */}
            <TabPanel value={tabValue} index={0}>
              {/* Medical Records List */}
              <Paper sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      Medical Records History
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        label={`${filteredMedicalRecords.length} record${filteredMedicalRecords.length !== 1 ? 's' : ''}`}
                        color="primary"
                        variant="outlined"
                      />
                      {isStaffOrMedical && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => window.open('/health-records', '_blank')}
                          sx={{ 
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' }
                          }}
                        >
                          Create New
                        </Button>
                      )}
                    </Box>
                  </Box>
                  {isStaffOrMedical && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>📝 Create New Records:</strong> Use the "Create New" button above or visit the{' '}
                        <Button 
                          variant="text" 
                          size="small" 
                          onClick={() => window.open('/health-records', '_blank')}
                          sx={{ textTransform: 'none', p: 0, textDecoration: 'underline' }}
                        >
                          Health Records page
                        </Button>{' '}
                        to create new medical records for patients.
                      </Typography>
                    </Alert>
                  )}
                </Box>

                <Box sx={{ p: 3 }}>
                  {filteredMedicalRecords.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <MedicalIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No medical records found
                      </Typography>
                      <Typography color="text.secondary">
                        {isStaffOrMedical 
                          ? 'Create the first medical record using the form above.' 
                          : 'No medical records have been created for your account yet.'
                        }
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarTodayIcon sx={{ mr: 1, fontSize: 18 }} />
                                Date
                              </Box>
                            </TableCell>
                            {isStaffOrMedical && (
                              <TableCell sx={{ fontWeight: 'bold' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                                  Patient
                                </Box>
                              </TableCell>
                            )}
                            <TableCell sx={{ fontWeight: 'bold' }}>Diagnosis</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Treatment</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredMedicalRecords.map((record) => (
                            <TableRow 
                              key={record.id} 
                              hover
                              sx={{ 
                                '&:hover': { backgroundColor: '#f9f9f9' }
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {formatDate(record.visit_date).formatted}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(record.visit_date).relative}
                                </Typography>
                              </TableCell>
                              {isStaffOrMedical && (
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {record.patient_name || `Patient ID: ${record.patient}`}
                                  </Typography>
                                  {record.patient_usc_id && (
                                    <Typography variant="caption" color="text.secondary">
                                      USC ID: {record.patient_usc_id}
                                    </Typography>
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    maxWidth: 200, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {record.diagnosis || 'No diagnosis recorded'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    maxWidth: 200, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {record.treatment || 'No treatment recorded'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Paper>
            </TabPanel>

            {/* Dental Records Tab */}
            <TabPanel value={tabValue} index={1}>
              <Paper sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      Dental Records History
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Chip 
                        label={`${filteredDentalRecords.length} record${filteredDentalRecords.length !== 1 ? 's' : ''}`}
                        color="secondary"
                        variant="outlined"
                      />
                      {isStaffOrMedical && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => window.open('/dental-records', '_blank')}
                          sx={{ bgcolor: '#f093fb' }}
                        >
                          New Dental Record
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ p: 3 }}>
                  {filteredDentalRecords.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <DentalIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No dental records found
                      </Typography>
                      <Typography color="text.secondary">
                        {isStaffOrMedical 
                          ? 'Create the first dental record by clicking the button above.' 
                          : 'No dental records have been created for your account yet.'
                        }
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      {filteredDentalRecords.map((record) => (
                        <Grid item xs={12} md={6} lg={4} key={record.id}>
                          <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                <Typography variant="h6" component="div">
                                  {record.patient_name}
                                </Typography>
                                <Chip
                                  label={record.priority || 'LOW'}
                                  size="small"
                                  sx={{
                                    bgcolor: getPriorityColor(record.priority),
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </Box>
                              
                              <Typography color="text.secondary" gutterBottom>
                                <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                {formatDate(record.visit_date).formatted}
                              </Typography>
                              
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <DentalIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                {record.procedure_performed_display}
                              </Typography>
                              
                              {record.tooth_numbers && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Teeth: {record.affected_teeth_display}
                                </Typography>
                              )}
                              
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {record.diagnosis?.length > 100 
                                  ? `${record.diagnosis.substring(0, 100)}...` 
                                  : record.diagnosis}
                              </Typography>
                              
                              {record.pain_level && (
                                <Box display="flex" alignItems="center" mt={1}>
                                  <Typography variant="body2" color="text.secondary" mr={1}>
                                    Pain Level:
                                  </Typography>
                                  <Rating value={record.pain_level / 2} readOnly size="small" />
                                  <Typography variant="body2" color="text.secondary" ml={1}>
                                    ({record.pain_level}/10)
                                  </Typography>
                                </Box>
                              )}
                              
                              {record.cost && (
                                <Typography variant="body2" color="text.secondary" mt={1}>
                                  Cost: {formatCurrency(record.cost)}
                                  {record.insurance_covered && (
                                    <Chip label="Insured" size="small" sx={{ ml: 1 }} />
                                  )}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </Paper>
            </TabPanel>

            {/* Health Insights Tab */}
            <TabPanel value={tabValue} index={2}>
              {(() => {
                const insights = generateInsights();
                
                if (insights.totalRecords === 0) {
                  return (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                      <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No health data available
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Health insights will appear here once you have medical or dental records.
                      </Typography>
                    </Paper>
                  );
                }
                
                return (
                  <Box>
                    <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
                      📊 Your Health Insights
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                      Personalized insights based on your medical and dental history to help you understand your health better.
                    </Typography>

                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={12} md={3}>
                        <Card elevation={2} sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">
                            {insights.totalRecords}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Records
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card elevation={2} sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">
                            {insights.medicalRecords}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Medical Records
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card elevation={2} sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="secondary">
                            {insights.dentalRecords}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Dental Records
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card elevation={2} sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="success.main">
                            {insights.recentRecords}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Recent (30 days)
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                      {/* Health Trend */}
                      <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">
                              📈 Health Trend
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              {insights.healthTrend === 'increasing' && (
                                <>
                                  <TrendingUpIcon color="warning" sx={{ mr: 1 }} />
                                  <Typography>Increased medical visits recently</Typography>
                                </>
                              )}
                              {insights.healthTrend === 'decreasing' && (
                                <>
                                  <TrendingDownIcon color="success" sx={{ mr: 1 }} />
                                  <Typography>Fewer visits recently - good trend</Typography>
                                </>
                              )}
                              {insights.healthTrend === 'stable' && (
                                <>
                                  <TimelineIcon color="info" sx={{ mr: 1 }} />
                                  <Typography>Consistent healthcare monitoring</Typography>
                                </>
                              )}
                              {insights.healthTrend === 'insufficient-data' && (
                                <>
                                  <AnalyticsIcon color="action" sx={{ mr: 1 }} />
                                  <Typography>Need more data for trend analysis</Typography>
                                </>
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Based on the last 12 months of visit patterns.
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Common Conditions */}
                      <Grid item xs={12} md={6}>
                        <Card elevation={2}>
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

                      {/* Monthly Visits Chart */}
                      {insights.monthlyVisits.length > 0 && (
                        <Grid item xs={12}>
                          <Card elevation={2}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom color="primary">
                                📅 Visit Frequency (Last 6 Months)
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
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: '#667eea',
                                          borderRadius: 4,
                                        }
                                      }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {/* Recommendations */}
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
                    </Grid>
                  </Box>
                );
              })()}
            </TabPanel>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default MedicalRecordsPage;
