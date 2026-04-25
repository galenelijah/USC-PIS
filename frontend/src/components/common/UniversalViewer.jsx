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
  GetApp as DownloadIcon,
} from '@mui/icons-material';

/**
 * UniversalViewer handles both Images and PDFs.
 * It uses a standard <img> tag for images and an <iframe> for PDFs.
 * It also provides robust download logic for Cloudinary URLs.
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
  
  // Improved PDF detection using regex
  const isPdf = url && typeof url === 'string' && /\.pdf(\?|$)/i.test(url);
  
  // Clean URL for viewing (ensure no force-download flags)
  const viewUrl = typeof url === 'string' ? url.replace(/\/fl_attachment\//g, '/') : url;

  const handleDownload = () => {
    if (!url) return;
    
    // For Cloudinary URLs, append fl_attachment to force download response
    let downloadUrl = url;
    if (typeof url === 'string' && url.includes('res.cloudinary.com')) {
      if (url.includes('/upload/') && !url.includes('/fl_attachment/')) {
        downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
      } else if (url.includes('/raw/upload/') && !url.includes('/fl_attachment/')) {
        downloadUrl = url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
      }
    }
    
    // Create a hidden anchor element to trigger the browser's download behavior
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Sanitize filename and append correct extension
    const cleanFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const ext = isPdf ? 'pdf' : 'file';
    
    link.setAttribute('download', `${cleanFilename}.${ext}`);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
    }, 150);
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
          borderRadius: isMobile ? 0 : 3,
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1.5,
        bgcolor: isPdf ? 'white' : '#111',
        color: isPdf ? 'text.primary' : 'white',
        zIndex: 10
      }}>
        <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 'bold', maxWidth: '80%' }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} color="inherit" edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ 
        p: 0, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isPdf ? '#f0f2f5' : 'black',
        position: 'relative'
      }}>
        {isPdf ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewUrl)}&embedded=true`}
              title={title}
              width="100%"
              height="100%"
              style={{ border: 'none', flexGrow: 1 }}
            />
            {/* Helper text for browsers with poor iframe-PDF support */}
            <Box sx={{ 
              bgcolor: 'rgba(255,255,255,0.95)', 
              p: 1, 
              textAlign: 'center',
              borderTop: '1px solid #ddd'
            }}>
              <Typography variant="caption" color="text.secondary">
                PDF not loading? Use the <strong>Download File</strong> button or <a href={viewUrl} target="_blank" rel="noreferrer" style={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>open directly</a>.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: 2
          }}>
            <Box
              component="img"
              src={viewUrl}
              alt={title}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                borderRadius: 1
              }}
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 2, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        bgcolor: isPdf ? 'white' : '#111',
        color: isPdf ? 'text.primary' : 'white'
      }}>
        <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' }, pl: 1 }}>
          <Typography variant="caption" color="inherit" sx={{ opacity: 0.7, display: 'flex', alignItems: 'center', gap: 1 }}>
            {isPdf ? '📎 PDF Document' : '🖼️ Image View'}
          </Typography>
        </Box>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>
          Close
        </Button>
        {allowDownload && (
          <Button
            onClick={handleDownload}
            startIcon={<DownloadIcon />}
            variant="contained"
            color="primary"
            sx={{ borderRadius: 2, fontWeight: 'bold', px: 3, ml: 1 }}
          >
            Download File
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UniversalViewer;
