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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { createMedicalCertificateSchema } from '../../utils/validationSchemas';
import { medicalCertificateService } from '../../services/api';
import { patientService } from '../../services/api';

import ValidationBanner from '../common/ValidationBanner';

const MedicalCertificateForm = ({ certificate = null, onSubmit, onCancel, userRole = null }) => {
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showValidationBanner, setShowValidationBanner] = useState(false);
  
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
    
    if (userRole === 'DOCTOR') {
      return {
        ...baseValues,
        fitness_status: 'physically_fit',
        fitness_reason: '',
      };
    }
    
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
      const patient = patients.find(p => p.id === certificate.patient);
      setSelectedPatient(patient);
      
      reset({
        patient: certificate.patient,
        template: certificate.template || (templates.length > 0 ? templates[0].id : ''),
        diagnosis: certificate.diagnosis,
        recommendations: certificate.recommendations,
        valid_from: certificate.valid_from ? dayjs(certificate.valid_from) : null,
        valid_until: certificate.valid_until ? dayjs(certificate.valid_until) : null,
        additional_notes: certificate.additional_notes || '',
        fitness_status: certificate.fitness_status || 'physically_fit',
        fitness_reason: certificate.fitness_reason || '',
      });
    }
  }, [certificate, patients, templates, reset]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      
      // Only privileged roles can fetch the patient list
      const isPrivileged = userRole && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'].includes(userRole);
      
      const promises = [medicalCertificateService.getAllTemplates()];
      if (isPrivileged) {
        promises.push(patientService.getAll());
      }
      
      const results = await Promise.all(promises);
      const templatesData = results[0].data || [];
      const patientsData = isPrivileged ? (results[1].data || []) : [];
      
      setTemplates(templatesData);
      setPatients(patientsData);
      
      if (!certificate && templatesData.length > 0) {
        setValue('template', templatesData[0].id);
      }
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
      // Format dates to YYYY-MM-DD to avoid timezone shifting issues
      const formattedData = {
        ...data,
        valid_from: data.valid_from ? dayjs(data.valid_from).format('YYYY-MM-DD') : null,
        valid_until: data.valid_until ? dayjs(data.valid_until).format('YYYY-MM-DD') : null,
      };
      await onSubmit(formattedData);
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
    return <Typography sx={{ p: 2 }}>Loading form...</Typography>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(handleFormSubmit, () => setShowValidationBanner(true))}>
          <ValidationBanner errors={errors} show={showValidationBanner} />
          <Grid container spacing={3}>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {certificate && certificate.issuance_status !== 'draft' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Updating Medical Assessment
                  </Typography>
                  <Typography variant="body2">
                    You are updating an existing medical assessment. Changes to fitness status (Physically Fit / Physically Unfit) and reasons will be reflected in the final issued certificate.
                  </Typography>
                </Alert>
              </Grid>
            )}

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
                      const name = `${option.first_name || ''} ${option.last_name || ''}`.trim();
                      const id = option.usc_id || option.id_number || option.student_id;
                      return `${name}${id ? ` (${id})` : ''}`;
                    }}
                    value={selectedPatient}
                    onChange={handlePatientChange}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option => {
                        const name = `${option.first_name || ''} ${option.last_name || ''}`.toLowerCase();
                        const email = (option.email || '').toLowerCase();
                        const uscId = (option.usc_id || option.id_number || option.student_id || '').toLowerCase();
                        const search = inputValue.toLowerCase();
                        return name.includes(search) || email.includes(search) || uscId.includes(search);
                      });
                    }}
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
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Search and Select Patient" 
                        placeholder="Start typing patient name, email, or USC ID..."
                        required 
                        error={!!errors.patient}
                        helperText={errors.patient?.message || "Search by name, email, or USC ID"}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                    popupIcon={null}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="template"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.template}>
                    <InputLabel>Template</InputLabel>
                    <Select
                      {...field}
                      label="Template"
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

            <Grid item xs={12}>
              <Controller
                name="diagnosis"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={2}
                    label="Purpose/Requirement"
                    placeholder="Enter the purpose or requirement for this medical certificate..."
                    error={!!errors.diagnosis}
                    helperText={errors.diagnosis?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="valid_from"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Valid From"
                    minDate={dayjs().startOf('day')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.valid_from,
                        helperText: errors.valid_from?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="valid_until"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Valid Until"
                    minDate={watch('valid_from') || dayjs().startOf('day')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.valid_until,
                        helperText: errors.valid_until?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {userRole === 'DOCTOR' && (
              <Grid item xs={12}>
                <Controller
                  name="fitness_status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth required error={!!errors.fitness_status}>
                      <InputLabel>Medical Fitness Status</InputLabel>
                      <Select
                        {...field}
                        label="Medical Fitness Status"
                        value={field.value || 'physically_fit'}
                      >
                        <MenuItem value="physically_fit">Physically Fit</MenuItem>
                        <MenuItem value="physically_unfit">Physically Unfit</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            )}

            {userRole === 'DOCTOR' && fitnessStatus === 'physically_unfit' && (
              <Grid item xs={12}>
                <Controller
                  name="fitness_reason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Reason for Physically Unfit Status"
                      required
                      placeholder="Provide clinical justification for determining 'Physically Unfit' status..."
                      error={!!errors.fitness_reason}
                      helperText={errors.fitness_reason?.message}
                    />
                  )}
                />
              </Grid>
            )}

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
                    label="Additional Remarks / Recommendations"
                    placeholder="Additional medical recommendations or restrictions..."
                    error={!!errors.additional_notes}
                    helperText={errors.additional_notes?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={onCancel} variant="outlined">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  {certificate ? 'Update Assessment' : 'Create Certificate'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </LocalizationProvider>
  );
};

export default MedicalCertificateForm;
