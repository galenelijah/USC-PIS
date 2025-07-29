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
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Divider,
  Autocomplete
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  CalendarMonth as CalendarIcon,
  MedicalServices as MedicalIcon,
  Person as PersonIcon,
  Medication as MedicationIcon,
  Healing as HealingIcon,
  Description as TemplateIcon,
  LibraryBooks as LibraryIcon,
  Timeline as TimelineIcon,
  Assignment as CertificateIcon,
  BarChart as ReportIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import dayjs from 'dayjs';
import { healthRecordsService, patientService } from '../services/api';
import MedicalRecord from './MedicalRecord';
import ClinicalAnalytics from './ClinicalAnalytics';

// Tab panel component for different record types
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`health-record-tabpanel-${index}`}
      aria-labelledby={`health-record-tab-${index}`}
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

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const user = useSelector(selectCurrentUser);
  const [selectedMedicalRecordId, setSelectedMedicalRecordId] = useState(null);
  const [openMedicalRecordModal, setOpenMedicalRecordModal] = useState(false);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);

  // Check if user can edit records (not a student)
  const canEditRecords = user && user.role !== 'STUDENT';

  // Clinical Templates for quick record creation
  const clinicalTemplates = [
    {
      name: "Common Cold",
      category: "MEDICAL",
      chief_complaint: "Runny nose, sneezing, and mild cough",
      diagnosis: "Common Cold (Upper Respiratory Infection)",
      treatment: "Rest, increased fluid intake, OTC decongestants as needed. Avoid antibiotics.",
      notes: "Patient advised on proper hand hygiene and rest. Follow-up if symptoms worsen or persist beyond 7-10 days."
    },
    {
      name: "Headache Assessment",
      category: "MEDICAL", 
      chief_complaint: "Headache with mild to moderate intensity",
      diagnosis: "Tension Headache",
      treatment: "OTC pain relievers (acetaminophen/ibuprofen), rest, hydration, stress management.",
      notes: "Patient counseled on trigger identification and lifestyle modifications. Return if severe or persistent."
    },
    {
      name: "Routine Dental Cleaning",
      category: "DENTAL",
      chief_complaint: "Routine dental checkup and cleaning",
      diagnosis: "Routine dental prophylaxis, good oral hygiene",
      treatment: "Professional dental cleaning, fluoride treatment, oral hygiene education.",
      notes: "Regular 6-month dental checkups recommended. Patient demonstrates good oral hygiene practices."
    },
    {
      name: "Minor Wound Care",
      category: "MEDICAL",
      chief_complaint: "Minor cut/abrasion requiring care",
      diagnosis: "Minor laceration/abrasion",
      treatment: "Wound cleaning, antiseptic application, bandaging. Tetanus status verified.",
      notes: "Patient educated on wound care, signs of infection. Follow-up if signs of infection develop."
    },
    {
      name: "Blood Pressure Check",
      category: "MEDICAL",
      chief_complaint: "Routine blood pressure monitoring",
      diagnosis: "Blood pressure assessment",
      treatment: "Lifestyle counseling, dietary recommendations as appropriate.",
      notes: "Patient advised on regular monitoring and healthy lifestyle practices."
    },
    {
      name: "Dental Pain Assessment",
      category: "DENTAL",
      chief_complaint: "Dental pain and discomfort",
      diagnosis: "Dental caries/tooth sensitivity",
      treatment: "Pain management, dental restoration referral if needed.",
      notes: "Patient referred for comprehensive dental evaluation and treatment planning."
    }
  ];

  useEffect(() => {
    fetchHealthRecords();
    fetchPatients();
  }, []);

  const fetchHealthRecords = async () => {
    setLoading(true);
    try {
      const response = await healthRecordsService.getAll();
      setRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching health records:', error);
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

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setCurrentRecord({
      patient: null,
      visit_date: dayjs().format('YYYY-MM-DD'),
      record_type: 'MEDICAL',
      chief_complaint: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      vital_signs: {
        temperature: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        oxygen_saturation: ''
      },
      medications: []
    });
    setOpenDialog(true);
  };

  const handleOpenTemplateDialog = () => {
    setOpenTemplateDialog(true);
  };

  const handleCloseTemplateDialog = () => {
    setOpenTemplateDialog(false);
  };

  const handleUseTemplate = (template) => {
    setDialogMode('create');
    setCurrentRecord({
      patient: null,
      visit_date: dayjs().format('YYYY-MM-DD'),
      record_type: template.category,
      chief_complaint: template.chief_complaint,
      diagnosis: template.diagnosis,
      treatment: template.treatment,
      notes: template.notes,
      vital_signs: {
        temperature: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        oxygen_saturation: ''
      },
      medications: []
    });
    setOpenTemplateDialog(false);
    setOpenDialog(true);
  };

  // Workflow automation functions
  const getFollowUpSuggestions = (record) => {
    const suggestions = [];
    
    // Check if follow-up is needed based on diagnosis
    const followUpDiagnoses = [
      'hypertension', 'diabetes', 'chronic', 'ongoing', 'monitor'
    ];
    
    if (followUpDiagnoses.some(keyword => 
      record.diagnosis?.toLowerCase().includes(keyword)
    )) {
      suggestions.push({
        type: 'follow-up',
        message: 'Consider scheduling a follow-up appointment in 2-4 weeks',
        action: 'Schedule Follow-up'
      });
    }
    
    // Check if medical certificate might be needed
    if (record.diagnosis?.toLowerCase().includes('sick') || 
        record.treatment?.toLowerCase().includes('rest')) {
      suggestions.push({
        type: 'certificate',
        message: 'Patient may need a medical certificate',
        action: 'Generate Certificate'
      });
    }
    
    // Check if lab work might be needed
    if (record.diagnosis?.toLowerCase().includes('blood') || 
        record.diagnosis?.toLowerCase().includes('test')) {
      suggestions.push({
        type: 'lab',
        message: 'Consider ordering relevant lab tests',
        action: 'Order Lab Work'
      });
    }
    
    return suggestions;
  };

  const handleAutomationAction = (action, record) => {
    switch (action) {
      case 'Schedule Follow-up':
        // Auto-create a follow-up record template
        setDialogMode('create');
        setCurrentRecord({
          patient: record.patient,
          visit_date: dayjs().add(2, 'week').format('YYYY-MM-DD'),
          record_type: record.record_type,
          chief_complaint: `Follow-up for: ${record.diagnosis}`,
          diagnosis: '',
          treatment: '',
          notes: `Follow-up appointment for previous diagnosis: ${record.diagnosis}`,
          vital_signs: {
            temperature: '',
            blood_pressure: '',
            heart_rate: '',
            respiratory_rate: '',
            oxygen_saturation: ''
          },
          medications: []
        });
        setOpenDialog(true);
        break;
      case 'Generate Certificate':
        window.open('/medical-certificates', '_blank');
        break;
      case 'Order Lab Work':
        alert('Lab work ordering system integration would be implemented here.');
        break;
      default:
        break;
    }
  };

  const handleGenerateReport = () => {
    // Generate comprehensive clinical report
    const reportData = {
      totalRecords: records.length,
      medicalRecords: records.filter(r => r.record_type === 'MEDICAL').length,
      dentalRecords: records.filter(r => r.record_type === 'DENTAL').length,
      recentRecords: records.filter(r => dayjs(r.visit_date).isAfter(dayjs().subtract(30, 'day'))).length,
      commonDiagnoses: getCommonDiagnoses(),
      patientStats: getPatientStatistics(),
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    
    // Create and download report
    downloadClinicalReport(reportData);
  };

  const getCommonDiagnoses = () => {
    const diagnoses = records.map(r => r.diagnosis).filter(Boolean);
    const diagnosisCount = {};
    diagnoses.forEach(d => {
      diagnosisCount[d] = (diagnosisCount[d] || 0) + 1;
    });
    return Object.entries(diagnosisCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([diagnosis, count]) => ({ diagnosis, count }));
  };

  const getPatientStatistics = () => {
    const uniquePatients = [...new Set(records.map(r => r.patient?.id).filter(Boolean))];
    return {
      totalPatients: uniquePatients.length,
      avgRecordsPerPatient: uniquePatients.length > 0 ? (records.length / uniquePatients.length).toFixed(1) : 0,
      patientsThisMonth: records.filter(r => 
        dayjs(r.visit_date).isAfter(dayjs().startOf('month'))
      ).map(r => r.patient?.id).filter((id, index, arr) => arr.indexOf(id) === index).length
    };
  };

  const downloadClinicalReport = (data) => {
    const reportContent = `
CLINICAL RECORDS REPORT
Generated: ${data.generatedAt}

=== SUMMARY STATISTICS ===
Total Records: ${data.totalRecords}
Medical Records: ${data.medicalRecords}
Dental Records: ${data.dentalRecords}
Records (Last 30 Days): ${data.recentRecords}

=== PATIENT STATISTICS ===
Total Patients: ${data.patientStats.totalPatients}
Average Records per Patient: ${data.patientStats.avgRecordsPerPatient}
New Patients This Month: ${data.patientStats.patientsThisMonth}

=== COMMON DIAGNOSES ===
${data.commonDiagnoses.map(d => `${d.diagnosis}: ${d.count} cases`).join('\n')}

=== DETAILED RECORDS ===
${filteredRecords.map(r => `
Date: ${r.visit_date}
Patient: ${r.patient_name || `Patient ID: ${r.patient}`}
Type: ${r.record_type}
Diagnosis: ${r.diagnosis || 'N/A'}
Treatment: ${r.treatment || 'N/A'}
`).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-report-${dayjs().format('YYYY-MM-DD')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenEditDialog = (record) => {
    setDialogMode('edit');
    setCurrentRecord({
      ...record,
      visit_date: record.visit_date,
      vital_signs: record.vital_signs || {
        temperature: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        oxygen_saturation: ''
      }
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRecord(null);
  };

  const handleSaveRecord = async () => {
    try {
      // Validate required fields
      if (dialogMode === 'create' && !currentRecord.patient) {
        alert('Please select a patient.');
        return;
      }

      if (!currentRecord.diagnosis.trim()) {
        alert('Please enter a diagnosis.');
        return;
      }

      if (dialogMode === 'create') {
        const response = await healthRecordsService.create(currentRecord);
        const newRecord = response.data;
        setRecords([...records, newRecord]);
      } else {
        const response = await healthRecordsService.update(currentRecord.id, currentRecord);
        const updatedRecord = response.data;
        setRecords(records.map(r => r.id === updatedRecord.id ? updatedRecord : r));
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving health record:', error);
      if (error.response && error.response.data) {
        const errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
        alert(`Error saving record: ${errorMessage}`);
      } else {
        alert('An error occurred while saving the record.');
      }
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await healthRecordsService.delete(id);
        setRecords(records.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting health record:', error);
        alert('An error occurred while deleting the record.');
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentRecord({ ...currentRecord, [name]: value });
  };

  const handlePatientChange = (event, newValue) => {
    setCurrentRecord({ 
      ...currentRecord, 
      patient: newValue ? newValue.id : null 
    });
  };

  const handleVitalSignChange = (e) => {
    const { name, value } = e.target;
    setCurrentRecord({
      ...currentRecord,
      vital_signs: {
        ...(currentRecord.vital_signs || {}),
        [name]: value
      }
    });
  };

  // Filter records based on search term and selected date
  const filteredRecords = records.filter(record => {
    const searchMatch = 
      (record.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.patient_usc_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateMatch = selectedDate ? record.visit_date === dayjs(selectedDate).format('YYYY-MM-DD') : true;
    
    // Filter based on tab selection (0: All, 1: Analytics)
    const typeMatch = tabValue === 0 || tabValue === 1; // Both tabs show all records
    
    return searchMatch && dateMatch && typeMatch;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Health Records
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.filter(r => r.record_type === 'MEDICAL').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Medical Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.filter(r => r.record_type === 'DENTAL').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dental Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.filter(r => dayjs(r.visit_date).isAfter(dayjs().subtract(30, 'day'))).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 30 Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Integration Quick Actions */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions & Integration
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<TimelineIcon />}
              onClick={() => window.open('/medical-records', '_blank')}
              size="small"
              sx={{ 
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5a6fd8',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                }
              }}
            >
              View Medical History
            </Button>
            <Button
              variant="outlined"
              startIcon={<HealingIcon />}
              onClick={() => window.open('/dental-records', '_blank')}
              size="small"
              sx={{ 
                borderColor: '#764ba2',
                color: '#764ba2',
                '&:hover': {
                  borderColor: '#6a4190',
                  backgroundColor: 'rgba(118, 75, 162, 0.1)',
                }
              }}
            >
              Manage Dental Records
            </Button>
            <Button
              variant="outlined"
              startIcon={<CertificateIcon />}
              onClick={() => window.open('/medical-certificates', '_blank')}
              size="small"
            >
              Medical Certificates
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={() => window.open('/reports', '_blank')}
              size="small"
            >
              Generate Reports
            </Button>
            <Button
              variant="outlined"
              startIcon={<LaunchIcon />}
              onClick={() => window.open('/patient-dashboard', '_blank')}
              size="small"
            >
              Patient Dashboard
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Filters and actions */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
          sx={{ flexGrow: 1, maxWidth: 300 }}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Filter by Date"
            value={selectedDate}
            onChange={setSelectedDate}
            slotProps={{ textField: { size: 'small' } }}
            sx={{ width: 200 }}
          />
        </LocalizationProvider>

        {canEditRecords && (
          <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={() => handleGenerateReport()}
              sx={{ 
                borderColor: '#f093fb',
                color: '#f093fb',
                '&:hover': {
                  borderColor: '#e070f0',
                  backgroundColor: 'rgba(240, 147, 251, 0.1)',
                }
              }}
            >
              Generate Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<TemplateIcon />}
              onClick={() => setOpenTemplateDialog(true)}
              sx={{ 
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5a6fd8',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                }
              }}
            >
              Use Template
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{ 
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                }
              }}
            >
              New Clinical Record
            </Button>
          </Box>
        )}
      </Box>

      {/* Tabs for record types */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="clinical record tabs">
          <Tab label="All Clinical Records" id="clinical-record-tab-0" />
          <Tab label="Analytics" id="clinical-record-tab-1" icon={<ReportIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Records Table or Analytics */}
      {loading ? (
        <Typography>Loading records...</Typography>
      ) : tabValue === 1 ? (
        <Box sx={{ mt: 2 }}>
          <ClinicalAnalytics records={records} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>ID Number</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Treatment</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.visit_date}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {record.patient_name || `Patient ID: ${record.patient}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.patient_usc_id || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.record_type || 'MEDICAL'} 
                        color={record.record_type === 'MEDICAL' ? 'primary' : 'secondary'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{record.diagnosis || 'No diagnosis'}</TableCell>
                    <TableCell>{record.treatment || 'No treatment'}</TableCell>
                    <TableCell align="right">
                      {/* Workflow Automation Suggestions */}
                      {canEditRecords && (() => {
                        const suggestions = getFollowUpSuggestions(record);
                        return suggestions.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                            {suggestions.map((suggestion, index) => (
                              <Chip
                                key={index}
                                label={suggestion.action}
                                size="small"
                                color={suggestion.type === 'follow-up' ? 'primary' : 
                                       suggestion.type === 'certificate' ? 'secondary' : 'default'}
                                onClick={() => handleAutomationAction(suggestion.action, record)}
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 20,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.8
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        );
                      })()}
                      
                      {/* Regular Action Buttons */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {record.record_type === 'MEDICAL' && (
                          <Button size="small" onClick={() => { setSelectedMedicalRecordId(record.id); setOpenMedicalRecordModal(true); }}>
                            View
                          </Button>
                        )}
                        <IconButton onClick={() => handleOpenEditDialog(record)} disabled={!canEditRecords}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteRecord(record.id)} disabled={!canEditRecords}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create Clinical Record' : 'Edit Clinical Record'}
        </DialogTitle>
        <DialogContent dividers>
          {currentRecord && (
            <Grid container spacing={2}>
              {dialogMode === 'create' && (
                <Grid item xs={12}>
                  <Autocomplete
                    options={patients}
                    getOptionLabel={(option) => {
                      const name = `${option.first_name} ${option.last_name}`;
                      const id = option.usc_id || option.id_number || option.student_id;
                      return `${name}${id ? ` (${id})` : ''}`;
                    }}
                    value={patients.find(p => p.id === currentRecord.patient) || null}
                    onChange={handlePatientChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Patient"
                        required
                        margin="normal"
                        helperText="Search by name or USC ID"
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                          {option.first_name?.[0]}{option.last_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {option.first_name} {option.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            USC ID: {option.usc_id || option.id_number || option.student_id || 'Not Available'}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option => {
                        const name = `${option.first_name || ''} ${option.last_name || ''}`.toLowerCase();
                        const email = (option.email || '').toLowerCase();
                        const uscId = (option.usc_id || option.id_number || option.student_id || '').toLowerCase();
                        const search = inputValue.toLowerCase();
                        return name.includes(search) || email.includes(search) || uscId.includes(search);
                      });
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                  />
                </Grid>
              )}
              {dialogMode === 'edit' && currentRecord.patient && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Patient"
                    value={`${currentRecord.patient.first_name || ''} ${currentRecord.patient.last_name || ''} ${(currentRecord.patient.usc_id || currentRecord.patient.id_number || currentRecord.patient.student_id) ? `(${currentRecord.patient.usc_id || currentRecord.patient.id_number || currentRecord.patient.student_id})` : ''}`}
                    disabled
                    margin="normal"
                    helperText="Patient cannot be changed when editing records"
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Visit Date"
                    value={dayjs(currentRecord.visit_date)}
                    onChange={(date) => setCurrentRecord({
                      ...currentRecord,
                      visit_date: dayjs(date).format('YYYY-MM-DD')
                    })}
                    slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Record Type</InputLabel>
                  <Select
                    name="record_type"
                    value={currentRecord.record_type}
                    onChange={handleInputChange}
                    label="Record Type"
                  >
                    <MenuItem value="MEDICAL">Medical</MenuItem>
                    <MenuItem value="DENTAL">Dental</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chief Complaint"
                  name="chief_complaint"
                  value={currentRecord.chief_complaint}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Diagnosis"
                  name="diagnosis"
                  value={currentRecord.diagnosis}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Treatment"
                  name="treatment"
                  value={currentRecord.treatment}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Vital Signs
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Temperature (°C)"
                  name="temperature"
                  value={currentRecord.vital_signs?.temperature || ''}
                  onChange={handleVitalSignChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Blood Pressure (mmHg)"
                  name="blood_pressure"
                  value={currentRecord.vital_signs?.blood_pressure || ''}
                  onChange={handleVitalSignChange}
                  margin="normal"
                  placeholder="e.g. 120/80"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Heart Rate (bpm)"
                  name="heart_rate"
                  value={currentRecord.vital_signs?.heart_rate || ''}
                  onChange={handleVitalSignChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Respiratory Rate (breaths/min)"
                  name="respiratory_rate"
                  value={currentRecord.vital_signs?.respiratory_rate || ''}
                  onChange={handleVitalSignChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Oxygen Saturation (%)"
                  name="oxygen_saturation"
                  value={currentRecord.vital_signs?.oxygen_saturation || ''}
                  onChange={handleVitalSignChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={currentRecord.notes}
                  onChange={handleInputChange}
                  margin="normal"
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveRecord} 
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Medical Record View Modal */}
      <Dialog open={openMedicalRecordModal} onClose={() => setOpenMedicalRecordModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Medical Record</DialogTitle>
        <DialogContent dividers>
          <MedicalRecord medicalRecordId={selectedMedicalRecordId} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMedicalRecordModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Clinical Templates Dialog */}
      <Dialog open={openTemplateDialog} onClose={handleCloseTemplateDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TemplateIcon sx={{ color: '#667eea' }} />
            Clinical Record Templates
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a template to quickly create a clinical record with pre-filled information.
          </Typography>
          <Grid container spacing={2}>
            {clinicalTemplates.map((template, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.3s ease',
                    border: `2px solid ${template.category === 'DENTAL' ? '#f093fb20' : '#667eea20'}`,
                    '&:hover': { 
                      boxShadow: 6, 
                      transform: 'translateY(-2px)',
                      borderColor: template.category === 'DENTAL' ? '#f093fb' : '#667eea'
                    } 
                  }}
                  onClick={() => handleUseTemplate(template)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {template.name}
                      </Typography>
                      <Chip 
                        label={template.category} 
                        color={template.category === 'DENTAL' ? 'secondary' : 'primary'} 
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Chief Complaint:</strong> {template.chief_complaint}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Diagnosis:</strong> {template.diagnosis}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Treatment:</strong> {template.treatment.substring(0, 60)}...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HealthRecords; 