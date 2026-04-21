import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Description as FileIcon
} from '@mui/icons-material';
import { patientDocumentService } from '../services/api';

const DOCUMENT_TYPES = [
  { value: 'CONSULTATION', label: 'Scanned Consultation' },
  { value: 'MEDICAL_RECORD', label: 'Medical Record' },
  { value: 'DENTAL_RECORD', label: 'Dental Record' },
  { value: 'LAB_RESULT', label: 'Laboratory Result' },
  { value: 'PRESCRIPTION', label: 'Prescription' },
  { value: 'XRAY', label: 'X-Ray' },
  { value: 'OTHER', label: 'Other' },
];

const PatientDocumentUpload = ({ open, onClose, patientId, patientName, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('CONSULTATION');
  const [otherType, setOtherType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size exceeds 10MB limit.');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient', patientId);
      formData.append('document_type', documentType);
      formData.append('description', description);
      
      if (documentType === 'OTHER' && otherType) {
        formData.append('other_type', otherType);
      }

      await patientDocumentService.uploadDocument(formData);
      
      // Reset form
      setFile(null);
      setDescription('');
      setDocumentType('CONSULTATION');
      setOtherType('');
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Upload Document for {patientName}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', borderColor: 'primary.main' },
              bgcolor: file ? 'rgba(46, 125, 50, 0.05)' : 'transparent'
            }}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input
              type="file"
              id="file-upload-input"
              hidden
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            {file ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <FileIcon color="success" />
                <Typography variant="body1" fontWeight="medium">{file.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </Box>
            ) : (
              <Box>
                <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1">Click to select or drag and drop</Typography>
                <Typography variant="caption" color="text.secondary">
                  Accepted: PDF, Images, DOC (Max 10MB)
                </Typography>
              </Box>
            )}
          </Box>

          <FormControl fullWidth size="small">
            <InputLabel>Document Type</InputLabel>
            <Select
              value={documentType}
              label="Document Type"
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {documentType === 'OTHER' && (
            <TextField
              fullWidth
              label="Specify Document Type"
              size="small"
              value={otherType}
              onChange={(e) => setOtherType(e.target.value)}
              placeholder="e.g., Vaccination Card, Referral Form"
              required
            />
          )}

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a brief description of the document"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!file || loading || (documentType === 'OTHER' && !otherType)}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
        >
          {loading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatientDocumentUpload;
