import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { medicalCertificateService } from '../services/api';
import MedicalCertificateList from '../components/MedicalCertificates/MedicalCertificateList';
import MedicalCertificateForm from '../components/MedicalCertificates/MedicalCertificateForm';
import MedicalCertificateDetail from '../components/MedicalCertificates/MedicalCertificateDetail';

const MedicalCertificatesPage = () => {
  const [mode, setMode] = useState('list'); // list, create, edit, view
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector(state => state.auth.user);

  const handleCreate = () => {
    console.log('Create button clicked'); // Debug log
    setMode('create');
    setSelectedCertificate(null);
    setFormOpen(true);
  };

  const handleEdit = (certificate) => {
    setMode('edit');
    setSelectedCertificate(certificate);
    setFormOpen(true);
  };

  const handleView = (certificate) => {
    setMode('view');
    setSelectedCertificate(certificate);
  };

  const handleBack = () => {
    setMode('list');
    setSelectedCertificate(null);
    setFormOpen(false);
  };

  const handleClose = () => {
    setFormOpen(false);
    if (mode === 'view') {
      setMode('list');
      setSelectedCertificate(null);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (mode === 'create') {
        await medicalCertificateService.create(formData);
        setSuccess('Medical certificate created successfully');
      } else {
        await medicalCertificateService.update(selectedCertificate.id, formData);
        setSuccess('Medical certificate updated successfully');
      }
      handleBack();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save medical certificate');
    }
  };

  const handleDelete = async (certificate) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) {
      return;
    }

    try {
      await medicalCertificateService.delete(certificate.id);
      setSuccess('Medical certificate deleted successfully');
      handleBack();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete medical certificate');
    }
  };

  const handleWorkflowAction = async (action, certificate) => {
    try {
      await medicalCertificateService[action](certificate.id);
      setSuccess(`Medical certificate ${action}ed successfully`);
      handleBack();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} medical certificate`);
    }
  };

  const renderContent = () => {
    if (mode === 'view' && selectedCertificate) {
      return (
        <MedicalCertificateDetail
          certificate={selectedCertificate}
          onBack={handleBack}
          onEdit={() => handleEdit(selectedCertificate)}
          onSubmit={() => handleWorkflowAction('submit', selectedCertificate)}
          onApprove={() => handleWorkflowAction('approve', selectedCertificate)}
          onReject={() => handleWorkflowAction('reject', selectedCertificate)}
          userRole={user?.role}
        />
      );
    }

    return (
      <>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Medical Certificates
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            New Certificate
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <MedicalCertificateList
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          userRole={user?.role}
        />

        <Dialog
          fullScreen={fullScreen}
          open={formOpen}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              {mode === 'create' ? 'Create Medical Certificate' : 'Edit Medical Certificate'}
              <IconButton onClick={handleClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <MedicalCertificateForm
              certificate={selectedCertificate}
              onSubmit={handleSubmit}
              onCancel={handleClose}
              userRole={user?.role}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  };

  return <Box sx={{ p: 3 }}>{renderContent()}</Box>;
};

export default MedicalCertificatesPage; 