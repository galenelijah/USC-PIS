import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  CircularProgress,
  Box,
  Grid,
  MenuItem
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { consultationService, patientService } from '../services/api';

const ConsultationFormModal = ({ open, onClose, consultationData, onSave }) => {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      patient: '', // Patient ID
      date_time: '',
      chief_complaints: '',
      treatment_plan: '',
      remarks: '',
    },
  });

  const isEditMode = Boolean(consultationData && consultationData.id);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPatientsLoading(true);
      patientService.getAll()
        .then((response) => {
          if (response && response.data && Array.isArray(response.data)) {
            setPatients(response.data);
          } else {
            setPatients([]);
          }
        })
        .catch(() => setPatients([]))
        .finally(() => setPatientsLoading(false));
    }
  }, [open]);

  useEffect(() => {
    if (isEditMode && consultationData) {
      setValue('patient', consultationData.patient || '');
      // Format date_time for datetime-local input
      const formattedDateTime = consultationData.date_time
        ? new Date(new Date(consultationData.date_time).getTime() - new Date(consultationData.date_time).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        : '';
      setValue('date_time', formattedDateTime);
      setValue('chief_complaints', consultationData.chief_complaints || '');
      setValue('treatment_plan', consultationData.treatment_plan || '');
      setValue('remarks', consultationData.remarks || '');
    } else {
      reset(); // Reset to default values for add mode
    }
  }, [consultationData, isEditMode, setValue, reset]);

  const onSubmitForm = async (data) => {
    try {
      const payload = {
        ...data,
        // Ensure patient is an integer if it's an ID
        patient: parseInt(data.patient, 10) || null,
      };

      if (isEditMode) {
        await consultationService.update(consultationData.id, payload);
      } else {
        await consultationService.create(payload);
      }
      onSave(); // This will trigger a refresh and close the modal in the parent
    } catch (error) {
      console.error('Error saving consultation:', error);
      alert(
        `Failed to save consultation: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Edit Consultation' : 'Add New Consultation'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmitForm)} noValidate>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="patient"
                control={control}
                rules={{ required: 'Patient is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Patient"
                    fullWidth
                    margin="dense"
                    error={!!errors.patient}
                    helperText={errors.patient?.message}
                    disabled={isEditMode || patientsLoading}
                  >
                    {patientsLoading ? (
                      <MenuItem value="" disabled>Loading patients...</MenuItem>
                    ) : patients.length === 0 ? (
                      <MenuItem value="" disabled>No patients found</MenuItem>
                    ) : (
                      patients.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} (ID: {p.id})
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="date_time"
                control={control}
                rules={{ required: 'Date and Time are required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Date and Time"
                    type="datetime-local"
                    fullWidth
                    margin="dense"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!errors.date_time}
                    helperText={errors.date_time?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="chief_complaints"
                control={control}
                rules={{ required: 'Chief Complaints are required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Chief Complaints"
                    fullWidth
                    multiline
                    rows={3}
                    margin="dense"
                    error={!!errors.chief_complaints}
                    helperText={errors.chief_complaints?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="treatment_plan"
                control={control}
                rules={{ required: 'Treatment Plan is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Treatment Plan"
                    fullWidth
                    multiline
                    rows={3}
                    margin="dense"
                    error={!!errors.treatment_plan}
                    helperText={errors.treatment_plan?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Remarks/Results (Optional)"
                    fullWidth
                    multiline
                    rows={3}
                    margin="dense"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={onClose} color="secondary" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : (isEditMode ? 'Save Changes' : 'Add Consultation')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConsultationFormModal; 