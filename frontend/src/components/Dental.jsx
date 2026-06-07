import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  FormControlLabel,
  Switch,
  Rating,
  LinearProgress,
  Divider,
  InputAdornment,
  Avatar,
  Autocomplete,
  useTheme,
  useMediaQuery,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FilterListOff as FilterListOffIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  LocalHospital as MedicalIcon,
  Warning as WarningIcon,
  GetApp as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  InsertDriveFile as CsvIcon,
  Assessment as ReportIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { reportService } from '../services/reportService';
import ReportTemplate from './utils/ReportTemplate';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import InfoTooltip from './utils/InfoTooltip';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import { dentalRecordService, patientService, patientDocumentService } from '../services/api';
import PatientDocumentUpload from './PatientDocumentUpload';
import { extractErrorMessage } from '../utils/errorUtils';

import ValidationBanner from './common/ValidationBanner';
import ClinicalRemarks from './common/ClinicalRemarks';

const Dental = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dentalRecords, setDentalRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [toothConditions, setToothConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [procedureFilter, setProcedureFilter] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [globalTabValue, setGlobalTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidationBanner, setShowValidationBanner] = useState(false);

  // Document upload state
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedPatientForUpload, setSelectedPatientForUpload] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [globalDocuments, setGlobalDocuments] = useState([]);

  const user = useSelector(selectCurrentUser);
  // Only ADMIN, DENTIST, and NURSE have CRUD for Dental. DOCTOR and STAFF are view-only.
  const canEdit = user && ['ADMIN', 'DENTIST', 'NURSE'].includes(user.role);

  // Form state for new/edit record
  const [formData, setFormData] = useState({
    patient: '',
    visit_date: dayjs().format(),
    concern: '',
    procedure_performed: '',
    tooth_numbers: '',
    diagnosis: '',
    referral_to: '',
    pain_level: null,
  });

  useEffect(() => {
    fetchDentalRecords();
    
    // Only privileged roles should fetch the global patient list
    const isPrivileged = user && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'].includes(user.role);
    if (isPrivileged) {
      fetchPatients();
    }
    
    fetchProcedures();
    fetchToothConditions();
    fetchGlobalDocuments();
  }, [user]);

  const fetchGlobalDocuments = async () => {
    setLoadingDocs(true);
    try {
      // Fetch only documents related to dental (X-ray, dental record type, or linked to dental_record)
      const response = await patientDocumentService.getAllDocuments({ 
        document_type__in: 'DENTAL_RECORD,XRAY'
      });
      const data = response.data?.results || response.data || [];
      setGlobalDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching dental documents:', error);
      setGlobalDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleOpenUpload = (record) => {
    setSelectedRecord(record); // Track the record being uploaded to
    setSelectedPatientForUpload({
      id: record.patient,
      name: record.patient_name
    });
    setOpenUploadDialog(true);
  };

  const fetchDentalRecords = async () => {
    setLoading(true);
    try {
      const response = await dentalRecordService.getAll();
      setDentalRecords(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching dental consultations:', error);
      setError('Failed to load dental consultations. Please try again.');
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

  const fetchProcedures = async () => {
    try {
      const response = await dentalRecordService.getProcedures();
      setProcedures(response.data.procedures || []);
    } catch (error) {
      console.error('Error fetching procedures:', error);
    }
  };

  const fetchToothConditions = async () => {
    try {
      const response = await dentalRecordService.getToothConditions();
      setToothConditions(response.data.tooth_conditions || []);
    } catch (error) {
      console.error('Error fetching tooth conditions:', error);
    }
  };

  const handleRemarkAdded = async () => {
    // Refresh all records to get the updated remarks
    try {
      const response = await dentalRecordService.getAll();
      const records = response.data || [];
      setDentalRecords(records);
      
      // Update selected record if open
      if (selectedRecord) {
        const updated = records.find(r => r.id === selectedRecord.id);
        if (updated) setSelectedRecord(updated);
      }
    } catch (err) {
      console.error('Error refreshing dental records:', err);
    }
  };

  const handleOpenDialog = (record = null) => {
    setFormError(null);
    setValidationErrors({});
    setShowValidationBanner(false);
    if (record) {
      setSelectedRecord(record);
      setFormData({
        ...record,
        visit_date: dayjs(record.visit_date).format(),
      });
      setIsEditing(true);
    } else {
      setSelectedRecord(null);
      setFormData({
        patient: '',
        visit_date: dayjs().format(),
        concern: '',
        procedure_performed: '',
        tooth_numbers: '',
        diagnosis: '',
        referral_to: '',
        pain_level: null,
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRecord(null);
    setIsEditing(false);
    setTabValue(0);
    setFormError(null);
  };

  const fetchRecordAttachments = async (record) => {
    if (!record) return;
    try {
      const res = await patientDocumentService.getAllDocuments({ dental_record: record.id });
      const data = res.data?.results || res.data || [];
      setAttachments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching dental attachments:', err);
      setAttachments([]);
    }
  };

  const handleViewRecord = async (record) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
    // Fetch attachments for this dental record
    await fetchRecordAttachments(record);
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const response = await patientDocumentService.downloadDocument(doc.id);
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from document if possible, otherwise use original_filename
      const filename = doc.original_filename || `document_${doc.id}`;
      link.setAttribute('download', filename);
      
      // Append to html link element page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleDeleteAttachment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this attachment? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await patientDocumentService.deleteDocument(id);
      await fetchRecordAttachments(selectedRecord);
    } catch (err) {
      console.error("Error deleting attachment:", err);
      alert("Failed to delete attachment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setFormError(null);
    setValidationErrors({});
    setShowValidationBanner(false);

    // Manual Validation
    const errors = {};
    if (!formData.patient) errors.patient = { message: 'Patient selection is required' };
    if (!formData.visit_date) errors.visit_date = { message: 'Visit date is required' };
    
    // Future Date Trapping
    if (formData.visit_date && dayjs(formData.visit_date).isAfter(dayjs().add(1, 'minute'))) {
        errors.visit_date = { message: 'Visit date cannot be in the future' };
    }

    if (!formData.procedure_performed) errors.procedure_performed = { message: 'Procedure performed is required' };
    if (!formData.diagnosis) errors.diagnosis = { message: 'Diagnosis is required' };
    
    // Physiological Bounds for Pain Level
    if (formData.pain_level !== null && (formData.pain_level < 1 || formData.pain_level > 10)) {
        errors.pain_level = { message: 'Pain level must be between 1 and 10' };
    }

    if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setShowValidationBanner(true);
        return;
    }

    try {
      const submitData = {
        ...formData,
        visit_date: dayjs(formData.visit_date).format(),
      };

      if (isEditing) {
        await dentalRecordService.update(selectedRecord.id, submitData);
        setSuccess('Dental consultation updated successfully!');
      } else {
        await dentalRecordService.create(submitData);
        setSuccess('Dental consultation created successfully!');
      }
      
      handleCloseDialog();
      fetchDentalRecords();
      fetchGlobalDocuments();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving dental consultation:', error);
      setFormError(extractErrorMessage(error));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this dental consultation?')) {
      try {
        await dentalRecordService.delete(id);
        setSuccess('Dental consultation deleted successfully!');
        fetchDentalRecords();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('Error deleting dental consultation:', error);
        setError('Failed to delete dental consultation');
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  // Filter records based on search and filters
  const filteredRecords = dentalRecords.filter(record => {
    const searchMatch = 
      (record.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.concern || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.procedure_performed_display || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date Range Match
    let dateMatch = true;
    if (startDate) {
      dateMatch = dateMatch && dayjs(record.visit_date).isAfter(dayjs(startDate).subtract(1, 'day'));
    }
    if (endDate) {
      dateMatch = dateMatch && dayjs(record.visit_date).isBefore(dayjs(endDate).add(1, 'day'));
    }
    
    const procedureMatch = procedureFilter ? record.procedure_performed === procedureFilter : true;
    return searchMatch && procedureMatch && dateMatch;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRecords = filteredRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    setProcedureFilter('');
    };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('MMM DD, YYYY hh:mm A');
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  // Export Functions
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      setError('No dental consultations to export');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const data = reportService.prepareDataForExport(filteredRecords, 'DENTAL');
    reportService.exportToCSV(data, `dental-records-${dayjs().format('YYYY-MM-DD-HHmm')}.csv`);
    
    setSuccess(`Exported ${filteredRecords.length} dental consultations to CSV`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleExportExcel = async () => {
    if (filteredRecords.length === 0) {
      setError('No dental consultations to export');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const data = reportService.prepareDataForExport(filteredRecords, 'DENTAL');
    reportService.exportToExcel(data, `dental-records-${dayjs().format('YYYY-MM-DD-HHmm')}.xls`);

    setSuccess(`Exported ${filteredRecords.length} dental consultations to Excel format`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handlePrintReport = async () => {
    if (filteredRecords.length === 0) {
      setError('No dental consultations to print');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const element = document.getElementById('professional-report-template');
    if (!element) return;
    
    setLoading(true);
    try {
      await reportService.generatePDF(element, `dental-consultation-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
      setSuccess('Professional report generated successfully');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      setError('Failed to generate professional PDF report.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ mb: 0, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              Dental Consultation Management
            </Typography>
            <InfoTooltip title="Create, search, and manage dental consultations. Filter, export, and print as needed." />
          </Box>
          <Box display="flex" gap={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            {/* Export Buttons */}
            <Button
              variant="outlined"
              startIcon={<CsvIcon />}
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              size="small"
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExcelIcon />}
              onClick={handleExportExcel}
              disabled={filteredRecords.length === 0}
              size="small"
              sx={{ color: '#0d7c34', borderColor: '#0d7c34', '&:hover': { borderColor: '#0d7c34', bgcolor: '#f0f9f0' } }}
            >
              Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrintReport}
              disabled={filteredRecords.length === 0}
              size="small"
              sx={{ color: '#d32f2f', borderColor: '#d32f2f', '&:hover': { borderColor: '#d32f2f', bgcolor: '#fff0f0' } }}
            >
              Print
            </Button>
            {canEdit && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ bgcolor: '#1976d2', whiteSpace: 'nowrap' }}
              >
                New Consultation
              </Button>
            )}
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Search and Filters */}
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search consultations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4.5}>
              <Box display="flex" gap={1} alignItems="center" sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                <DatePicker
                  label="From Date"
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      size: 'small',
                      InputLabelProps: { shrink: true }
                    } 
                  }}
                  maxDate={endDate || dayjs()}
                />
                <DatePicker
                  label="To Date"
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      size: 'small',
                      InputLabelProps: { shrink: true }
                    } 
                  }}
                  minDate={startDate}
                  maxDate={dayjs()}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Procedure</InputLabel>
                <Select
                  value={procedureFilter}
                  label="Procedure"
                  onChange={(e) => setProcedureFilter(e.target.value)}
                  notched
                >
                  <MenuItem value="">All Procedures</MenuItem>
                  {procedures.map((proc) => (
                    <MenuItem key={proc.value} value={proc.value}>
                      {proc.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box display="flex" gap={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Button
                  startIcon={<FilterListOffIcon />}
                  onClick={clearFilters}
                  size="small"
                  variant="outlined"
                  fullWidth={isMobile}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Records Display */}
        {paginatedRecords.length > 0 ? (
          <>
          <Grid container spacing={3}>
            {paginatedRecords.map((record) => (
              <Grid item xs={12} md={6} lg={4} key={record.id}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="div">
                        {record.patient_name}
                      </Typography>
                    </Box>
                    
                    <Typography color="text.secondary" gutterBottom>
                      <CalendarIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      {formatDate(record.visit_date)}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <MedicalIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      {record.procedure_performed_display}
                    </Typography>
                    
                    {record.tooth_numbers && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Teeth: {record.affected_teeth_display}
                      </Typography>
                    )}
                    
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {record.diagnosis.length > 100 
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
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewRecord(record)}
                    >
                      View
                    </Button>
                    <Tooltip title="Upload Dental Document (X-ray, Chart, etc.)">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenUpload(record)}
                        disabled={!canEdit}
                      >
                        <UploadIcon />
                      </IconButton>
                    </Tooltip>
                    {canEdit && (
                      <>
                        <Button 
                          size="small" 
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(record)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(record.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <TablePagination
            rowsPerPageOptions={[6, 12, 24, 48]}
            component="div"
            count={filteredRecords.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No dental consultations found
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {canEdit ? 'Create a new dental consultation to get started.' : 'No records to display.'}
            </Typography>
          </Paper>
        )}

        {/* Patient Document Upload Dialog */}
        <PatientDocumentUpload
          open={openUploadDialog}
          onClose={() => {
            setOpenUploadDialog(false);
            if (!viewDialogOpen) setSelectedRecord(null);
          }}
          patientId={selectedPatientForUpload?.id}
          patientName={selectedPatientForUpload?.name}
          dentalRecordId={selectedRecord?.id}
          onUploadSuccess={() => {
            setSuccess('Document uploaded successfully!');
            if (viewDialogOpen) {
              handleViewRecord(selectedRecord);
            }
            setTimeout(() => setSuccess(null), 3000);
          }}
        />

        {/* Create/Edit Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {isEditing ? 'Edit Dental Consultation' : 'Create New Dental Consultation'}
          </DialogTitle>
          <DialogContent>
              <Box sx={{ mb: 2 }}>
                <ValidationBanner errors={validationErrors} show={showValidationBanner} />
                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
                    {formError}
                  </Alert>
                )}
                <Alert severity="info" sx={{ mb: 2 }}>
                  Note: The clinic primarily provides dental consultations and referrals.
                </Alert>
              
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={patients}
                      getOptionLabel={(option) => {
                        const name = `${option.first_name || ''} ${option.last_name || ''}`.trim();
                        const id = option.usc_id || option.id_number || option.student_id;
                        return `${name}${id ? ` (${id})` : ''}`;
                      }}
                      value={patients.find(p => p.id === formData.patient) || null}
                      onChange={(event, newValue) => handleInputChange('patient', newValue ? newValue.id : '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Patient"
                          required
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
                              {option.usc_id || option.id_number || option.student_id || 'No ID'}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="Visit Date & Time *"
                      value={dayjs(formData.visit_date)}
                      onChange={(date) => handleInputChange('visit_date', dayjs(date).format())}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                      disableFuture
                      minutesStep={1}
                      timeSteps={{ minutes: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Concern / Reason for Visit *"
                      value={formData.concern}
                      onChange={(e) => handleInputChange('concern', e.target.value)}
                      multiline
                      rows={2}
                      required
                      placeholder="What is the student's concern or reason for the visit?"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Procedure *</InputLabel>
                      <Select
                        value={formData.procedure_performed}
                        label="Procedure *"
                        onChange={(e) => handleInputChange('procedure_performed', e.target.value)}
                      >
                        {procedures.map((proc) => (
                          <MenuItem key={proc.value} value={proc.value}>
                            {proc.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tooth Numbers"
                      value={formData.tooth_numbers}
                      onChange={(e) => handleInputChange('tooth_numbers', e.target.value)}
                      placeholder="e.g., 11,12,21"
                      helperText="Optional: Use FDI notation if specific teeth are involved"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Findings / Diagnosis *"
                      value={formData.diagnosis}
                      onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                      multiline
                      rows={3}
                      required
                      placeholder="Clinical findings and dental diagnosis..."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Referral To"
                      value={formData.referral_to}
                      onChange={(e) => handleInputChange('referral_to', e.target.value)}
                      placeholder="Name of clinic or specialist if referring out..."
                      helperText="Specify the destination clinic or specialist"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Pain Level (1-10)"
                      type="number"
                      value={formData.pain_level || ''}
                      onChange={(e) => handleInputChange('pain_level', e.target.value ? parseInt(e.target.value) : null)}
                      inputProps={{ min: 1, max: 10 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={!formData.patient || !formData.procedure_performed || !formData.concern || !formData.diagnosis}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Record Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Dental Consultation Details
            <IconButton
              sx={{ position: 'absolute', right: 8, top: 8 }}
              onClick={() => setViewDialogOpen(false)}
            >
              ×
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedRecord && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Patient
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRecord.patient_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Visit Date
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(selectedRecord.visit_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Concern / Reason for Visit
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRecord.concern || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Procedure
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRecord.procedure_performed_display}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Affected Teeth
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRecord.affected_teeth_display || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Findings / Diagnosis
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRecord.diagnosis}
                    </Typography>
                  </Grid>

                  {selectedRecord.referral_to && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Referral To
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedRecord.referral_to}
                      </Typography>
                    </Grid>
                  )}
                  {selectedRecord.pain_level && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Pain Level
                      </Typography>
                      <Box display="flex" alignItems="center">
                        <Rating value={selectedRecord.pain_level / 2} readOnly size="small" />
                        <Typography variant="body1" ml={1}>
                          ({selectedRecord.pain_level}/10)
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  </Grid>

                  {/* Attachments Section */}

                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#7c3aed' }}>
                    <FileIcon /> Attachments & Documents
                  </Typography>
                  
                  { (Array.isArray(attachments) ? attachments : []).length > 0 ? (
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                      { (Array.isArray(attachments) ? attachments : []).map((doc) => (
                        <Grid item xs={12} sm={6} key={doc.id}>
                          <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <FileIcon color="primary" />
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography variant="body2" noWrap fontWeight="medium">
                                {doc.original_filename}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {doc.document_type_display}
                              </Typography>
                            </Box>
                            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDownloadDocument(doc)}
                                title="Download"
                                color="primary"
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                              {canEdit && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteAttachment(doc.id)}
                                  title="Delete"
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      No documents attached to this dental consultation.
                    </Typography>
                  )}
                </Box>

                {/* Clinical Remarks Section */}
                <ClinicalRemarks 
                  remarks={selectedRecord.clinical_remarks} 
                  contentTypeId={selectedRecord.content_type_id} 
                  objectId={selectedRecord.id}
                  onRemarkAdded={handleRemarkAdded}
                  readOnly={['STUDENT', 'FACULTY'].includes(user?.role)}
                />
              </Box>
            )}
          </DialogContent>
        </Dialog>
        {/* Export Template (Hidden) */}
        <ReportTemplate 
          data={filteredRecords} 
          patient={patients.find(p => p.id === filteredRecords[0]?.patient)}
          title="DENTAL CONSULTATION REPORT" 
          reportType="DENTAL"
        />
      </Box>
    </LocalizationProvider>
  );
};

export default Dental;
