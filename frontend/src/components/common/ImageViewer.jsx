import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Zoom,
  useTheme,
  useMediaQuery,
  CardMedia,
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';

const ImageViewer = ({ 
  open, 
  onClose, 
  images = [], 
  currentIndex = 0, 
  title = '',
  allowDownload = true 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageIndex, setImageIndex] = useState(currentIndex);

  const currentImage = images[imageIndex];

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
  };

  const handleNext = () => {
    if (imageIndex < images.length - 1) {
      setImageIndex(prev => prev + 1);
      setZoomLevel(1);
    }
  };

  const handlePrev = () => {
    if (imageIndex > 0) {
      setImageIndex(prev => prev - 1);
      setZoomLevel(1);
    }
  };

  const handleDownload = () => {
    if (currentImage?.url) {
      const link = document.createElement('a');
      link.href = currentImage.url;
      link.download = currentImage.name || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    setZoomLevel(1);
    setImageIndex(currentIndex);
    onClose();
  };

  if (!open || !currentImage) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          color: 'white',
          minHeight: isMobile ? '100vh' : '80vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white'
      }}>
        <Typography variant="h6" component="div">
          {title || currentImage.name || 'Image Viewer'}
          {images.length > 1 && (
            <Typography variant="caption" sx={{ ml: 2, opacity: 0.7 }}>
              ({imageIndex + 1} of {images.length})
            </Typography>
          )}
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'black',
        padding: 0,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <Box
            component="img"
            src={currentImage.url}
            alt={currentImage.name || 'Image'}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.2s ease-in-out',
              cursor: zoomLevel > 1 ? 'grab' : 'default',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          
          {/* Navigation arrows for multiple images */}
          {images.length > 1 && (
            <>
              {imageIndex > 0 && (
                <IconButton
                  onClick={handlePrev}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    }
                  }}
                >
                  ←
                </IconButton>
              )}
              {imageIndex < images.length - 1 && (
                <IconButton
                  onClick={handleNext}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    }
                  }}
                >
                  →
                </IconButton>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'space-between',
        padding: '8px 24px'
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 0.5} sx={{ color: 'white' }}>
            <ZoomOutIcon />
          </IconButton>
          <Button 
            onClick={handleReset} 
            variant="outlined" 
            size="small"
            sx={{ color: 'white', borderColor: 'white', minWidth: '60px' }}
          >
            {Math.round(zoomLevel * 100)}%
          </Button>
          <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 3} sx={{ color: 'white' }}>
            <ZoomInIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {allowDownload && (
            <Button
              onClick={handleDownload}
              startIcon={<DownloadIcon />}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Download
            </Button>
          )}
          <Button onClick={handleClose} variant="contained" color="primary">
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ImageViewer;