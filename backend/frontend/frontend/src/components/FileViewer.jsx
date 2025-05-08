import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

// List of file extensions and their corresponding MIME types for preview
const previewableTypes = {
  // Images
  'jpg': 'image',
  'jpeg': 'image',
  'png': 'image',
  'gif': 'image',
  'svg': 'image',
  'webp': 'image',
  // PDFs
  'pdf': 'application/pdf',
  // Text files
  'txt': 'text',
  'csv': 'text',
  'md': 'text',
  'json': 'text',
  // Audio
  'mp3': 'audio',
  'wav': 'audio',
  'ogg': 'audio',
  // Video
  'mp4': 'video',
  'webm': 'video',
  'mov': 'video',
};

const FileViewer = ({ file, open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to determine if file is previewable
  const isPreviewable = () => {
    if (!file || !file.content_type) return false;
    
    // Get file extension from filename or URL
    const extension = file.original_filename?.split('.').pop().toLowerCase();
    
    return extension && previewableTypes[extension] 
        || file.content_type.startsWith('image/')
        || file.content_type.startsWith('text/')
        || file.content_type === 'application/pdf'
        || file.content_type.startsWith('audio/')
        || file.content_type.startsWith('video/');
  };
  
  // Handle download
  const handleDownload = () => {
    if (!file?.file) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = file.file;
    link.download = file.original_filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle content loading events
  const handleContentLoaded = () => {
    setLoading(false);
  };

  const handleContentError = (err) => {
    setLoading(false);
    setError('Failed to load preview. Please download the file instead.');
    console.error('Error loading file preview:', err);
  };

  // Render preview based on file type
  const renderPreview = () => {
    if (!file) return null;
    
    const extension = file.original_filename?.split('.').pop().toLowerCase();
    const fileType = previewableTypes[extension] || file.content_type?.split('/')[0];
    
    switch (fileType) {
      case 'image':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', overflow: 'auto', maxHeight: '70vh' }}>
            <img 
              src={file.file} 
              alt={file.original_filename} 
              style={{ maxWidth: '100%', objectFit: 'contain' }} 
              onLoad={handleContentLoaded}
              onError={handleContentError}
            />
          </Box>
        );
      
      case 'application/pdf':
        return (
          <Box sx={{ height: '70vh', width: '100%' }}>
            <iframe 
              src={file.file} 
              width="100%" 
              height="100%" 
              title={file.original_filename}
              frameBorder="0"
              onLoad={handleContentLoaded}
              onError={handleContentError}
            />
          </Box>
        );
      
      case 'text':
        // For text files, we'll use an iframe with text rendering
        return (
          <Box sx={{ height: '70vh', width: '100%', overflow: 'auto' }}>
            <iframe 
              src={file.file} 
              width="100%" 
              height="100%" 
              title={file.original_filename}
              frameBorder="0"
              onLoad={handleContentLoaded}
              onError={handleContentError}
            />
          </Box>
        );
      
      case 'audio':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <audio 
              controls 
              src={file.file}
              onLoadedData={handleContentLoaded}
              onError={handleContentError}
              style={{ width: '100%' }}
            >
              Your browser does not support audio playback.
            </audio>
          </Box>
        );
      
      case 'video':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', overflow: 'hidden', maxHeight: '70vh' }}>
            <video 
              controls 
              src={file.file}
              onLoadedData={handleContentLoaded}
              onError={handleContentError}
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            >
              Your browser does not support video playback.
            </video>
          </Box>
        );
      
      default:
        // For non-previewable files, show a message
        setLoading(false);
        return (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              Preview not available for this file type.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 2 }}
            >
              Download File
            </Button>
          </Box>
        );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" noWrap sx={{ maxWidth: '80%' }}>
          {file?.original_filename || 'File Preview'}
        </Typography>
        <Box>
          <IconButton onClick={handleDownload} title="Download File">
            <DownloadIcon />
          </IconButton>
          <IconButton 
            onClick={() => window.open(file?.file, '_blank')}
            title="Open in New Tab"
          >
            <OpenInNewIcon />
          </IconButton>
          <IconButton onClick={onClose} title="Close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%'
          }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 2 }}
            >
              Download File
            </Button>
          </Box>
        )}
        
        {isPreviewable() ? renderPreview() : (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              Preview not available for this file type ({file?.content_type}).
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 2 }}
            >
              Download File
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Type: {file?.content_type} | Size: {formatFileSize(file?.file_size || 0)}
          </Typography>
        </Box>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileViewer; 