import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  CircularProgress,
  Alert,
  Link as MuiLink, // Alias Link to avoid conflict with react-router-dom Link
  Divider,
  Tooltip
} from '@mui/material';
import { 
  UploadFile as UploadFileIcon, 
  Delete as DeleteIcon, 
  Description as DescriptionIcon, 
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { fileUploadService } from '../services/api'; // Adjust path as necessary
import FileViewer from '../components/FileViewer';
import InfoTooltip from '../components/utils/InfoTooltip';

const FileUploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  
  // State for file viewer dialog
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);

  // Fetch existing files on component mount
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fileUploadService.getAll();
      setUploadedFiles(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError('Failed to load uploaded files.');
      setUploadedFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setUploadSuccess(null); // Reset success message on new file selection
      setError(null); // Reset error message
    } else {
      setSelectedFile(null);
    }
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    setUploading(true);
    setError(null);
    setUploadSuccess(null);
    try {
      await fileUploadService.upload(selectedFile, description);
      setUploadSuccess(`File '${selectedFile.name}' uploaded successfully!`);
      setSelectedFile(null);
      setDescription('');
      document.getElementById('file-input').value = null; // Reset file input
      await fetchFiles(); // Refresh the list of files
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(err.response?.data?.detail || err.message || 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete the file "${filename}"?`)) {
      return;
    }
    setError(null); // Clear previous errors
    try {
      await fileUploadService.delete(id);
      await fetchFiles(); // Refresh the list
    } catch (err) {
        console.error("Error deleting file:", err);
        setError(err.response?.data?.detail || err.message || 'Failed to delete file.');
    }
  };

  // Handle download of a file
  const handleDownload = (file) => {
    if (!file || !file.file) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = file.file;
    link.download = file.original_filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open file viewer for preview
  const handlePreview = (file) => {
    setCurrentFile(file);
    setViewerOpen(true);
  };

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }} elevation={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" gutterBottom>File Uploads</Typography>
        <InfoTooltip title="Select a file and optional description, then upload. Preview, download, or delete from the list." />
      </Box>
      
      {/* Upload Form */}
      <Box component="form" noValidate autoComplete="off" sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Upload New File</Typography>
        <TextField
          type="file"
          id="file-input" // ID to reset the input
          onChange={handleFileChange}
          fullWidth
          sx={{ mb: 2 }}
          InputLabelProps={{
            shrink: true,
          }}
          label="Select File"
          variant="outlined"
        />
        <TextField
          label="Description (Optional)"
          value={description}
          onChange={handleDescriptionChange}
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />}
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
        {uploadSuccess && <Alert severity="success" sx={{ mt: 2 }}>{uploadSuccess}</Alert>}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Uploaded Files List */}
      <Typography variant="h6" gutterBottom>Uploaded Files</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {uploadedFiles.length === 0 && !error && (
            <ListItem>
              <ListItemText primary="No files uploaded yet." />
            </ListItem>
          )}
          {uploadedFiles.map((file) => (
            <ListItem 
              key={file.id} 
              divider
              secondaryAction={
                <Box>
                  <Tooltip title="Preview File">
                    <IconButton
                      edge="end"
                      aria-label="preview"
                      onClick={() => handlePreview(file)}
                      sx={{ mr: 1 }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download File">
                    <IconButton
                      edge="end"
                      aria-label="download"
                      onClick={() => handleDownload(file)}
                      sx={{ mr: 1 }}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete File">
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      onClick={() => handleDelete(file.id, file.original_filename)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText
                primary={file.original_filename}
                secondary={
                  <React.Fragment>
                     <Typography component="span" variant="body2" color="text.primary">
                        {file.description || 'No description'}
                    </Typography>
                    <br />
                    {`Uploaded by: ${file.uploaded_by_email || 'Unknown'} on ${new Date(file.upload_date).toLocaleDateString()} | Size: ${formatFileSize(file.file_size || 0)} | Type: ${file.content_type}`}
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* File Viewer Dialog */}
      <FileViewer 
        file={currentFile}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </Paper>
  );
};

export default FileUploadPage; 
