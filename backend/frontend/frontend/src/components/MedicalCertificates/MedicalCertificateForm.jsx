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
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { createMedicalCertificateSchema } from '../../utils/validationSchemas';
import { medicalCertificateService } from '../../services/api';
import { patientService } from '../../services/api';

const MedicalCertificateForm = ({ certificate = null, onSubmit, onCancel, userRole = null }) => {
  console.log('MedicalCertificateForm rendered with userRole:', userRole); // Debug log
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    resolver: yupResolver(createMedicalCertificateSchema(userRole)),
    defaultValues: getDefaultValues(),
  });

  const fitnessStatus = watch('fitness_status');


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

          {/* Patient Selection - Enhanced Single-Step Search */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mb: 2 }}>
              🔍 Patient Search & Selection
            </Typography>
            
            <Controller
              name="patient"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={patients}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    return `${option.first_name} ${option.last_name}`;
                  }}
                  value={selectedPatient}
                  onChange={handlePatientChange}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;
                    
                    const searchLower = inputValue.toLowerCase();
                    return options.filter(patient => 
                      patient.first_name?.toLowerCase().includes(searchLower) ||
                      patient.last_name?.toLowerCase().includes(searchLower) ||
                      patient.email?.toLowerCase().includes(searchLower) ||
                      patient.usc_id?.toLowerCase().includes(searchLower) ||
                      patient.id_number?.toLowerCase().includes(searchLower) ||
                      `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchLower)
                    );
                  }}
                  renderOption={(props, option) => (
                    <Box 
                      component="li" 
                      {...props} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        py: 1.5,
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: 'primary.main', 
                          width: 40, 
                          height: 40,
                          fontSize: '0.9rem'
                        }}
                      >
                        {option.first_name?.[0]}{option.last_name?.[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body1" 
                          fontWeight="medium"
                          sx={{ mb: 0.5 }}
                        >
                          {option.first_name} {option.last_name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          📧 {option.email}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {option.usc_id && (
                            <Chip 
                              label={`🎓 USC ID: ${option.usc_id}`} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.7rem', 
                                height: 20,
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          )}
                          {option.id_number && (
                            <Chip 
                              label={`🆔 ID: ${option.id_number}`} 
                              size="small" 
                              color="secondary"
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.7rem', 
                                height: 20,
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Search and Select Patient" 
                      placeholder="Start typing patient name, email, or USC ID..."
                      required 
                      error={!!errors.patient}
                      helperText={
                        errors.patient?.message || 
                        "💡 Type to search by name, email, USC ID, or ID number"
                      }
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                          }
                        },
                      }}
                    />
                  )}
                  noOptionsText="No patients found - try a different search term"
                  loadingText="Loading patients..."
                  clearOnBlur={false}
                  selectOnFocus
                  handleHomeEndKeys
                  popupIcon={null}
                  clearIcon={selectedPatient ? <ClearIcon /> : null}
                  sx={{
                    '& .MuiAutocomplete-popupIndicator': {
                      display: 'none'
                    }
                  }}
                />
              )}
            />
            
            {/* Selected Patient Confirmation */}
            {selectedPatient && (
              <Box sx={{ 
                mt: 3, 
                p: 3, 
                backgroundColor: 'rgba(76, 175, 80, 0.08)', 
                borderRadius: 2,
                border: '2px solid rgba(76, 175, 80, 0.2)',
                position: 'relative'
              }}>
                <Typography 
                  variant="subtitle2" 
                  color="success.main" 
                  gutterBottom
                  sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  ✅ Selected Patient Confirmed
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'success.main', 
                      width: 48, 
                      height: 48,
                      fontSize: '1.1rem'
                    }}
                  >
                    {selectedPatient.first_name?.[0]}{selectedPatient.last_name?.[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      📧 {selectedPatient.email}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {selectedPatient.usc_id && (
                        <Chip 
                          label={`🎓 USC ID: ${selectedPatient.usc_id}`} 
                          size="small" 
                          color="success"
                          variant="filled"
                          sx={{ fontWeight: 'medium' }}
                        />
                      )}
                      {selectedPatient.id_number && (
                        <Chip 
                          label={`🆔 ID: ${selectedPatient.id_number}`} 
                          size="small" 
                          color="info"
                          variant="filled"
                          sx={{ fontWeight: 'medium' }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>
              </Box>
            )}
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