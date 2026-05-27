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
  Alert,
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { medicalCertificateService } from '../../services/api';
import axios from 'axios';

const issuanceStatusColors = {
  draft: 'default',
  pending: 'warning',
  issued: 'success',
  rejected: 'error',
};

const fitnessStatusColors = {
  physically_fit: 'success',
  physically_unfit: 'error',
};

const MedicalCertificateDetail = ({ 
  certificate, 
  onIssue, 
  onReject, 
  onSubmit, 
  onEdit, 
  onBack,
  userRole 
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState(null);

  const canApproveReject = userRole === 'DOCTOR';
  const isStudent = userRole === 'STUDENT' || userRole === 'FACULTY';
  
  // Medical professionals can always edit for fitness status changes
  // Only restrict editing completely issued certificates to avoid confusion
  const canEdit = (
    certificate.issuance_status === 'draft' || 
    (
      (userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'NURSE') && 
      certificate.issuance_status !== 'issued' &&
      certificate.issuance_status !== 'rejected'
    )
  );
  
  const canSubmit = certificate.issuance_status === 'draft';
  const canPrint = certificate.issuance_status === 'issued' && !isStudent;
  const showStudentBanner = certificate.issuance_status === 'issued' && isStudent;

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
            variant={certificate.issuance_status === 'draft' ? 'contained' : 'outlined'}
            title={certificate.issuance_status === 'draft' ? 'Edit Certificate' : 'Update Medical Assessment'}
          >
            {certificate.issuance_status === 'draft' ? 'Edit Certificate' : 'Update Medical Assessment'}
          </Button>
        )}
        {canSubmit && (
          <Button onClick={onSubmit} color="primary" variant="contained">
            Submit for Issuance
          </Button>
        )}
        {canApproveReject && certificate.issuance_status === 'pending' && (
          <>
            <Button onClick={onReject} color="error" variant="outlined">
              Reject
            </Button>
            {userRole === 'DOCTOR' && (
              <Button onClick={onIssue} color="success" variant="contained">
                Issue Certificate
              </Button>
            )}
          </>
        )}
        {canPrint && (
          <Button
            onClick={handleDownloadPdf}
            color="primary"
            variant="outlined"
            startIcon={<DownloadIcon />}
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
                  label={certificate.fitness_status_display}
                  color={fitnessStatusColors[certificate.fitness_status]}
                  variant={certificate.fitness_status === 'physically_unfit' ? 'filled' : 'outlined'}
                />
                <Chip
                  label={certificate.issuance_status_display}
                  color={issuanceStatusColors[certificate.issuance_status]}
                />
              </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {showStudentBanner && (
            <Grid item xs={12}>
              <Alert 
                severity="success" 
                icon={<VerifiedIcon fontSize="large" />}
                sx={{ 
                  mb: 3, 
                  py: 2,
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  Medical Certificate is ready to be claimed
                </Typography>
                <Typography variant="body1">
                  Your medical certificate has been officially issued by the University Physician. 
                  Please visit the clinic to claim your physical copy.
                </Typography>
              </Alert>
            </Grid>
          )}

          {certificate.issuance_status === 'rejected' && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Certificate Rejected
                </Typography>
                <Typography variant="body2">
                  This record has been rejected and is now permanently locked for auditing purposes. 
                  Please create a new certificate if necessary.
                </Typography>
              </Alert>
            </Grid>
          )}

          {canEdit && certificate.issuance_status !== 'draft' && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Medical Assessment Can Be Updated
                </Typography>
                <Typography variant="body2">
                  As a medical professional, you can still update the fitness status and medical details 
                  until the certificate is officially issued.
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

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Purpose/Requirement
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {certificate.diagnosis || 'No purpose/requirement recorded'}
            </Typography>
          </Grid>

          {certificate.additional_notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Remarks / Recommendations
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {certificate.additional_notes}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Valid From
            </Typography>
            <Typography variant="body1">
              {certificate.valid_from ? format(new Date(certificate.valid_from), 'MMMM d, yyyy') : 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Valid Until
            </Typography>
            <Typography variant="body1">
              {certificate.valid_until ? format(new Date(certificate.valid_until), 'MMMM d, yyyy') : 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Fitness Status
            </Typography>
            <Chip
              label={certificate.fitness_status_display}
              color={fitnessStatusColors[certificate.fitness_status]}
              variant={certificate.fitness_status === 'physically_unfit' ? 'filled' : 'outlined'}
              size="small"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Issuance Status
            </Typography>
            <Chip
              label={certificate.issuance_status_display}
              color={issuanceStatusColors[certificate.issuance_status]}
              size="small"
            />
          </Grid>

          {certificate.fitness_reason && certificate.fitness_status === 'physically_unfit' && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold' }}>
                Reason for Physically Unfit Status
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 235, 235, 0.1)', border: '1px solid rgba(211, 47, 47, 0.2)' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {certificate.fitness_reason}
                </Typography>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Auditing Details
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  Created by: {certificate.created_by_name}
                </Typography>
                <Typography variant="body2">
                  Created at: {certificate.created_at && format(new Date(certificate.created_at), 'MMM d, yyyy h:mm a')}
                </Typography>
                {certificate.submitted_at && (
                  <Typography variant="body2">
                    Submitted for review at: {format(new Date(certificate.submitted_at), 'MMM d, yyyy h:mm a')}
                  </Typography>
                )}
              </Grid>
              {certificate.issuing_doctor && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {certificate.issuance_status === 'issued' ? 'Issued' : 'Rejected'} by DOCTOR: {certificate.issuing_doctor_name}
                  </Typography>
                  <Typography variant="body2">
                    {certificate.issuance_status === 'issued' ? 'Issued' : 'Rejected'} at: {certificate.issued_at && format(new Date(certificate.issued_at), 'MMM d, yyyy h:mm a')}
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
