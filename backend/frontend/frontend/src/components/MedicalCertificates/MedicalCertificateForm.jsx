import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Stack,
  InputAdornment,
  Avatar,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { medicalCertificateSchema } from '../../utils/validationSchemas';
import { medicalCertificateService } from '../../services/api';
import { patientService } from '../../services/api';

const MedicalCertificateForm = ({ certificate = null, onSubmit, onCancel, userRole = null }) => {
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const getDefaultValues = () => {
    const baseValues = {
      patient: '',
      template: '',
      diagnosis: '',
      recommendations: '',
      valid_from: null,
      valid_until: null,
      additional_notes: '',
    };
    
    // Only doctors can set fitness status during creation
    if (userRole === 'DOCTOR') {
      return {
        ...baseValues,
        fitness_status: 'fit',
        fitness_reason: '',
        approval_status: 'approved', // Doctors can approve immediately
      };
    }
    
    // Non-doctors create certificates that automatically go to pending
    return baseValues;
  };

  const { handleSubmit, control, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: yupResolver(medicalCertificateSchema),
    defaultValues: getDefaultValues(),
  });

  const fitnessStatus = watch('fitness_status');

  // Filter patients based on search term
  useEffect(() => {
    if (!patientSearchTerm) {
      setFilteredPatients(patients);
    } else {
      const searchLower = patientSearchTerm.toLowerCase();
      const filtered = patients.filter(patient => 
        patient.first_name?.toLowerCase().includes(searchLower) ||
        patient.last_name?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.usc_id?.toLowerCase().includes(searchLower) ||
        patient.id_number?.toLowerCase().includes(searchLower) ||
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchLower)
      );
      setFilteredPatients(filtered);
    }
  }, [patientSearchTerm, patients]);

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    if (certificate && patients.length > 0) {
      // Find and set the selected patient for display
      const patient = patients.find(p => p.id === certificate.patient);
      setSelectedPatient(patient);
      
      reset({
        patient: certificate.patient,
        template: certificate.template,
        diagnosis: certificate.diagnosis,
        recommendations: certificate.recommendations,
        valid_from: new Date(certificate.valid_from),
        valid_until: new Date(certificate.valid_until),
        additional_notes: certificate.additional_notes || '',
        fitness_status: certificate.fitness_status || 'fit',
        fitness_reason: certificate.fitness_reason || '',
        approval_status: certificate.approval_status || 'draft',
      });
    }
  }, [certificate, patients, reset]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const [patientsRes, templatesRes] = await Promise.all([
        patientService.getAll(),
        medicalCertificateService.getAllTemplates(),
      ]);
      const patientsData = patientsRes.data || [];
      setPatients(patientsData);
      setFilteredPatients(patientsData);
      setTemplates(templatesRes.data || []);
    } catch (err) {
      setError('Failed to load form data');
      console.error('Error fetching form data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch (err) {
      setError('Failed to save medical certificate');
      console.error('Error saving certificate:', err);
    }
  };

  const handlePatientChange = (event, value) => {
    setSelectedPatient(value);
    setValue('patient', value ? value.id : '', { shouldValidate: true });
    setPatientSearchTerm(''); // Clear search when patient is selected
  };

  const clearPatientSearch = () => {
    setPatientSearchTerm('');
    setFilteredPatients(patients);
  };

  if (loading) {
    return <Typography>Loading form...</Typography>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={3}>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          {/* Show info when editing non-draft certificates */}
          {certificate && certificate.approval_status !== 'draft' && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Editing Medical Assessment
                </Typography>
                <Typography variant="body2">
                  You can update the fitness status and medical details even after submission. 
                  Changes to fitness status (Fit/Not Fit) and reasons will be reflected in the certificate.
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Patient Selection */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Patient Search & Selection
              </Typography>
              
              {/* Search Input */}
              <TextField
                fullWidth
                placeholder="Search by name, email, or USC ID..."
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: patientSearchTerm && (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={clearPatientSearch}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        <ClearIcon fontSize="small" />
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
              
              {/* Patient Selection */}
              <Controller
                name="patient"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={filteredPatients}
                    getOptionLabel={option => `${option.last_name}, ${option.first_name}${option.usc_id ? ` (USC ID: ${option.usc_id})` : option.id_number ? ` (ID: ${option.id_number})` : ''}`}
                    value={selectedPatient}
                    onChange={handlePatientChange}
                    filterOptions={(options) => options} // Disable built-in filtering since we handle it ourselves
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                        <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {option.first_name} {option.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.email}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            {option.usc_id && (
                              <Chip 
                                label={`USC ID: ${option.usc_id}`} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 18 }}
                              />
                            )}
                            {option.id_number && (
                              <Chip 
                                label={`ID: ${option.id_number}`} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 18 }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}
                    renderInput={params => (
                      <TextField 
                        {...params} 
                        label="Select Patient *" 
                        required 
                        error={!!errors.patient}
                        helperText={errors.patient?.message || `${filteredPatients.length} patient${filteredPatients.length !== 1 ? 's' : ''} found`}
                        placeholder="Choose a patient from the list..."
                      />
                    )}
                    noOptionsText={patientSearchTerm ? "No patients match your search" : "Start typing to search patients"}
                  />
                )}
              />
              
              {/* Selected Patient Display */}
              {selectedPatient && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: 'rgba(25, 118, 210, 0.08)', 
                  borderRadius: 1,
                  border: '1px solid rgba(25, 118, 210, 0.2)'
                }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Selected Patient:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#1976d2' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPatient.email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {selectedPatient.usc_id && (
                          <Chip 
                            label={`USC ID: ${selectedPatient.usc_id}`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {selectedPatient.id_number && (
                          <Chip 
                            label={`ID: ${selectedPatient.id_number}`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Template Selection */}
          <Grid item xs={12} md={6}>
            <Controller
              name="template"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.template}>
                  <InputLabel>Template *</InputLabel>
                  <Select
                    {...field}
                    label="Template *"
                    value={field.value || ''}
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.template && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.template.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </Grid>

          {/* Diagnosis */}
          <Grid item xs={12}>
            <Controller
              name="diagnosis"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label="Diagnosis *"
                  placeholder="Enter the primary diagnosis and any relevant medical conditions..."
                  error={!!errors.diagnosis}
                  helperText={errors.diagnosis?.message}
                />
              )}
            />
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12}>
            <Controller
              name="recommendations"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label="Recommendations *"
                  placeholder="Enter medical recommendations, restrictions, or treatment plans..."
                  error={!!errors.recommendations}
                  helperText={errors.recommendations?.message}
                />
              )}
            />
          </Grid>

          {/* Valid From Date */}
          <Grid item xs={12} md={6}>
            <Controller
              name="valid_from"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="Valid From *"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.valid_from,
                      helperText: errors.valid_from?.message,
                    },
                  }}
                />
              )}
            />
          </Grid>

          {/* Valid Until Date */}
          <Grid item xs={12} md={6}>
            <Controller
              name="valid_until"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="Valid Until *"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.valid_until,
                      helperText: errors.valid_until?.message,
                    },
                  }}
                />
              )}
            />
          </Grid>

          {/* Doctor-Only Fields: Fitness and Approval Status */}
          {userRole === 'DOCTOR' && (
            <>
              {/* Fitness Status */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="fitness_status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.fitness_status}>
                      <InputLabel>Medical Fitness Status *</InputLabel>
                      <Select
                        {...field}
                        label="Medical Fitness Status *"
                        value={field.value || 'fit'}
                      >
                        <MenuItem value="fit">Fit</MenuItem>
                        <MenuItem value="not_fit">Not Fit</MenuItem>
                      </Select>
                      {errors.fitness_status && (
                        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                          {errors.fitness_status.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Approval Status */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="approval_status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.approval_status}>
                      <InputLabel>Approval Status *</InputLabel>
                      <Select
                        {...field}
                        label="Approval Status *"
                        value={field.value || 'approved'}
                      >
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                      {errors.approval_status && (
                        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                          {errors.approval_status.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            </>
          )}

          {/* Non-Doctor Info */}
          {userRole !== 'DOCTOR' && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Automatic Workflow:</strong> This certificate will be automatically submitted for doctor approval once created. 
                  The doctor will assess the medical fitness status and provide final approval.
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Fitness Reason (conditional - only for doctors when not_fit) */}
          {userRole === 'DOCTOR' && fitnessStatus === 'not_fit' && (
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Reason Required for "Not Fit" Status
                </Typography>
                <Typography variant="body2">
                  Please provide a detailed medical reason for determining the patient as "Not Fit". 
                  This information will be included in the certificate and notifications.
                </Typography>
              </Alert>
              <Controller
                name="fitness_reason"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    label="Detailed Reason for Not Fit Status *"
                    placeholder="Please provide detailed medical reason (e.g., specific medical conditions, restrictions, recommended duration of limitation, etc.)..."
                    error={!!errors.fitness_reason}
                    helperText={errors.fitness_reason?.message || "Be specific about medical conditions, limitations, and recommendations"}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 245, 157, 0.2)', // Light yellow background
                        borderColor: 'warning.main',
                      },
                      '& .MuiInputLabel-root': {
                        color: 'warning.main',
                        fontWeight: 'medium',
                      },
                    }}
                  />
                )}
              />
            </Grid>
          )}

          {/* Additional Notes */}
          <Grid item xs={12}>
            <Controller
              name="additional_notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Notes"
                  placeholder="Any additional information or special instructions..."
                  error={!!errors.additional_notes}
                  helperText={errors.additional_notes?.message}
                />
              )}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={onCancel} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                {certificate ? 'Update Certificate' : 'Create Certificate'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default MedicalCertificateForm;