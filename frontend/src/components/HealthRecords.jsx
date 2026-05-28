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
  FormHelperText,
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
  Autocomplete,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
  TablePagination
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import InfoTooltip from './utils/InfoTooltip';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  GetApp as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  InsertDriveFile as CsvIcon,
  Print as PrintIcon,
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
  Launch as LaunchIcon,
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Attachment as AttachmentIcon,
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import dayjs from 'dayjs';
import { healthRecordsService, patientService, patientDocumentService } from '../services/api';
import { reportService } from '../services/reportService';
import ReportTemplate from './utils/ReportTemplate';
import MedicalRecord from './MedicalRecord';
import ClinicalAnalytics from './ClinicalAnalytics';
import PatientDocumentUpload from './PatientDocumentUpload';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [records, setRecords] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedPatientForUpload, setSelectedPatientForUpload] = useState(null);
  const user = useSelector(selectCurrentUser);
  const [selectedMedicalRecordId, setSelectedMedicalRecordId] = useState(null);
  const [openMedicalRecordModal, setOpenMedicalRecordModal] = useState(false);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenUpload = (record) => {
    setCurrentRecord(record); // Track the record being uploaded to
    setSelectedPatientForUpload({
      id: record.patient,
      name: record.patient_name
    });
    setOpenUploadDialog(true);
  };

  // Only ADMIN, DOCTOR, and NURSE have CRUD for Medical records. DENTIST and STAFF are view-only.
  const canEditRecords = user?.role && ['ADMIN', 'DOCTOR', 'NURSE'].includes(user.role);

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
    
  ];

  useEffect(() => {
    fetchHealthRecords();
    
    // Only privileged roles should fetch the global patient list
    const isPrivileged = user && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'].includes(user.role);
    if (isPrivileged) {
      fetchPatients();
    }
    
    fetchDocuments();
  }, [user]);

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

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const response = await patientDocumentService.getAllDocuments();
      // Handle both direct array and paginated response
      const data = response.data?.results || response.data || [];
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
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
      visit_date: dayjs().format(),
      record_type: 'MEDICAL',
      chief_complaint: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      vital_signs: {
        temperature: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: ''
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
      visit_date: dayjs().format(),
      record_type: 'MEDICAL',
      chief_complaint: template.chief_complaint,
      diagnosis: template.diagnosis,
      treatment: template.treatment,
      notes: template.notes,
      vital_signs: {
        temperature: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: ''
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
        message: 'Consider a follow-up visit in 2-4 weeks',
        action: 'Recommend Follow-up'
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
      case 'Recommend Follow-up':
        // Auto-create a follow-up record template
        setDialogMode('create');
        setCurrentRecord({
          patient: record.patient,
          visit_date: dayjs().add(2, 'week').format(),
          record_type: record.record_type,
          chief_complaint: `Follow-up for: ${record.diagnosis}`,
          diagnosis: '',
          treatment: '',
          notes: `Follow-up visit for previous diagnosis: ${record.diagnosis}`,
          vital_signs: {
            temperature: '',
            blood_pressure: '',
            heart_rate: '',
            respiratory_rate: ''
          },
          medications: []
        });
        setOpenDialog(true);
        break;
      case 'Generate Certificate':
        const patientId = record.patient?.id || record.patient;
        const queryParams = new URLSearchParams({
          action: 'create',
          patientId: patientId || '',
          diagnosis: record.diagnosis || '',
          recommendations: record.treatment || ''
        }).toString();
        window.open(`/medical-certificates?${queryParams}`, '_blank');
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
      medicalRecords: records.length,
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
    const uniquePatients = [...new Set(records.map(r => 
      (r.patient && typeof r.patient === 'object') ? r.patient.id : r.patient
    ).filter(Boolean))];
    
    return {
      totalPatients: uniquePatients.length,
      avgRecordsPerPatient: uniquePatients.length > 0 ? (records.length / uniquePatients.length).toFixed(1) : 0,
      patientsThisMonth: records.filter(r => 
        dayjs(r.visit_date).isAfter(dayjs().startOf('month'))
      ).map(r => (r.patient && typeof r.patient === 'object') ? r.patient.id : r.patient)
       .filter(Boolean)
       .filter((id, index, arr) => arr.indexOf(id) === index).length
    };
  };

  const downloadClinicalReport = (data) => {
    const reportContent = `
CLINICAL RECORDS REPORT
Generated: ${data.generatedAt}

=== SUMMARY STATISTICS ===
Total Records: ${data.totalRecords}
Medical Records: ${data.medicalRecords}
Records (Last 30 Days): ${data.recentRecords}

=== PATIENT STATISTICS ===
Total Patients: ${data.patientStats.totalPatients}
Average Records per Patient: ${data.patientStats.avgRecordsPerPatient}
New Patients This Month: ${data.patientStats.patientsThisMonth}

=== COMMON DIAGNOSES ===
${data.commonDiagnoses.map(d => `${d.diagnosis}: ${d.count} cases`).join('\n')}

=== DETAILED RECORDS ===
${filteredRecords.map(r => `
Date: ${dayjs(r.visit_date).format('MMM DD, YYYY hh:mm A')}
Patient: ${r.patient_name || `Patient ID: ${r.patient}`}
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
        await healthRecordsService.create(currentRecord);
      } else {
        await healthRecordsService.update(currentRecord.id, currentRecord);
      }
      // Refresh list from server for authoritative state
      await fetchHealthRecords();
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

  // Filter records based on search term and date range
  const filteredRecords = records.filter(record => {
    const searchMatch = 
      (record.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.patient_usc_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date Range Match
    let dateMatch = true;
    if (startDate) {
      dateMatch = dateMatch && dayjs(record.visit_date).isAfter(dayjs(startDate).subtract(1, 'day'));
    }
    if (endDate) {
      dateMatch = dateMatch && dayjs(record.visit_date).isBefore(dayjs(endDate).add(1, 'day'));
    }
    
    // Medical-only page; no type filtering needed
    return searchMatch && dateMatch;
  });

  const paginatedRecords = filteredRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
  };

  // Enhanced Export Functions
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No health records to export');
      return;
    }

    const data = reportService.prepareDataForExport(filteredRecords, 'MEDICAL');
    reportService.exportToCSV(data, `medical-health-records-${dayjs().format('YYYY-MM-DD-HHmm')}.csv`);
  };

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert('No health records to export');
      return;
    }

    const data = reportService.prepareDataForExport(filteredRecords, 'MEDICAL');
    reportService.exportToExcel(data, `medical-health-records-${dayjs().format('YYYY-MM-DD-HHmm')}.xls`);
  };

  const handlePrintReport = async () => {
    if (filteredRecords.length === 0) {
      alert('No health records to print');
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Medical Records
        </Typography>
        <InfoTooltip title="Search, filter, and manage clinical records. Use tabs for analytics and actions for exports." />
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.length}
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
              onClick={() => window.open('/health-insights', '_blank')}
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
              Health Insights & History
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

              {/* Export Actions */}
            <Box sx={{ ml: { xs: 0, sm: 'auto' }, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Button
                variant="outlined"
                startIcon={<CsvIcon />}
                onClick={handleExportCSV}
                disabled={filteredRecords.length === 0}
                size="small"
                sx={{ borderColor: '#2e7d32', color: '#2e7d32', '&:hover': { borderColor: '#1b5e20', bgcolor: '#f1f8e9' } }}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={handleExportExcel}
                disabled={filteredRecords.length === 0}
                size="small"
                sx={{ borderColor: '#0d7c34', color: '#0d7c34', '&:hover': { borderColor: '#0d7c34', bgcolor: '#f0f9f0' } }}
              >
                Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintReport}
                disabled={filteredRecords.length === 0}
                size="small"
                sx={{ borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { borderColor: '#d32f2f', bgcolor: '#fff0f0' } }}
              >
                Print
              </Button>
            </Box>
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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
            <DatePicker
              label="From Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ 
                textField: { 
                  size: 'small',
                  InputLabelProps: { shrink: true }
                } 
              }}
              sx={{ width: { xs: '100%', sm: 170 } }}
              maxDate={endDate || dayjs()}
            />
            <DatePicker
              label="To Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ 
                textField: { 
                  size: 'small',
                  InputLabelProps: { shrink: true }
                } 
              }}
              sx={{ width: { xs: '100%', sm: 170 } }}
              minDate={startDate}
              maxDate={dayjs()}
            />
          </Box>
        </LocalizationProvider>

        {(searchTerm || startDate || endDate) && (
          <Button 
            variant="text" 
            onClick={clearFilters}
            size="small"
            sx={{ ml: 1 }}
          >
            Clear
          </Button>
        )}

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
            </Button>          </Box>
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
        <Box sx={{ mt: 2 }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Date</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Patient</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>ID Number</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 200 }}>Concern</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 200 }}>Diagnosis</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 200 }}>Treatment</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
              <TableBody>
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(record.visit_date).format('MMM DD, YYYY hh:mm A')}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {record.patient_name || `Patient ID: ${record.patient}`}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" color="text.secondary">
                          {record.patient_usc_id || 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell sx={{ minWidth: 200 }}>{record.concern || 'N/A'}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{record.diagnosis || 'No diagnosis'}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{record.treatment || 'No treatment'}</TableCell>
                      <TableCell align="right">
                        {/* Workflow Automation Suggestions */}
                        {canEditRecords && (() => {
                          const suggestions = getFollowUpSuggestions(record);
                          return suggestions.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, alignItems: 'center' }}>
                              <Tooltip title="Appears when diagnosis contains 'sick' or treatment includes 'rest'">
                                <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                              </Tooltip>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          <Tooltip title="Upload Scanned Document">
                            <IconButton onClick={() => handleOpenUpload(record)} disabled={!canEditRecords}>
                              <UploadIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Button size="small" onClick={() => { setSelectedMedicalRecordId(record.id); setOpenMedicalRecordModal(true); }}>
                            View
                          </Button>
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
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredRecords.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          color: 'white'
        }}>
          {dialogMode === 'create' ? 'Create New Clinical Record' : 'Edit Clinical Record'}
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f8f9fa' }}>
          <MedicalRecord 
            medicalRecordId={currentRecord?.id} 
            readOnly={false} 
            onSuccess={() => {
              fetchHealthRecords();
              handleCloseDialog();
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
          <Button onClick={handleCloseDialog} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Medical Record View Modal */}
      <Dialog open={openMedicalRecordModal} onClose={() => setOpenMedicalRecordModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #11998e 30%, #38ef7d 90%)',
          color: 'white'
        }}>
          Medical Record Details
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f8f9fa' }}>
          <MedicalRecord medicalRecordId={selectedMedicalRecordId} readOnly={true} />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
          <Button onClick={() => setOpenMedicalRecordModal(false)} variant="contained" color="success">Close</Button>
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

      {/* Document Upload Dialog */}
      {selectedPatientForUpload && (
        <PatientDocumentUpload
          open={openUploadDialog}
          onClose={() => {
            setOpenUploadDialog(false);
            setCurrentRecord(null);
          }}
          patientId={selectedPatientForUpload.id}
          patientName={selectedPatientForUpload.name}
          medicalRecordId={currentRecord?.id}
          onUploadSuccess={() => {
            // Success alert or refresh if needed
            console.log('Document uploaded successfully');
            fetchDocuments();
          }}
        />
      )}

      {/* Export Template (Hidden) */}
      <ReportTemplate 
        data={filteredRecords} 
        title="COMPREHENSIVE MEDICAL RECORDS REPORT" 
        reportType="MEDICAL"
      />
    </Box>
  );
};

export default HealthRecords; 
