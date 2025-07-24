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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { medicalCertificateSchema } from '../../utils/validationSchemas';
import { medicalCertificateService } from '../../services/api';
import { patientService } from '../../services/api';

const MedicalCertificateForm = ({ certificate = null, onSubmit, onCancel }) => {
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: yupResolver(medicalCertificateSchema),
    defaultValues: {
      patient: '',
      template: '',
      diagnosis: '',
      recommendations: '',
      valid_from: null,
      valid_until: null,
      additional_notes: '',
    }
  });

  useEffect(() => {
    fetchFormData();
    if (certificate) {
      reset({
        patient: certificate.patient,
        template: certificate.template,
        diagnosis: certificate.diagnosis,
        recommendations: certificate.recommendations,
        valid_from: new Date(certificate.valid_from),
        valid_until: new Date(certificate.valid_until),
        additional_notes: certificate.additional_notes || '',
      });
    }
  }, [certificate, reset]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const [patientsRes, templatesRes] = await Promise.all([
        patientService.getAll(),
        medicalCertificateService.getTemplates(),
      ]);
      setPatients(patientsRes.data || []);
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

          {/* Patient Selection */}
          <Grid item xs={12} md={6}>
            <Controller
              name="patient"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.patient}>
                  <InputLabel>Patient *</InputLabel>
                  <Select
                    {...field}
                    label="Patient *"
                    value={field.value || ''}
                  >
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.id_number}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.patient && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.patient.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
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