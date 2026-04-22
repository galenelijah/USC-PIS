import React, { useState, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon
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

const PatientDocumentUpload = ({ 
  open, 
  onClose, 
  patientId, 
  patientName, 
  medicalRecordId = null,
  dentalRecordId = null,
  onUploadSuccess 
}) => {
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('CONSULTATION');
  const [otherType, setOtherType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 10MB limit.`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    setError(null);
  };

  const handleFileChange = (event) => {
    if (event.target.files) {
      handleFiles(event.target.files);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload each file sequentially (or in parallel)
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient', patientId);
        formData.append('document_type', documentType);
        formData.append('description', description);
        
        if (medicalRecordId) formData.append('medical_record', medicalRecordId);
        if (dentalRecordId) formData.append('dental_record', dentalRecordId);
        
        if (documentType === 'OTHER' && otherType) {
          formData.append('other_type', otherType);
        }
        
        return patientDocumentService.uploadDocument(formData);
      });

      await Promise.all(uploadPromises);
      
      // Reset form
      setFiles([]);
      setDescription('');
      setDocumentType('CONSULTATION');
      setOtherType('');
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {medicalRecordId || dentalRecordId ? 'Attach Documents to Visit' : `Upload Document for ${patientName}`}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          
          <Box
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : '#ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragging ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', borderColor: 'primary.main' }
            }}
            onClick={() => document.getElementById('file-upload-input').click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <input
              type="file"
              id="file-upload-input"
              hidden
              multiple
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <UploadIcon sx={{ fontSize: 40, color: isDragging ? 'primary.main' : 'text.secondary', mb: 1 }} />
            <Typography variant="body1">Click to select or drag and drop files</Typography>
            <Typography variant="caption" color="text.secondary">
              Accepted: PDF, Images, DOC (Max 10MB each)
            </Typography>
          </Box>

          {files.length > 0 && (
            <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
              <List size="small" dense>
                {files.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <FileIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={file.name} 
                      secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" size="small" onClick={() => removeFile(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

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
            label="Description (applied to all files)"
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a brief description of the documents"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={files.length === 0 || loading || (documentType === 'OTHER' && !otherType)}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
        >
          {loading ? `Uploading ${files.length} file(s)...` : 'Upload All'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatientDocumentUpload;
