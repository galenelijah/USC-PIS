import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Chip,
  CircularProgress,
  Paper,
  Grid,
  Button,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { campaignService } from '../services/api';
import InlineContentRenderer from './common/InlineContentRenderer';
import UniversalViewer from './common/UniversalViewer';

// Simple safe content renderer: prefer rich HTML when present, otherwise format text nicely
const SafeContent = ({ content }) => {
  if (!content) return null;
  const looksLikeHTML = typeof content === 'string' && /<[^>]+>/.test(content);
  if (looksLikeHTML) {
    return (
      <div
        style={{ lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return <InlineContentRenderer content={content} />;
};

const typeColor = (t) => {
  switch (t) {
    case 'MENTAL_HEALTH': return '#9c27b0';
    case 'NUTRITION': return '#4caf50';
    case 'HYGIENE': return '#2196f3';
    case 'PREVENTION': return '#ff9800';
    case 'VACCINATION': return '#f44336';
    default: return '#757575';
  }
};

const PublicCampaignPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');

  const openViewer = (url, title = 'Document Preview') => {
    setViewerUrl(url);
    setViewerTitle(title);
    setViewerOpen(true);
  };

  const handleDownload = (url, filename = 'pubmat_material') => {
    if (!url) return;
    
    // For Cloudinary URLs, we can force a download by adding fl_attachment
    let downloadUrl = url;
    if (url.includes('res.cloudinary.com')) {
      if (url.includes('/upload/')) {
        downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
      } else if (url.includes('/raw/upload/')) {
        downloadUrl = url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
      }
    }
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    const ext = url.split('.').pop().split('?')[0] || 'file';
    link.setAttribute('download', `${filename}.${ext}`);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPdf = (url) => {
    if (!url || typeof url !== 'string') return false;
    return /\.pdf(\?|$)/i.test(url);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await campaignService.getCampaign(id);
        setCampaign(resp?.data || null);
      } catch (e) {
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
        <Typography variant="h5" sx={{ mt: 2 }}>Campaign not found</Typography>
      </Container>
    );
  }

  const color = typeColor(campaign.campaign_type);
  const primaryImage = Array.isArray(campaign.images) && campaign.images.length > 0
    ? (campaign.images[0].url || campaign.images[0])
    : null;

  return (
    <Box>
      {/* Hero section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: 260,
          background: primaryImage && !isPdf(primaryImage)
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${primaryImage}) center/cover no-repeat`
            : `linear-gradient(135deg, ${color}55, ${color}22)`,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Breadcrumbs sx={{ color: 'white', mb: 1 }}>
            <MuiLink underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => navigate('/campaigns')}>Campaigns</MuiLink>
            <Typography color="inherit">Preview</Typography>
          </Breadcrumbs>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>{campaign.title}</Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip size="small" label={(campaign.campaign_type || 'GENERAL').replace('_', ' ')} sx={{ bgcolor: 'white', color: 'black' }} />
          </Box>
        </Container>
      </Box>

      {/* Content body */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {campaign.summary && (
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontStyle: 'italic' }}>
            {campaign.summary}
          </Typography>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <SafeContent content={campaign.content} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Duration</Typography>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : '—'}
                {' — '}
                {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : '—'}
              </Typography>
              {campaign.target_audience && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Target Audience</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{campaign.target_audience}</Typography>
                </>
              )}
            </Paper>

            {Array.isArray(campaign.images) && campaign.images.length > 0 && (
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ImageIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">Campaign Materials</Typography>
                </Box>
                <Grid container spacing={2}>
                  {campaign.images.map((img, idx) => {
                    const url = img.url || img;
                    const pdf = isPdf(url);
                    return (
                      <Grid item xs={12} key={img.id || idx}>
                        {pdf ? (
                          <Paper 
                            variant="outlined" 
                            sx={{ 
                              p: 2, 
                              textAlign: 'center', 
                              backgroundColor: '#f0f7ff', 
                              cursor: 'pointer',
                              border: '1px dashed #1976d2',
                              '&:hover': { backgroundColor: '#e3f2fd' }
                            }}
                            onClick={() => {
                              if (pdf) {
                                handleDownload(url, `${campaign.title}_material_${idx+1}`);
                              } else {
                                openViewer(url, img.caption || `${campaign.title} - Image ${idx+1}`);
                              }
                            }}
                          >
                            <PdfIcon sx={{ fontSize: 40, color: '#d32f2f', mb: 1 }} />
                            <Typography variant="caption" display="block" fontWeight="bold">
                              PDF DOCUMENT
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                              <Button size="small" startIcon={<DownloadIcon />}>
                                Download
                              </Button>
                            </Box>
                          </Paper>
                        ) : (
                          <Box
                            component="img"
                            src={url}
                            alt={img.caption || `Image ${idx + 1}`}
                            sx={{ 
                              width: '100%', 
                              height: 180, 
                              objectFit: 'cover', 
                              borderRadius: 1, 
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                              '&:hover': { transform: 'scale(1.02)' }
                            }}
                            onClick={() => openViewer(url, img.caption || `${campaign.title} - Image ${idx+1}`)}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        {img.caption && (
                          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 0.5 }}>
                            {img.caption}
                          </Typography>
                        )}
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            )}
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate(-1)}>Back to Campaigns</Button>
        </Box>
      </Container>

      {/* Universal File Viewer */}
      <UniversalViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        url={viewerUrl}
        title={viewerTitle}
        filename={viewerTitle.replace(/\s+/g, '_').toLowerCase()}
      />
    </Box>
  );
};

export default PublicCampaignPreview;

