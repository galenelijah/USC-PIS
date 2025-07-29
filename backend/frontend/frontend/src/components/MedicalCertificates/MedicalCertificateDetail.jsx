import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Stack,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { medicalCertificateService } from '../../services/api';
import axios from 'axios';

const approvalStatusColors = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const fitnessStatusColors = {
  fit: 'success',
  not_fit: 'error',
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState(null);

  const canApproveReject = userRole === 'DOCTOR' || userRole === 'ADMIN';
  
  // Medical professionals can always edit for fitness status changes
  // Only restrict editing completely approved certificates to avoid confusion
  const canEdit = (
    certificate.approval_status === 'draft' || 
    (
      (userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'NURSE') && 
      certificate.approval_status !== 'approved'
    )
  );
  
  const canSubmit = certificate.approval_status === 'draft';
  const canPrint = certificate.approval_status === 'approved';

  const handlePreview = async () => {
    try {
      const response = await medicalCertificateService.renderCertificate(certificate.id);
      setPreviewHtml(response.data.html);
      setPreviewOpen(true);
      setError(null);
    } catch (err) {
      setError('Failed to generate certificate preview');
      console.error('Error generating preview:', err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(previewHtml);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await axios.get(
        `/api/medical-certificates/certificates/${certificate.id}/render_pdf/`,
        {
          responseType: 'blob',
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medical_certificate_${certificate.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  const renderActions = () => {
    return (
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button onClick={onBack} color="inherit">
          Back
        </Button>
        {canEdit && (
          <Button 
            onClick={onEdit} 
            color="primary"
            variant={certificate.approval_status === 'draft' ? 'contained' : 'outlined'}
            title={certificate.approval_status === 'draft' ? 'Edit Certificate' : 'Edit Fitness Status & Medical Details'}
          >
            {certificate.approval_status === 'draft' ? 'Edit Certificate' : 'Update Medical Assessment'}
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
        {canPrint && (
          <Button
            onClick={handleDownloadPdf}
            color="primary"
            variant="outlined"
            startIcon={<PrintIcon />}
          >
            Download PDF
          </Button>
        )}
      </Stack>
    );
  };

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" component="h2">
                Medical Certificate
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={certificate.fitness_status === 'fit' ? 'Fit' : 'Not Fit'}
                  color={fitnessStatusColors[certificate.fitness_status]}
                  variant={certificate.fitness_status === 'not_fit' ? 'filled' : 'outlined'}
                />
                <Chip
                  label={certificate.approval_status_display || certificate.approval_status?.replace('_', ' ')}
                  color={approvalStatusColors[certificate.approval_status]}
                />
              </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Show edit info for non-draft certificates */}
          {canEdit && certificate.approval_status !== 'draft' && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Medical Assessment Can Be Updated
                </Typography>
                <Typography variant="body2">
                  As a medical professional, you can still update the fitness status and medical details 
                  even after the certificate has been submitted for approval.
                </Typography>
              </Alert>
            </Grid>
          )}

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

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Fitness Status
            </Typography>
            <Chip
              label={certificate.fitness_status === 'fit' ? 'Fit' : 'Not Fit'}
              color={fitnessStatusColors[certificate.fitness_status]}
              variant={certificate.fitness_status === 'not_fit' ? 'filled' : 'outlined'}
              size="small"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Approval Status
            </Typography>
            <Chip
              label={certificate.approval_status_display || certificate.approval_status?.replace('_', ' ')}
              color={approvalStatusColors[certificate.approval_status]}
              size="small"
            />
          </Grid>

          {certificate.fitness_reason && certificate.fitness_status === 'not_fit' && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold' }}>
                Reason for Not Fit Status
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 235, 235, 0.1)', border: '1px solid rgba(211, 47, 47, 0.2)' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {certificate.fitness_reason}
                </Typography>
              </Paper>
            </Grid>
          )}

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

      {error && (
        <Box sx={{ mt: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
    </>
  );
};

export default MedicalCertificateDetail; 