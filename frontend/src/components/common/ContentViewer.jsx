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
  Paper,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Bookmark as BookmarkIcon,
} from '@mui/icons-material';

const ContentViewer = ({ 
  open, 
  onClose, 
  title = '', 
  content = '', 
  category = '',
  author = '',
  date = '',
  images = [],
  allowActions = true 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            h1 { color: #1a5e20; border-bottom: 2px solid #1a5e20; }
            .meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
            .content { white-space: pre-wrap; }
            img { max-width: 100%; height: auto; margin: 10px 0; }
            @media print { 
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            ${category ? `<strong>Category:</strong> ${category}<br>` : ''}
            ${author ? `<strong>Author:</strong> ${author}<br>` : ''}
            ${date ? `<strong>Date:</strong> ${date}` : ''}
          </div>
          <div class="content">${content}</div>
          ${images.map(img => `<img src="${img.url}" alt="${img.name || 'Image'}" />`).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `${title}\n\n${content.substring(0, 200)}...`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${title}\n\n${content}`;
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Content copied to clipboard!');
      } catch (error) {
        console.log('Could not copy text:', error);
      }
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          backgroundColor: 'white',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        backgroundColor: '#f5f7fa',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box sx={{ flex: 1, mr: 2 }}>
          <Typography variant="h5" component="div" fontWeight="bold" color="primary">
            {title}
          </Typography>
          {(category || author || date) && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {category && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Category:</strong> {category}
                </Typography>
              )}
              {author && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Author:</strong> {author}
                </Typography>
              )}
              {date && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Date:</strong> {new Date(date).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ 
        padding: '24px',
        backgroundColor: 'white'
      }}>
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="body1" 
            component="div" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              fontSize: '1.1rem',
              color: 'text.primary'
            }}
          >
            {content}
          </Typography>
        </Box>

        {/* Display images if any */}
        {images && images.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom color="primary">
              Images
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2
            }}>
              {images.map((image, index) => (
                <Paper 
                  key={index}
                  elevation={2}
                  sx={{ 
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': {
                      elevation: 4,
                      transform: 'scale(1.02)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={image.url}
                    alt={image.name || `Image ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </Paper>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      
      {allowActions && (
        <DialogActions sx={{ 
          backgroundColor: '#f5f7fa',
          borderTop: '1px solid #e0e0e0',
          justifyContent: 'space-between',
          padding: '12px 24px'
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleShare}
              startIcon={<ShareIcon />}
              variant="outlined"
              size="small"
            >
              Share
            </Button>
            <Button
              onClick={handlePrint}
              startIcon={<PrintIcon />}
              variant="outlined"
              size="small"
            >
              Print
            </Button>
          </Box>
          
          <Button onClick={onClose} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ContentViewer;