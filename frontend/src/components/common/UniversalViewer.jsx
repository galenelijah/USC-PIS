import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

/**
 * UniversalViewer handles both Images and PDFs.
 * It uses a standard <img> tag for images and an <iframe> for PDFs.
 */
const UniversalViewer = ({ 
  open, 
  onClose, 
  url, 
  title = 'File Viewer',
  filename = 'document',
  allowDownload = true 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const isPdf = url && typeof url === 'string' && /\.pdf(\?|$)/i.test(url);

  const handleDownload = () => {
    if (!url) return;
    
    let downloadUrl = url;
    // For Cloudinary URLs, force download
    if (typeof url === 'string' && url.includes('res.cloudinary.com')) {
      if (url.includes('/upload/')) {
        downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
      } else if (url.includes('/raw/upload/')) {
        downloadUrl = url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
      }
    }
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    const ext = isPdf ? 'pdf' : 'file';
    link.setAttribute('download', `${filename}.${ext}`);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!open || !url) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          backgroundColor: isPdf ? 'background.paper' : 'rgba(0, 0, 0, 0.95)',
          color: isPdf ? 'text.primary' : 'white',
          height: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1.5
      }}>
        <Typography variant="h6" component="div" noWrap sx={{ maxWidth: '80%' }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ 
        p: 0, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isPdf ? '#f5f5f5' : 'black'
      }}>
        {isPdf ? (
          <iframe
            src={`${url}#toolbar=1`}
            title={title}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        ) : (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: 1
          }}>
            <Box
              component="img"
              src={url}
              alt={title}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                boxShadow: 3
              }}
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {isPdf ? 'PDF Document' : 'Image File'}
          </Typography>
        </Box>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close
        </Button>
        {allowDownload && (
          <Button
            onClick={handleDownload}
            startIcon={<DownloadIcon />}
            variant="contained"
            color="primary"
          >
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UniversalViewer;
