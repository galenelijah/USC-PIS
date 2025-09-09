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
} from '@mui/icons-material';
import { campaignService } from '../services/api';
import InlineContentRenderer from './common/InlineContentRenderer';

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
          background: primaryImage
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${primaryImage}) center/cover no-repeat`
            : `linear-gradient(135deg, ${color}55, ${color}22)`,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Breadcrumbs sx={{ color: 'white', mb: 1 }}>
            <MuiLink underline="hover" color="inherit" onClick={() => navigate('/campaigns')}>Campaigns</MuiLink>
            <Typography color="inherit">Preview</Typography>
          </Breadcrumbs>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>{campaign.title}</Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip size="small" label={(campaign.campaign_type || 'GENERAL').replace('_', ' ')} sx={{ bgcolor: 'white', color: 'black' }} />
            {campaign.status && <Chip size="small" label={campaign.status} sx={{ bgcolor: 'white', color: 'black' }} />}
          </Box>
        </Container>
      </Box>

      {/* Content body */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {campaign.summary && (
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
            {campaign.summary}
          </Typography>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <SafeContent content={campaign.content} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : '—'}
                {' — '}
                {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : '—'}
              </Typography>
              {campaign.target_audience && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Target Audience</Typography>
                  <Typography variant="body2">{campaign.target_audience}</Typography>
                </>
              )}
            </Paper>

            {Array.isArray(campaign.images) && campaign.images.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ImageIcon color="primary" />
                  <Typography variant="subtitle1">Campaign Images</Typography>
                </Box>
                <Grid container spacing={1}>
                  {campaign.images.map((img, idx) => (
                    <Grid item xs={6} key={img.id || idx}>
                      <Box
                        component="img"
                        src={img.url || img}
                        alt={img.caption || `Image ${idx + 1}`}
                        sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                        onClick={() => window.open(img.url || img, '_blank')}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicCampaignPreview;

