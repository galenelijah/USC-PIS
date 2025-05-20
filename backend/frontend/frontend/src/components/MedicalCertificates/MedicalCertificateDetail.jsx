import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import { format } from 'date-fns';

const statusColors = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const MedicalCertificateDetail = ({ 
  certificate, 
  onApprove, 
  onReject, 
  onSubmit, 
  onEdit, 
  onBack,
  userRole 
}) => {
  const canApproveReject = userRole === 'DOCTOR' || userRole === 'ADMIN';
  const canEdit = certificate.status === 'draft';
  const canSubmit = certificate.status === 'draft';

  const renderActions = () => {
    return (
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button onClick={onBack} color="inherit">
          Back
        </Button>
        {canEdit && (
          <Button onClick={onEdit} color="primary">
            Edit
          </Button>
        )}
        {canSubmit && (
          <Button onClick={onSubmit} color="primary" variant="contained">
            Submit for Approval
          </Button>
        )}
        {canApproveReject && certificate.status === 'pending' && (
          <>
            <Button onClick={onReject} color="error" variant="outlined">
              Reject
            </Button>
            <Button onClick={onApprove} color="success" variant="contained">
              Approve
            </Button>
          </>
        )}
      </Stack>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="h2">
              Medical Certificate
            </Typography>
            <Chip
              label={certificate.status_display}
              color={statusColors[certificate.status]}
            />
          </Stack>
          <Divider sx={{ my: 2 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Patient Name
          </Typography>
          <Typography variant="body1">
            {certificate.patient_details?.first_name} {certificate.patient_details?.last_name}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Template
          </Typography>
          <Typography variant="body1">
            {certificate.template_name}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary">
            Diagnosis
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {certificate.diagnosis}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary">
            Recommendations
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {certificate.recommendations}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Valid From
          </Typography>
          <Typography variant="body1">
            {format(new Date(certificate.valid_from), 'MMMM d, yyyy')}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Valid Until
          </Typography>
          <Typography variant="body1">
            {format(new Date(certificate.valid_until), 'MMMM d, yyyy')}
          </Typography>
        </Grid>

        {certificate.additional_notes && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Additional Notes
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {certificate.additional_notes}
            </Typography>
          </Grid>
        )}

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary">
            Certificate Details
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                Issued by: {certificate.issued_by_name}
              </Typography>
              <Typography variant="body2">
                Issued at: {certificate.issued_at && format(new Date(certificate.issued_at), 'MMM d, yyyy h:mm a')}
              </Typography>
            </Grid>
            {certificate.approved_by && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  {certificate.status === 'approved' ? 'Approved' : 'Rejected'} by: {certificate.approved_by_name}
                </Typography>
                <Typography variant="body2">
                  {certificate.status === 'approved' ? 'Approved' : 'Rejected'} at: {format(new Date(certificate.approved_at), 'MMM d, yyyy h:mm a')}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Grid>

        <Grid item xs={12}>
          {renderActions()}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MedicalCertificateDetail; 