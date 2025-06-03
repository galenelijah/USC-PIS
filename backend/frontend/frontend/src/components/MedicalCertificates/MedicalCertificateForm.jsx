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
import { medicalCertificateService } from '../../services/api';
import { patientService } from '../../services/api';

const MedicalCertificateForm = ({ certificate = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    patient: '',
    template: '',
    diagnosis: '',
    recommendations: '',
    valid_from: null,
    valid_until: null,
    additional_notes: '',
  });
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFormData();
    if (certificate) {
      setFormData({
        patient: certificate.patient,
        template: certificate.template,
        diagnosis: certificate.diagnosis,
        recommendations: certificate.recommendations,
        valid_from: new Date(certificate.valid_from),
        valid_until: new Date(certificate.valid_until),
        additional_notes: certificate.additional_notes || '',
      });
    }
  }, [certificate]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const [patientsResponse, templatesResponse] = await Promise.all([
        patientService.getAll(),
        medicalCertificateService.getAllTemplates()
      ]);
      setPatients(Array.isArray(patientsResponse.data) ? patientsResponse.data : []);
      setTemplates(Array.isArray(templatesResponse.data) ? templatesResponse.data : []);
      setError(null);
    } catch (err) {
      setError('Failed to load form data');
      console.error('Error loading form data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name) => (date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.patient || !formData.template || !formData.diagnosis || !formData.valid_from || !formData.valid_until) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      await onSubmit(formData);
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
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Patient</InputLabel>
              <Select
                name="patient"
                value={formData.patient}
                onChange={handleChange}
                label="Patient"
                required
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                name="template"
                value={formData.template}
                onChange={handleChange}
                label="Template"
                required
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              name="diagnosis"
              label="Diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              name="recommendations"
              label="Recommendations"
              value={formData.recommendations}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Valid From"
              value={formData.valid_from}
              onChange={handleDateChange('valid_from')}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Valid Until"
              value={formData.valid_until}
              onChange={handleDateChange('valid_until')}
              slotProps={{ textField: { fullWidth: true, required: true } }}
              minDate={formData.valid_from}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              name="additional_notes"
              label="Additional Notes"
              value={formData.additional_notes}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={onCancel} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
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