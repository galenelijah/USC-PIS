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
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  LocalHospital as MedicalIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import { dentalRecordService, patientService } from '../services/api';

const Dental = () => {
  const [dentalRecords, setDentalRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [toothConditions, setToothConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [procedureFilter, setProcedureFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const user = useSelector(selectCurrentUser);
  const canEdit = user && ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(user.role);

  // Form state for new/edit record
  const [formData, setFormData] = useState({
    patient: '',
    visit_date: dayjs().format('YYYY-MM-DD'),
    procedure_performed: '',
    tooth_numbers: '',
    diagnosis: '',
    treatment_performed: '',
    treatment_plan: '',
    oral_hygiene_status: '',
    gum_condition: '',
    clinical_notes: '',
    pain_level: null,
    anesthesia_used: false,
    anesthesia_type: '',
    materials_used: '',
    next_appointment_recommended: null,
    home_care_instructions: '',
    priority: 'LOW',
    cost: null,
    insurance_covered: false
  });

  useEffect(() => {
    fetchDentalRecords();
    fetchPatients();
    fetchProcedures();
    fetchToothConditions();
  }, []);

  const fetchDentalRecords = async () => {
    setLoading(true);
    try {
      const response = await dentalRecordService.getAll();
      setDentalRecords(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching dental records:', error);
      setError('Failed to load dental records. Please try again.');
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

  const handleOpenDialog = (record = null) => {
    if (record) {
      setSelectedRecord(record);
      setFormData({
        ...record,
        visit_date: dayjs(record.visit_date).format('YYYY-MM-DD'),
        next_appointment_recommended: record.next_appointment_recommended 
          ? dayjs(record.next_appointment_recommended).format('YYYY-MM-DD') 
          : null
      });
      setIsEditing(true);
    } else {
      setSelectedRecord(null);
      setFormData({
        patient: '',
        visit_date: dayjs().format('YYYY-MM-DD'),
        procedure_performed: '',
        tooth_numbers: '',
        diagnosis: '',
        treatment_performed: '',
        treatment_plan: '',
        oral_hygiene_status: '',
        gum_condition: '',
        clinical_notes: '',
        pain_level: null,
        anesthesia_used: false,
        anesthesia_type: '',
        materials_used: '',
        next_appointment_recommended: null,
        home_care_instructions: '',
        priority: 'LOW',
        cost: null,
        insurance_covered: false
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRecord(null);
    setIsEditing(false);
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        next_appointment_recommended: formData.next_appointment_recommended || null
      };

      if (isEditing) {
        await dentalRecordService.update(selectedRecord.id, submitData);
        setSuccess('Dental record updated successfully!');
      } else {
        await dentalRecordService.create(submitData);
        setSuccess('Dental record created successfully!');
      }
      
      handleCloseDialog();
      fetchDentalRecords();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving dental record:', error);
      setError(error.response?.data?.detail || 'Failed to save dental record');
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this dental record?')) {
      try {
        await dentalRecordService.delete(id);
        setSuccess('Dental record deleted successfully!');
        fetchDentalRecords();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('Error deleting dental record:', error);
        setError('Failed to delete dental record');
        setTimeout(() => setError(null), 5000);
      }
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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'URGENT': return 'Urgent';
      case 'HIGH': return 'High';
      case 'MEDIUM': return 'Medium';
      case 'LOW': return 'Low';
      default: return priority;
    }
  };

  // Filter records based on search and filters
  const filteredRecords = dentalRecords.filter(record => {
    const searchMatch = 
      (record.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.procedure_performed_display || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateMatch = selectedDate ? 
      dayjs(record.visit_date).format('YYYY-MM-DD') === dayjs(selectedDate).format('YYYY-MM-DD') : true;
    
    const procedureMatch = procedureFilter ? record.procedure_performed === procedureFilter : true;
    const priorityMatch = priorityFilter ? record.priority === priorityFilter : true;
    
    return searchMatch && dateMatch && procedureMatch && priorityMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('MMM DD, YYYY');
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            Dental Records Management
          </Typography>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: '#1976d2' }}
            >
              New Dental Record
            </Button>
          )}
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
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search records..."
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
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Filter by Date"
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Procedure</InputLabel>
                <Select
                  value={procedureFilter}
                  label="Procedure"
                  onChange={(e) => setProcedureFilter(e.target.value)}
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
            <Grid item xs={12} md={3}>
              <Box display="flex" gap={1}>
                <Button
                  startIcon={<FilterIcon />}
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDate(null);
                    setProcedureFilter('');
                    setPriorityFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Records Display */}
        {filteredRecords.length > 0 ? (
          <Grid container spacing={3}>
            {filteredRecords.map((record) => (
              <Grid item xs={12} md={6} lg={4} key={record.id}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="div">
                        {record.patient_name}
                      </Typography>
                      <Chip
                        label={getPriorityLabel(record.priority)}
                        size="small"
                        sx={{
                          bgcolor: getPriorityColor(record.priority),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
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
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No dental records found
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {canEdit ? 'Create a new dental record to get started.' : 'No records to display.'}
            </Typography>
          </Paper>
        )}

        {/* Create/Edit Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {isEditing ? 'Edit Dental Record' : 'Create New Dental Record'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Basic Information" />
                <Tab label="Clinical Details" />
                <Tab label="Treatment & Follow-up" />
              </Tabs>
              
              {/* Basic Information Tab */}
              {tabValue === 0 && (
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Patient</InputLabel>
                        <Select
                          value={formData.patient}
                          label="Patient"
                          onChange={(e) => handleInputChange('patient', e.target.value)}
                        >
                          {patients.map((patient) => (
                            <MenuItem key={patient.id} value={patient.id}>
                              {patient.first_name} {patient.last_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Visit Date"
                        value={dayjs(formData.visit_date)}
                        onChange={(date) => handleInputChange('visit_date', dayjs(date).format('YYYY-MM-DD'))}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Procedure</InputLabel>
                        <Select
                          value={formData.procedure_performed}
                          label="Procedure"
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
                        helperText="Use FDI notation, comma-separated"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Diagnosis"
                        value={formData.diagnosis}
                        onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                        multiline
                        rows={3}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Treatment Performed"
                        value={formData.treatment_performed}
                        onChange={(e) => handleInputChange('treatment_performed', e.target.value)}
                        multiline
                        rows={3}
                        required
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Clinical Details Tab */}
              {tabValue === 1 && (
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Oral Hygiene Status</InputLabel>
                        <Select
                          value={formData.oral_hygiene_status}
                          label="Oral Hygiene Status"
                          onChange={(e) => handleInputChange('oral_hygiene_status', e.target.value)}
                        >
                          <MenuItem value="EXCELLENT">Excellent</MenuItem>
                          <MenuItem value="GOOD">Good</MenuItem>
                          <MenuItem value="FAIR">Fair</MenuItem>
                          <MenuItem value="POOR">Poor</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Gum Condition</InputLabel>
                        <Select
                          value={formData.gum_condition}
                          label="Gum Condition"
                          onChange={(e) => handleInputChange('gum_condition', e.target.value)}
                        >
                          <MenuItem value="HEALTHY">Healthy</MenuItem>
                          <MenuItem value="GINGIVITIS">Gingivitis</MenuItem>
                          <MenuItem value="PERIODONTITIS">Periodontitis</MenuItem>
                          <MenuItem value="INFLAMMATION">Inflammation</MenuItem>
                        </Select>
                      </FormControl>
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
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={formData.priority}
                          label="Priority"
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                        >
                          <MenuItem value="LOW">Low</MenuItem>
                          <MenuItem value="MEDIUM">Medium</MenuItem>
                          <MenuItem value="HIGH">High</MenuItem>
                          <MenuItem value="URGENT">Urgent</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Clinical Notes"
                        value={formData.clinical_notes}
                        onChange={(e) => handleInputChange('clinical_notes', e.target.value)}
                        multiline
                        rows={3}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.anesthesia_used}
                            onChange={(e) => handleInputChange('anesthesia_used', e.target.checked)}
                          />
                        }
                        label="Anesthesia Used"
                      />
                    </Grid>
                    {formData.anesthesia_used && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Anesthesia Type"
                          value={formData.anesthesia_type}
                          onChange={(e) => handleInputChange('anesthesia_type', e.target.value)}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Materials Used"
                        value={formData.materials_used}
                        onChange={(e) => handleInputChange('materials_used', e.target.value)}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Treatment & Follow-up Tab */}
              {tabValue === 2 && (
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Treatment Plan"
                        value={formData.treatment_plan}
                        onChange={(e) => handleInputChange('treatment_plan', e.target.value)}
                        multiline
                        rows={3}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Home Care Instructions"
                        value={formData.home_care_instructions}
                        onChange={(e) => handleInputChange('home_care_instructions', e.target.value)}
                        multiline
                        rows={3}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Next Appointment (Recommended)"
                        value={formData.next_appointment_recommended ? dayjs(formData.next_appointment_recommended) : null}
                        onChange={(date) => handleInputChange('next_appointment_recommended', 
                          date ? dayjs(date).format('YYYY-MM-DD') : null)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Cost"
                        type="number"
                        value={formData.cost || ''}
                        onChange={(e) => handleInputChange('cost', e.target.value ? parseFloat(e.target.value) : null)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.insurance_covered}
                            onChange={(e) => handleInputChange('insurance_covered', e.target.checked)}
                          />
                        }
                        label="Insurance Covered"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={!formData.patient || !formData.procedure_performed || !formData.diagnosis || !formData.treatment_performed}
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
            Dental Record Details
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
                      Diagnosis
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRecord.diagnosis}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Treatment Performed
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRecord.treatment_performed}
                    </Typography>
                  </Grid>
                  {selectedRecord.treatment_plan && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Treatment Plan
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedRecord.treatment_plan}
                      </Typography>
                    </Grid>
                  )}
                  {selectedRecord.clinical_notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Clinical Notes
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedRecord.clinical_notes}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Oral Hygiene Status
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRecord.oral_hygiene_status || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Gum Condition
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRecord.gum_condition || 'N/A'}
                    </Typography>
                  </Grid>
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
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Priority
                    </Typography>
                    <Chip
                      label={getPriorityLabel(selectedRecord.priority)}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(selectedRecord.priority),
                        color: 'white',
                      }}
                    />
                  </Grid>
                  {selectedRecord.cost && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Cost
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatCurrency(selectedRecord.cost)}
                        {selectedRecord.insurance_covered && (
                          <Chip label="Insured" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </Grid>
                  )}
                  {selectedRecord.next_appointment_recommended && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Next Appointment Recommended
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatDate(selectedRecord.next_appointment_recommended)}
                      </Typography>
                    </Grid>
                  )}
                  {selectedRecord.home_care_instructions && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Home Care Instructions
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedRecord.home_care_instructions}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Dental;