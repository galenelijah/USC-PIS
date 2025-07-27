import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  useTheme,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const ImageUpload = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 5, 
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  disabled = false
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    
    return null;
  };

  const processFile = (file) => {
    return new Promise((resolve, reject) => {
      const validationError = validateFile(file);
      if (validationError) {
        reject(new Error(validationError));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target.result,
          file: file
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files) => {
    if (disabled) return;
    
    setError('');
    setUploading(true);

    try {
      const fileArray = Array.from(files);
      
      if (images.length + fileArray.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed. Currently have ${images.length}.`);
        setUploading(false);
        return;
      }

      const processedFiles = await Promise.all(
        fileArray.map(file => processFile(file))
      );

      const newImages = [...images, ...processedFiles];
      onImagesChange(newImages);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (imageId) => {
    const newImages = images.filter(img => img.id !== imageId);
    onImagesChange(newImages);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        elevation={dragOver ? 4 : 1}
        sx={{
          p: 3,
          border: `2px dashed ${dragOver ? theme.palette.primary.main : '#ccc'}`,
          backgroundColor: dragOver ? 'action.hover' : 'background.paper',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: disabled ? '#ccc' : theme.palette.primary.main,
            backgroundColor: disabled ? 'background.paper' : 'action.hover',
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          style={{ display: 'none' }}
          onChange={handleFileInput}
          disabled={disabled}
        />
        
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {dragOver ? 'Drop images here' : 'Upload Images'}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Drag and drop images here, or click to select files
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supports: {acceptedTypes.map(type => type.split('/')[1]).join(', ')} • 
          Max size: {maxSizeMB}MB each • 
          Max files: {maxImages}
        </Typography>
        
        {!disabled && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose Files
            </Button>
          </Box>
        )}
      </Paper>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Processing images...
          </Typography>
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Images ({images.length}/{maxImages})
          </Typography>
          <Grid container spacing={2}>
            {images.map((image) => (
              <Grid item xs={12} sm={6} md={4} key={image.id}>
                <Paper
                  elevation={2}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 2,
                  }}
                >
                  <Box
                    component="img"
                    src={image.url}
                    alt={image.name}
                    sx={{
                      width: '100%',
                      height: 150,
                      objectFit: 'cover',
                    }}
                  />
                  
                  {/* Image Info Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      color: 'white',
                      p: 1,
                    }}
                  >
                    <Typography variant="caption" noWrap>
                      {image.name}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {formatFileSize(image.size)}
                    </Typography>
                  </Box>

                  {/* Delete Button */}
                  {!disabled && (
                    <IconButton
                      size="small"
                      onClick={() => removeImage(image.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.8)',
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ImageUpload;