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
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  LocalHospital as MedicalIcon,
  //Healing as DentalIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Print as PrintIcon,
  GetApp as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  InsertDriveFile as CsvIcon,
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
import { healthRecordsService, patientService } from '../services/api';
import { reportService } from '../services/reportService';
import ReportTemplate from './utils/ReportTemplate';
import { useSelector } from 'react-redux';
import { formatDateComprehensive, formatDatePH, formatDateTimePH } from '../utils/dateUtils';
import InfoTooltip from './utils/InfoTooltip';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [filteredMedicalRecords, setFilteredMedicalRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [procedureFilter, setProcedureFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const user = useSelector(state => state.auth.user);
  const isStaffOrMedical = user?.role && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'].includes(user.role);
  const isStudent = ['STUDENT', 'FACULTY'].includes(user?.role);
  // Only ADMIN, DOCTOR, and NURSE have CRUD for Medical. DENTIST and STAFF are view-only.
  const isAuthorizedToEdit = user?.role && ['ADMIN', 'DOCTOR', 'NURSE'].includes(user.role);

  useEffect(() => {
    fetchMedicalRecords();
    if (isStaffOrMedical) {
      fetchPatients();
    }
  }, []);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, medicalRecords, selectedPatient, startDate, endDate]);

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

  // Dental records are handled on the dedicated /dental-records page

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
      filteredMedical = filteredMedical.filter(record => {
        const patientId = (record.patient && typeof record.patient === 'object') ? record.patient.id : record.patient;
        return String(patientId) === String(selectedPatient.id);
      });
    }
    
    if (searchLower !== '') {
      filteredMedical = filteredMedical.filter(record => {
        const patientObj = (record.patient && typeof record.patient === 'object') ? record.patient : {};
        
        return (
          // Patient information
          record.patient_name?.toLowerCase().includes(searchLower) ||
          patientObj.first_name?.toLowerCase().includes(searchLower) ||
          patientObj.last_name?.toLowerCase().includes(searchLower) ||
          patientObj.email?.toLowerCase().includes(searchLower) ||
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
          (patientObj.first_name && patientObj.last_name && 
            `${patientObj.first_name} ${patientObj.last_name}`.toLowerCase().includes(searchLower))
        );
      });
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
    
  };


  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedMedicalRecords = filteredMedicalRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return { formatted: 'N/A', relative: 'N/A' };
    try {
      // Use our centralized date utilities for consistent Philippines timezone handling
      return formatDateComprehensive(dateString);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return { formatted: dateString, relative: '' };
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
  };

  // Enhanced export functions with multiple formats and comprehensive data
  const handleExportCSV = (recordType = 'medical') => {
    if (filteredMedicalRecords.length === 0) {
      alert('No records to export');
      return;
    }

    const data = reportService.prepareDataForExport(filteredMedicalRecords, 'MEDICAL');
    reportService.exportToCSV(data, `medical-records-${dayjs().format('YYYY-MM-DD-HHmm')}.csv`);
  };

  const handleExportExcel = (recordType = 'medical') => {
    if (filteredMedicalRecords.length === 0) {
      alert('No records to export');
      return;
    }

    const data = reportService.prepareDataForExport(filteredMedicalRecords, 'MEDICAL');
    reportService.exportToExcel(data, `medical-records-${dayjs().format('YYYY-MM-DD-HHmm')}.xls`);
  };

  const handlePrintReport = async (recordType = 'medical') => {
    if (filteredMedicalRecords.length === 0) {
      alert('No records to print');
      return;
    }

    const element = document.getElementById('professional-report-template');
    if (!element) return;
    
    setLoading(true);
    try {
      await reportService.generatePDF(element, `medical-consultation-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate professional PDF report.');
    } finally {
      setLoading(false);
    }
  };

  // Legacy function for backwards compatibility
  const handleExportRecords = (recordType = 'all') => {
    handleExportCSV(recordType);
  };

  // Generate insights data
  const generateInsights = () => {
    const allRecords = [...filteredMedicalRecords];
    
    const insights = {
      totalRecords: allRecords.length,
      medicalRecords: filteredMedicalRecords.length,
      dentalRecords: 0,
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" gutterBottom color="primary">
              {isStudent ? 'Patient Medical Records' : 'Patient Medical Records'}
            </Typography>
            <InfoTooltip title="Browse medical records. Use filters to narrow and actions to export." />
          </Box>
          <Typography variant="body1" color="text.secondary">
            {isStaffOrMedical 
              ? 'Browse and search through patient medical history records with advanced filtering capabilities.' 
              : 'View your complete medical records history, plus personalized health insights.'
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
                helperText="Search across all medical records"
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
            
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="From Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ 
                  textField: { 
                    fullWidth: true, 
                    size: 'small',
                    InputLabelProps: { shrink: true }
                  } 
                }}
                maxDate={endDate || dayjs()}
                disableFuture
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="To Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ 
                  textField: { 
                    fullWidth: true, 
                    size: 'small',
                    InputLabelProps: { shrink: true }
                  } 
                }}
                minDate={startDate}
                maxDate={dayjs()}
                disableFuture
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  size="small"
                  fullWidth={isMobile}
                >
                  Clear
                </Button>
                {/* Enhanced Export Options */}
                <Button
                  variant="outlined"
                  startIcon={<CsvIcon />}
                  onClick={() => handleExportCSV(tabValue === 0 ? 'medical' : tabValue === 1 ? 'dental' : 'all')}
                  size="small"
                  disabled={filteredMedicalRecords.length === 0}
                >
                  CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExcelIcon />}
                  onClick={() => handleExportExcel(tabValue === 0 ? 'medical' : tabValue === 1 ? 'dental' : 'all')}
                  size="small"
                  disabled={filteredMedicalRecords.length === 0}
                  sx={{ color: '#0d7c34', borderColor: '#0d7c34', '&:hover': { borderColor: '#0d7c34', bgcolor: '#f0f9f0' } }}
                >
                  Excel
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => handlePrintReport(tabValue === 0 ? 'medical' : tabValue === 1 ? 'dental' : 'all')}
                  size="small"
                  disabled={filteredMedicalRecords.length === 0}
                  sx={{ color: '#d32f2f', borderColor: '#d32f2f', '&:hover': { borderColor: '#d32f2f', bgcolor: '#fff0f0' } }}
                >
                  Print
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
                      {isAuthorizedToEdit && (
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
                  {isAuthorizedToEdit && (
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
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 1200 }}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarTodayIcon sx={{ mr: 1, fontSize: 18 }} />
                                Date
                              </Box>
                            </TableCell>
                            {isStaffOrMedical && (
                              <TableCell sx={{ fontWeight: 'bold', minWidth: 180 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                                  Patient
                                </Box>
                              </TableCell>
                            )}
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Diagnosis</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Treatment</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedMedicalRecords.map((record) => (
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
                                    maxWidth: 300, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'normal',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical'
                                  }}
                                >
                                  {record.diagnosis || 'No diagnosis recorded'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    maxWidth: 300, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'normal',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical'
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
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={filteredMedicalRecords.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                  </Box>
                )}
              </Paper>
            </TabPanel>

            {/* Health Insights Tab */}
            <TabPanel value={tabValue} index={1}>
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
                        Health insights will appear here once you have medical records.
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
              Personalized insights based on your medical history to help you understand your health better.
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
      
      {/* Professional Report Template (Hidden) */}
      <ReportTemplate 
        data={filteredMedicalRecords} 
        patient={selectedPatient || (filteredMedicalRecords.length > 0 ? patients.find(p => p.id === filteredMedicalRecords[0].patient) : null)}
        title="MEDICAL CONSULTATION REPORT" 
        reportType="MEDICAL"
      />
    </LocalizationProvider>
  );
};

export default MedicalRecordsPage;
