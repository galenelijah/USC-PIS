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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  LinearProgress,
  TablePagination,
  MenuItem
} from '@mui/material';
import InfoTooltip from './utils/InfoTooltip';
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
  Download as DownloadIcon,
  GetApp as ExportIcon,
  Favorite as VitalIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Assignment as CertificateIcon,
  Feedback as FeedbackIcon,
  Warning as WarningIcon,
  DateRange as DateRangeIcon,
  Clear as ClearIcon,
  AttachFile as AttachmentIcon,
  FileOpen as FileIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { reportService } from '../services/reportService';
import ReportTemplate from './utils/ReportTemplate';

import { Autocomplete } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { 
  healthRecordsService, 
  patientService, 
  patientDocumentService 
} from '../services/api';
import { dentalRecordService } from '../services/api';
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
  const [documents, setDocuments] = useState([]); // New state for raw documents
  const [medicalMap, setMedicalMap] = useState({});
  const [dentalMap, setDentalMap] = useState({});
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const handleDownloadDocument = async (doc) => {
    try {
      const response = await patientDocumentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = doc.original_filename || `document_${doc.id}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await patientDocumentService.deleteDocument(docId);
      // Refresh data
      fetchRecords();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedRecordType, setSelectedRecordType] = useState('ALL');
  
  // Document Archive Filter States
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [docRecordType, setDocRecordType] = useState('ALL');
  const [docStartDate, setDocStartDate] = useState(null);
  const [docEndDate, setDocEndDate] = useState(null);

  // Health Insights Filter States
  const [insightsSearchTerm, setInsightsSearchTerm] = useState('');
  const [insightsRecordType, setInsightsRecordType] = useState('ALL');
  const [insightsStartDate, setInsightsStartDate] = useState(null);
  const [insightsEndDate, setInsightsEndDate] = useState(null);
  
  const [tabValue, setTabValue] = useState(0);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filteredInsightsRecords, setFilteredInsightsRecords] = useState([]);
  const [showAllergyAlert, setShowAllergyAlert] = useState(false);
  
  // Pagination state
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  const [docsPage, setDocsPage] = useState(0);
  const [docsRowsPerPage, setDocsRowsPerPage] = useState(10);

  const handleHistoryChangePage = (event, newPage) => {
    setHistoryPage(newPage);
  };

  const handleHistoryChangeRowsPerPage = (event) => {
    setHistoryRowsPerPage(parseInt(event.target.value, 10));
    setHistoryPage(0);
  };

  const handleDocsChangePage = (event, newPage) => {
    setDocsPage(newPage);
  };

  const handleDocsChangeRowsPerPage = (event) => {
    setDocsRowsPerPage(parseInt(event.target.value, 10));
    setDocsPage(0);
  };

  const user = useSelector(state => state.auth.user);
  const isStaffOrMedical = user?.role && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'].includes(user.role);
  const isStudent = ['STUDENT', 'FACULTY'].includes(user?.role);

  useEffect(() => {
    fetchRecords();
    if (isStaffOrMedical) {
      fetchPatients();
    }
  }, []);

  useEffect(() => {
    filterHistoryRecords();
  }, [searchTerm, records, selectedPatient, startDate, endDate, selectedRecordType]);

  useEffect(() => {
    filterDocRecords();
  }, [docSearchTerm, documents, selectedPatient, docStartDate, docEndDate, docRecordType]);

  useEffect(() => {
    filterInsightsRecords();
  }, [insightsSearchTerm, records, selectedPatient, insightsStartDate, insightsEndDate, insightsRecordType]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch medical, dental, and document data
      const [medResp, dentResp, docResp] = await Promise.all([
        healthRecordsService.getAll().catch(err => {
          console.error('Error fetching medical records:', err);
          return { data: [] };
        }),
        dentalRecordService.getAll().catch(err => {
          console.error('Error fetching dental records:', err);
          return { data: [] };
        }),
        patientDocumentService.getAllDocuments().catch(err => {
          console.error('Error fetching documents:', err);
          return { data: [] };
        })
      ]);

      // Ensure data is an array before mapping (handle paginated responses)
      const getResults = (resp) => {
        const data = resp?.data?.results || resp?.data || [];
        return Array.isArray(data) ? data : [];
      };

      const medData = getResults(medResp);
      const dentData = getResults(dentResp);
      const docData = getResults(docResp);

      // Create maps for quick lookup to group attachments
      const medMap = {};
      const dentMap = {};

      const medical = medData.map(r => {
        const record = {
          ...r,
          record_type: 'MEDICAL',
          composite_id: `MEDICAL-${r.id}`,
          attachments: []
        };
        medMap[r.id] = record;
        return record;
      });

      const dental = dentData.map(r => {
        const record = {
          ...r,
          record_type: 'DENTAL',
          composite_id: `DENTAL-${r.id}`,
          treatment: r.treatment_performed || r.treatment_plan,
          notes: r.clinical_notes,
          procedure_performed: r.procedure_performed_display || r.procedure_performed,
          attachments: []
        };
        dentMap[r.id] = record;
        return record;
      });

      const standaloneAttachments = [];

      docData.forEach(d => {
        const attachment = {
          ...d,
          record_type: 'ATTACHMENT',
          composite_id: `DOC-${d.id}`,
          visit_date: d.uploaded_at, // Use upload date as the event date
          diagnosis: d.document_type_display,
          treatment: d.description || 'No description provided',
          patient_name: d.patient_name
        };

        // Group with records if linked
        if (d.medical_record && medMap[d.medical_record]) {
          medMap[d.medical_record].attachments.push(attachment);
        } else if (d.dental_record && dentMap[d.dental_record]) {
          dentMap[d.dental_record].attachments.push(attachment);
        } else {
          standaloneAttachments.push(attachment);
        }
      });

      // Unified history only shows actual clinical records (medical/dental)
      // Standalone files are now only visible in the Document Archive tab
      let combined = [...medical, ...dental];
      
      // Sort by visit_date (primary) and created_at (secondary) to ensure consistent chronological order
      combined = combined.sort((a, b) => {
        const dateA = new Date(a.visit_date);
        const dateB = new Date(b.visit_date);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB - dateA; // Newest first
        }
        
        // Tie-breaker: creation time
        const createA = new Date(a.created_at);
        const createB = new Date(b.created_at);
        return createB - createA;
      });

      setRecords(combined);
      setDocuments(docData);
      setMedicalMap(medMap);
      setDentalMap(dentMap);
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

  const filterHistoryRecords = () => {
    // Reset page when filters change
    setHistoryPage(0);

    let filtered = records;

    // Filter by record type
    if (selectedRecordType !== 'ALL') {
      filtered = filtered.filter(record => record.record_type === selectedRecordType);
    }

    // Filter by selected patient (for staff/medical)
    if (selectedPatient) {
      filtered = filtered.filter(record => {
        const patientId = record.patient?.id || record.patient;
        return String(patientId) === String(selectedPatient.id);
      });
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const matchesRecord = (record.patient_name || '').toLowerCase().includes(lowerSearch) ||
          (record.diagnosis || '').toLowerCase().includes(lowerSearch) ||
          (record.treatment || '').toLowerCase().includes(lowerSearch) ||
          (record.chief_complaint || '').toLowerCase().includes(lowerSearch) ||
          (record.medications || '').toLowerCase().includes(lowerSearch) ||
          (record.procedure_performed || '').toLowerCase().includes(lowerSearch) ||
          (record.notes || '').toLowerCase().includes(lowerSearch);
        
        // Also search in attachments if they exist
        const matchesAttachments = record.attachments?.some(att => 
          (att.original_filename || '').toLowerCase().includes(lowerSearch) ||
          (att.description || '').toLowerCase().includes(lowerSearch) ||
          (att.document_type_display || '').toLowerCase().includes(lowerSearch)
        );

        return matchesRecord || matchesAttachments;
      });
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

    // Sort by date (newest first)
    filtered = [...filtered].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

    setFilteredRecords(filtered);
  };

  const filterDocRecords = () => {
    // Reset page when filters change
    setDocsPage(0);

    let filteredDocs = Array.isArray(documents) ? documents : [];
    
    // Filter by record type
    if (docRecordType !== 'ALL') {
      filteredDocs = filteredDocs.filter(doc => {
        if (docRecordType === 'MEDICAL') return !!doc.medical_record;
        if (docRecordType === 'DENTAL') return !!doc.dental_record;
        return true;
      });
    }

    if (selectedPatient) {
      filteredDocs = filteredDocs.filter(doc => {
        const patientId = doc.patient?.id || doc.patient;
        return String(patientId) === String(selectedPatient.id);
      });
    }

    if (docSearchTerm.trim() !== '') {
      const lowerSearch = docSearchTerm.toLowerCase();
      filteredDocs = filteredDocs.filter(doc => 
        (doc.patient_name || '').toLowerCase().includes(lowerSearch) ||
        (doc.document_type_display || '').toLowerCase().includes(lowerSearch) ||
        (doc.description || '').toLowerCase().includes(lowerSearch) ||
        (doc.original_filename || '').toLowerCase().includes(lowerSearch)
      );
    }

    if (docStartDate) {
      filteredDocs = filteredDocs.filter(doc => 
        dayjs(doc.uploaded_at).isAfter(dayjs(docStartDate).subtract(1, 'day'))
      );
    }
    if (docEndDate) {
      filteredDocs = filteredDocs.filter(doc => 
        dayjs(doc.uploaded_at).isBefore(dayjs(docEndDate).add(1, 'day'))
      );
    }

    setFilteredDocuments(filteredDocs);
  };

  const filterInsightsRecords = () => {
    let filtered = records;

    // Filter by record type
    if (insightsRecordType !== 'ALL') {
      filtered = filtered.filter(record => record.record_type === insightsRecordType);
    }

    // Filter by selected patient (for staff/medical)
    if (selectedPatient) {
      filtered = filtered.filter(record => {
        const patientId = record.patient?.id || record.patient;
        return String(patientId) === String(selectedPatient.id);
      });
    }

    // Filter by search term
    if (insightsSearchTerm.trim() !== '') {
      const lowerSearch = insightsSearchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        return (record.patient_name || '').toLowerCase().includes(lowerSearch) ||
          (record.diagnosis || '').toLowerCase().includes(lowerSearch) ||
          (record.treatment || '').toLowerCase().includes(lowerSearch) ||
          (record.chief_complaint || '').toLowerCase().includes(lowerSearch) ||
          (record.medications || '').toLowerCase().includes(lowerSearch) ||
          (record.procedure_performed || '').toLowerCase().includes(lowerSearch) ||
          (record.notes || '').toLowerCase().includes(lowerSearch);
      });
    }

    // Filter by date range
    if (insightsStartDate) {
      filtered = filtered.filter(record => 
        dayjs(record.visit_date).isAfter(dayjs(insightsStartDate).subtract(1, 'day'))
      );
    }
    if (insightsEndDate) {
      filtered = filtered.filter(record => 
        dayjs(record.visit_date).isBefore(dayjs(insightsEndDate).add(1, 'day'))
      );
    }

    // Sort by date (newest first)
    filtered = [...filtered].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

    setFilteredInsightsRecords(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = dayjs(dateString);
      return {
        formatted: date.format('MMM DD, YYYY hh:mm A'),
        relative: date.fromNow()
      };
    } catch {
      return { formatted: dateString, relative: '' };
    }
  };

  const getRecordIcon = (recordType) => {
    switch (recordType) {
      case 'DENTAL': return <DentalIcon />;
      default: return <MedicalIcon />;
    }
  };

  const getRecordColor = (recordType) => {
    switch (recordType) {
      case 'DENTAL': return '#7c3aed';
      default: return '#1976d2';
    }
  };
  const handleExpandRecord = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  // Export functionality
  const handleExportRecords = () => {
    if (filteredRecords.length === 0) return;

    const exportData = filteredRecords.map(record => ({
      'Date': formatDate(record.visit_date).formatted,
      'Patient': record.patient_name || `ID: ${record.patient}`,
      'Type': record.record_type || 'MEDICAL',
      'Diagnosis': record.diagnosis || 'N/A',
      'Treatment/Plan': record.treatment || record.treatment_performed || 'N/A',
      'Chief Complaint': record.chief_complaint || record.concern || 'N/A',
      'Medications': record.medications || 'N/A',
      'Vital Signs': record.record_type === 'MEDICAL' ? 
        `BP: ${record.vital_signs?.blood_pressure || 'N/A'}, Temp: ${record.vital_signs?.temperature || 'N/A'}°C` : 'N/A',
      'Dental Info': record.record_type === 'DENTAL' ? 
        `Proc: ${record.procedure_performed}, Tooth: ${record.tooth_numbers || 'N/A'}` : 'N/A',
      'Notes': record.notes || record.clinical_notes || 'N/A'
    }));

    reportService.exportToCSV(exportData, `unified-health-history-${dayjs().format('YYYY-MM-DD')}.csv`);
  };

  // Print functionality
  const handlePrintRecords = async () => {
    const element = document.getElementById('professional-report-template');
    if (!element) return;
    
    setLoading(true);
    try {
      const filename = selectedPatient 
        ? `clinical-report-${selectedPatient.last_name}-${dayjs().format('YYYY-MM-DD')}.pdf`
        : `clinical-report-${dayjs().format('YYYY-MM-DD')}.pdf`;
        
      await reportService.generatePDF(element, filename);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate professional PDF report.');
    } finally {
      setLoading(false);
    }
  };

  // Date filter helpers
  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // Check for allergies in selected patient's records
  const checkForAllergies = () => {
    if (!selectedPatient || !records.length) return [];
    
    const allergies = [];
    records.forEach(record => {
      // Ensure we only check records for the selected patient
      const patientId = record.patient?.id || record.patient;
      if (String(patientId) !== String(selectedPatient.id)) return;

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
    return (
      <Box>
        {/* Insights Specific Search and Filters */}
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Filter by Diagnosis"
                  variant="outlined"
                  size="small"
                  value={insightsSearchTerm}
                  onChange={(e) => setInsightsSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="e.g. Hypertension, Fever..."
                  helperText="Search for specific conditions"
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Data Source"
                  value={insightsRecordType}
                  onChange={(e) => setInsightsRecordType(e.target.value)}
                  variant="outlined"
                  size="small"
                  helperText="Record type origin"
                >
                  <MenuItem value="ALL">All Records</MenuItem>
                  <MenuItem value="MEDICAL">Medical Only</MenuItem>
                  <MenuItem value="DENTAL">Dental Only</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <DatePicker
                      label="From"
                      value={insightsStartDate}
                      onChange={setInsightsStartDate}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      disableFuture
                    />
                    <DatePicker
                      label="To"
                      value={insightsEndDate}
                      onChange={setInsightsEndDate}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      disableFuture
                    />
                    {(insightsStartDate || insightsEndDate) && (
                      <IconButton onClick={() => { setInsightsStartDate(null); setInsightsEndDate(null); }} size="small">
                        <ClearIcon />
                      </IconButton>
                    )}
                  </Box>
                </LocalizationProvider>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Date range for insights
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {filteredInsightsRecords.length} Records Found
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Based on your diagnosis filter
                  </Typography>
                </Box>
              </Grid>
              </Grid>

              {/* Active Insights Filters Display */}
              {(insightsSearchTerm || insightsStartDate || insightsEndDate || insightsRecordType !== 'ALL') && (
              <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Active Insight Filters:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {insightsSearchTerm && (
                    <Chip 
                      label={`Diagnosis: "${insightsSearchTerm}"`} 
                      onDelete={() => setInsightsSearchTerm('')} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  )}
                  {insightsRecordType !== 'ALL' && (
                    <Chip 
                      label={`Source: ${insightsRecordType}`} 
                      onDelete={() => setInsightsRecordType('ALL')} 
                      size="small" 
                      color="info" 
                      variant="outlined" 
                    />
                  )}
                  {insightsStartDate && (
                    <Chip 
                      label={`From: ${dayjs(insightsStartDate).format('MMM DD, YYYY')}`} 
                      onDelete={() => setInsightsStartDate(null)} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                  {insightsEndDate && (
                    <Chip 
                      label={`To: ${dayjs(insightsEndDate).format('MMM DD, YYYY')}`} 
                      onDelete={() => setInsightsEndDate(null)} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              </Box>
              )}
          </CardContent>
        </Card>

        {filteredInsightsRecords.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No health data available for the selected filters
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adjust your filters to see insights based on your medical history.
            </Typography>
          </Box>
        ) : (
          <>
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
                          secondary={`${generateHealthInsights(filteredInsightsRecords).totalVisits} medical records`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><MedicalIcon color="primary" /></ListItemIcon>
                        <ListItemText 
                          primary="Last Visit" 
                          secondary={generateHealthInsights(filteredInsightsRecords).lastVisit || 'No recent visits'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><TimelineIcon color="primary" /></ListItemIcon>
                        <ListItemText 
                          primary="Health Trend" 
                          secondary={generateHealthInsights(filteredInsightsRecords).trend}
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
                    {generateHealthInsights(filteredInsightsRecords).commonConditions.length > 0 ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Most frequently addressed conditions:
                        </Typography>
                        <Stack spacing={1}>
                          {generateHealthInsights(filteredInsightsRecords).commonConditions.map((condition, index) => (
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
                      {generateHealthInsights(filteredInsightsRecords).recommendations.map((rec, index) => (
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
                      {generateHealthInsights(filteredInsightsRecords).monthlyVisits.map((month, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">{month.month}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {month.visits} visit{month.visits !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(month.visits / Math.max(...generateHealthInsights(filteredInsightsRecords).monthlyVisits.map(m => m.visits))) * 100}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: 'rgba(25, 118, 210, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#1976d2',
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
          </>
        )}
      </Box>
    );
  };

  const generateHealthInsights = (data = []) => {
    const insights = {
      totalVisits: data.length,
      lastVisit: data.length > 0 ? formatDate(data[0].visit_date).formatted : null,
      trend: getTrend(data),
      commonConditions: getCommonConditions(data),
      recommendations: getRecommendations(data),
      monthlyVisits: getMonthlyVisits(data)
    };
    return insights;
  };

  const getTrend = (data = []) => {
    if (data.length < 2) return 'Insufficient data for trend analysis';
    
    const recentVisits = data.filter(r => 
      dayjs(r.visit_date).isAfter(dayjs().subtract(6, 'month'))
    ).length;
    
    const olderVisits = data.filter(r => 
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

  const getCommonConditions = (data = []) => {
    const conditions = {};
    data.forEach(record => {
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

  const getRecommendations = (data = []) => {
    const recommendations = [
      {
        type: 'info',
        title: 'Regular Check-ups',
        description: 'Schedule annual health check-ups to maintain optimal health and catch any issues early.'
      }
    ];

    // Add specific recommendations based on conditions
    const hasRecentVisits = data.some(r => 
      dayjs(r.visit_date).isAfter(dayjs().subtract(3, 'month'))
    );
    
    if (!hasRecentVisits) {
      recommendations.push({
        type: 'warning',
        title: 'Health Check Due',
        description: 'Consider scheduling a routine health check-up as it has been a while since your last visit.'
      });
    }

    const commonDiagnoses = getCommonConditions(data);
    if (commonDiagnoses.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Monitor Recurring Conditions',
        description: `Keep track of symptoms related to ${commonDiagnoses[0].condition} and follow your healthcare provider's advice.`
      });
    }

    if (data.length >= 5) {
      recommendations.push({
        type: 'success',
        title: 'Good Health Monitoring',
        description: 'You are actively monitoring your health. Keep up the good work with regular medical care.'
      });
    }

    return recommendations;
  };

  const getMonthlyVisits = (data = []) => {
    const months = {};
    data.forEach(record => {
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
                    <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
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

    const paginatedRecords = filteredRecords.slice(historyPage * historyRowsPerPage, historyPage * historyRowsPerPage + historyRowsPerPage);

    return (
      <Stack spacing={2}>
        {paginatedRecords.map((record) => (
          <Card 
            key={record.composite_id} 
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
              {/* Medical/Dental UI */}
              <>
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
                          label={record.vital_signs.has_alerts ? "Vitals (Alerts Found)" : "Vitals Recorded"} 
                          size="small" 
                          variant={record.vital_signs.has_alerts ? "filled" : "outlined"}
                          color={record.vital_signs.has_alerts ? "error" : "default"}
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
                      {record.attachments && record.attachments.length > 0 && (
                        <Chip 
                          icon={<AttachmentIcon />} 
                          label={`${record.attachments.length} File${record.attachments.length > 1 ? 's' : ''}`} 
                          size="small" 
                          variant="filled"
                          color="success"
                          sx={{ height: 24, fontSize: '0.75rem' }}
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
                      onClick={() => handleExpandRecord(record.composite_id)}
                      size="small"
                    >
                      {expandedRecord === record.composite_id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  {/* Grouped Attachments (Mini-View) */}
                  {record.attachments && record.attachments.length > 0 && (
                    <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #eee' }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mr: 1 }}>
                          ATTACHMENTS:
                        </Typography>
                        {record.attachments.map(att => (
                          <Chip
                            key={att.id}
                            label={att.original_filename}
                            size="small"
                            variant="outlined"
                            icon={<FileIcon style={{ fontSize: 14 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadDocument(att);
                            }}
                            sx={{ 
                              fontSize: '0.65rem', 
                              height: 20,
                              cursor: 'pointer',
                              maxWidth: 200,
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Collapse in={expandedRecord === record.composite_id}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      {record.record_type === 'DENTAL' && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="body2" fontWeight="medium" gutterBottom>
                              🦷 Dental Details
                            </Typography>
                          </Grid>
                          {record.procedure_performed && (
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" color="text.secondary">
                                Procedure: <strong>{record.procedure_performed}</strong>
                              </Typography>
                            </Grid>
                          )}
                          {record.affected_teeth_display && (
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" color="text.secondary">
                                Affected Teeth: <strong>{record.affected_teeth_display}</strong>
                              </Typography>
                            </Grid>
                          )}
                          {(record.pain_level !== undefined && record.pain_level !== null) && (
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" color="text.secondary">
                                Pain Level: <strong>{record.pain_level}</strong>
                              </Typography>
                            </Grid>
                          )}
                          {(record.cost !== undefined && record.cost !== null) && (
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" color="text.secondary">
                                Cost: <strong>{record.cost}</strong>
                              </Typography>
                            </Grid>
                          )}
                        </>
                      )}
                      {record.vital_signs && Object.values(record.vital_signs).some(v => v) && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            Vital Signs:
                          </Typography>
                          
                          {/* Automated Alerts Section */}
                          {record.vital_signs.has_alerts && (
                            <Box sx={{ mb: 2 }}>
                              {record.vital_signs.alerts.map((alert, idx) => (
                                <Alert 
                                  key={idx} 
                                  severity={alert.level === 'CRITICAL' ? 'error' : 'warning'}
                                  variant="filled"
                                  sx={{ py: 0, px: 1, mb: 0.5, fontSize: '0.75rem', '& .MuiAlert-icon': { fontSize: '1rem' } }}
                                >
                                  {alert.message}
                                </Alert>
                              ))}
                            </Box>
                          )}

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
                            {(record.vital_signs.heart_rate || record.vital_signs.pulse_rate) && (
                              <ListItem>
                                <ListItemText 
                                  primary="Heart Rate" 
                                  secondary={`${record.vital_signs.heart_rate || record.vital_signs.pulse_rate} bpm`} 
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
                            {record.vital_signs.bmi && (
                              <ListItem>
                                <ListItemText 
                                  primary="BMI" 
                                  secondary={record.vital_signs.bmi} 
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
                </>
            </CardContent>
          </Card>
        ))}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredRecords.length}
          rowsPerPage={historyRowsPerPage}
          page={historyPage}
          onPageChange={handleHistoryChangePage}
          onRowsPerPageChange={handleHistoryChangeRowsPerPage}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1,
            mt: 2
          }}
        />
      </Stack>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom color="primary">
            Health Insights & History
          </Typography>
          <InfoTooltip title="Explore patient history with a timeline and personalized health insights. Use filters and expand rows for details." />
        </Box>
        <Typography variant="body1" color="text.secondary">
          {isStaffOrMedical
            ? 'Browse a chronological health timeline with data-driven insights. View treatment progression, vitals trends, and comprehensive history.'
            : 'Explore your chronological health timeline. View data-driven insights, treatment trends, and your complete medical history at a glance.'}
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
                    <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="medical history tabs">
          <Tab label="Unified History" id="medical-history-tab-0" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Document Archive" id="medical-history-tab-1" icon={<AttachmentIcon />} iconPosition="start" />
          <Tab label="Health Insights" id="medical-history-tab-2" icon={<TimelineIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={tabValue} index={0}>
            {/* Tab-Specific Search and Filters */}
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  {/* Search Box */}
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Search history"
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
                      placeholder="Search records..."
                    />
                  </Grid>

                  {/* Record Type Filter */}
                  <Grid item xs={12} md={2}>
                    <TextField
                      select
                      fullWidth
                      label="Record Type"
                      value={selectedRecordType}
                      onChange={(e) => setSelectedRecordType(e.target.value)}
                      variant="outlined"
                      size="small"
                    >
                      <MenuItem value="ALL">All Records</MenuItem>
                      <MenuItem value="MEDICAL">Medical Only</MenuItem>
                      <MenuItem value="DENTAL">Dental Only</MenuItem>
                    </TextField>
                  </Grid>
                  
                  {/* Date Range Filters */}
                  <Grid item xs={12} md={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                        <DatePicker
                          label="From"
                          value={startDate}
                          onChange={setStartDate}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              InputLabelProps: { shrink: true }
                            }
                          }}
                          maxDate={endDate || dayjs()}
                          disableFuture
                        />
                        <DatePicker
                          label="To"
                          value={endDate}
                          onChange={setEndDate}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              InputLabelProps: { shrink: true }
                            }
                          }}
                          minDate={startDate}
                          maxDate={dayjs()}
                          disableFuture
                        />
                        {(startDate || endDate) && (
                          <IconButton onClick={() => { setStartDate(null); setEndDate(null); }} size="small" title="Clear dates">
                            <ClearIcon />
                          </IconButton>
                        )}
                      </Box>
                    </LocalizationProvider>
                  </Grid>
                  
                  {/* Action Buttons */}
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', height: '100%' }}>
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
                {(searchTerm || startDate || endDate || selectedRecordType !== 'ALL') && (
                  <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {searchTerm && (
                        <Chip label={`Search: ${searchTerm}`} onDelete={() => setSearchTerm('')} size="small" variant="outlined" />
                      )}
                      {selectedRecordType !== 'ALL' && (
                        <Chip label={`Type: ${selectedRecordType}`} onDelete={() => setSelectedRecordType('ALL')} size="small" color="info" variant="outlined" />
                      )}
                      {startDate && (
                        <Chip label={`From: ${dayjs(startDate).format('MMM DD, YYYY')}`} onDelete={() => setStartDate(null)} size="small" variant="outlined" />
                      )}
                      {endDate && (
                        <Chip label={`To: ${dayjs(endDate).format('MMM DD, YYYY')}`} onDelete={() => setEndDate(null)} size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

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
            {renderRecordTimeline()}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Document Specific Search and Filters */}
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Search documents"
                      variant="outlined"
                      size="small"
                      value={docSearchTerm}
                      onChange={(e) => setDocSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      placeholder="Search filename, type, description..."
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Linked To"
                      value={docRecordType}
                      onChange={(e) => setDocRecordType(e.target.value)}
                      variant="outlined"
                      size="small"
                    >
                      <MenuItem value="ALL">All Documents</MenuItem>
                      <MenuItem value="MEDICAL">Medical Records</MenuItem>
                      <MenuItem value="DENTAL">Dental Records</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <DatePicker
                          label="Uploaded From"
                          value={docStartDate}
                          onChange={setDocStartDate}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          disableFuture
                        />
                        <DatePicker
                          label="Uploaded To"
                          value={docEndDate}
                          onChange={setDocEndDate}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          disableFuture
                        />
                        {(docStartDate || docEndDate) && (
                          <IconButton onClick={() => { setDocStartDate(null); setDocEndDate(null); }} size="small">
                            <ClearIcon />
                          </IconButton>
                        )}
                      </Box>
                    </LocalizationProvider>
                  </Grid>
                </Grid>

                {/* Active Filters Display */}
                {(docSearchTerm || docStartDate || docEndDate || docRecordType !== 'ALL') && (
                  <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {docSearchTerm && (
                        <Chip label={`Search: ${docSearchTerm}`} onDelete={() => setDocSearchTerm('')} size="small" variant="outlined" />
                      )}
                      {docRecordType !== 'ALL' && (
                        <Chip label={`Linked: ${docRecordType}`} onDelete={() => setDocRecordType('ALL')} size="small" color="info" variant="outlined" />
                      )}
                      {docStartDate && (
                        <Chip label={`From: ${dayjs(docStartDate).format('MMM DD, YYYY')}`} onDelete={() => setDocStartDate(null)} size="small" variant="outlined" />
                      )}
                      {docEndDate && (
                        <Chip label={`To: ${dayjs(docEndDate).format('MMM DD, YYYY')}`} onDelete={() => setDocEndDate(null)} size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            <TableContainer component={Paper} elevation={1} sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 1200 }}>
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Linked Record</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments
                      .slice(docsPage * docsRowsPerPage, docsPage * docsRowsPerPage + docsRowsPerPage)
                      .map((doc) => (
                        <TableRow key={doc.id} hover>
                          <TableCell>{dayjs(doc.uploaded_at).format('MMM DD, YYYY')}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{doc.patient_name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={doc.document_type_display} size="small" variant="outlined" color="primary" />
                          </TableCell>
                          <TableCell>
                            {doc.medical_record && medicalMap[doc.medical_record] ? (
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                  Medical Record
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {medicalMap[doc.medical_record].diagnosis || 'No Diagnosis'} ({dayjs(medicalMap[doc.medical_record].visit_date).format('MMM DD, YYYY')})
                                </Typography>
                              </Box>
                            ) : doc.dental_record && dentalMap[doc.dental_record] ? (
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                  Dental Record
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {dentalMap[doc.dental_record].diagnosis || 'No Diagnosis'} ({dayjs(dentalMap[doc.dental_record].visit_date).format('MMM DD, YYYY')})
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">Standalone File</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                              {doc.description || 'No description'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {doc.original_filename} ({(doc.file_size / 1024).toFixed(1)} KB)
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownloadDocument(doc)}
                              >
                                Download
                              </Button>
                              {isStaffOrMedical && (
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  title="Delete Document"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">No documents found matching filters.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredDocuments.length}
              rowsPerPage={docsRowsPerPage}
              page={docsPage}
              onPageChange={handleDocsChangePage}
              onRowsPerPageChange={handleDocsChangeRowsPerPage}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {renderHealthInsights()}
          </TabPanel>
        </>
      )}
      
      {/* Professional Report Template (Hidden) */}
      <ReportTemplate 
        data={filteredRecords} 
        patient={selectedPatient} 
        title="UNIFIED HEALTH HISTORY REPORT"
      />
    </Box>
  );
};

export default MedicalHistoryPage;
