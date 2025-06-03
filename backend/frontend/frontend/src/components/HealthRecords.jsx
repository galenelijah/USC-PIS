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
  Healing as HealingIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import dayjs from 'dayjs';
import { healthRecordsService, patientService } from '../services/api';
import MedicalRecord from './MedicalRecord';

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

  // Check if user can edit records (not a student)
  const canEditRecords = user && user.role !== 'STUDENT';

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
      (record.patient?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.patient?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.patient?.id_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateMatch = selectedDate ? record.visit_date === dayjs(selectedDate).format('YYYY-MM-DD') : true;
    
    // Filter based on tab selection (0: All, 1: Medical, 2: Dental)
    const typeMatch = tabValue === 0 || 
      (tabValue === 1 && record.record_type === 'MEDICAL') || 
      (tabValue === 2 && record.record_type === 'DENTAL');
    
    return searchMatch && dateMatch && typeMatch;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Health Records
      </Typography>

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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{ 
              ml: 'auto',
              bgcolor: 'rgb(104, 138, 124)', 
              '&:hover': { bgcolor: 'rgb(84, 118, 104)' } 
            }}
          >
            Add Record
          </Button>
        )}
      </Box>

      {/* Tabs for record types */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="health record tabs">
          <Tab label="All Records" id="health-record-tab-0" />
          <Tab label="Medical" id="health-record-tab-1" icon={<MedicalIcon />} iconPosition="start" />
          <Tab label="Dental" id="health-record-tab-2" icon={<HealingIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Records Table */}
      {loading ? (
        <Typography>Loading records...</Typography>
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
                    <TableCell>{record.patient ? `${record.patient.first_name || ''} ${record.patient.last_name || ''}`.trim() : 'Unknown Patient'}</TableCell>
                    <TableCell>{record.patient?.id_number || 'N/A'}</TableCell>
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
          {dialogMode === 'create' ? 'Create Health Record' : 'Edit Health Record'}
        </DialogTitle>
        <DialogContent dividers>
          {currentRecord && (
            <Grid container spacing={2}>
              {dialogMode === 'create' && (
                <Grid item xs={12}>
                  <Autocomplete
                    options={patients}
                    getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.id_number || 'No ID'})`}
                    value={patients.find(p => p.id === currentRecord.patient) || null}
                    onChange={handlePatientChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Patient"
                        required
                        margin="normal"
                        helperText="Search by name or ID number"
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                  />
                </Grid>
              )}
              {dialogMode === 'edit' && currentRecord.patient && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Patient"
                    value={`${currentRecord.patient.first_name || ''} ${currentRecord.patient.last_name || ''} (${currentRecord.patient.id_number || 'No ID'})`}
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
              bgcolor: 'rgb(104, 138, 124)', 
              '&:hover': { bgcolor: 'rgb(84, 118, 104)' } 
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
    </Box>
  );
};

export default HealthRecords; 