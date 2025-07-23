import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Avatar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Container,
  Rating,
  TextField,
  Snackbar
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  TrendingUp as TrendingIcon,
  School as SchoolIcon,
  HealthAndSafety as HealthIcon,
  Psychology as MentalHealthIcon,
  Restaurant as NutritionIcon,
  CleanHands as HygieneIcon,
  Vaccines as PreventionIcon,
  Close as CloseIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { campaignService } from '../services/api';

const StudentCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookmarkedCampaigns, setBookmarkedCampaigns] = useState(new Set());
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    fetchActiveCampaigns();
  }, []);

  const fetchActiveCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignService.getActiveCampaigns();
      setCampaigns(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      showSnackbar('Failed to load campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCampaignIcon = (campaignType) => {
    const iconProps = { sx: { fontSize: 40, color: 'primary.main' } };
    switch (campaignType) {
      case 'MENTAL_HEALTH':
        return <MentalHealthIcon {...iconProps} />;
      case 'NUTRITION':
        return <NutritionIcon {...iconProps} />;
      case 'HYGIENE':
        return <HygieneIcon {...iconProps} />;
      case 'PREVENTION':
        return <PreventionIcon {...iconProps} />;
      case 'VACCINATION':
        return <PreventionIcon {...iconProps} />;
      default:
        return <HealthIcon {...iconProps} />;
    }
  };

  const getCampaignColor = (campaignType) => {
    switch (campaignType) {
      case 'MENTAL_HEALTH':
        return '#9c27b0';
      case 'NUTRITION':
        return '#4caf50';
      case 'HYGIENE':
        return '#2196f3';
      case 'PREVENTION':
        return '#ff9800';
      case 'VACCINATION':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setDialogOpen(true);
  };

  const handleBookmark = (campaignId, event) => {
    event.stopPropagation();
    const newBookmarks = new Set(bookmarkedCampaigns);
    if (bookmarkedCampaigns.has(campaignId)) {
      newBookmarks.delete(campaignId);
      showSnackbar('Campaign removed from bookmarks', 'info');
    } else {
      newBookmarks.add(campaignId);
      showSnackbar('Campaign bookmarked!', 'success');
    }
    setBookmarkedCampaigns(newBookmarks);
  };

  const handleShare = (campaign, event) => {
    event.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.summary,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${campaign.title}: ${campaign.summary}`);
      showSnackbar('Campaign details copied to clipboard!', 'success');
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      await campaignService.submitFeedback(selectedCampaign.id, feedback);
      showSnackbar('Thank you for your feedback!', 'success');
      setFeedbackDialogOpen(false);
      setFeedback({ rating: 0, comment: '' });
    } catch (error) {
      showSnackbar('Failed to submit feedback', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isActiveCampaign = (campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    return now >= startDate && now <= endDate;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Health & Wellness Campaigns
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Stay healthy and informed with our latest campus health initiatives
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<SchoolIcon />} label={`${campaigns.length} Active Campaigns`} color="primary" />
          <Chip icon={<PeopleIcon />} label="For USC Students" color="secondary" />
        </Box>
      </Box>

      {/* Empty State */}
      {campaigns.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HealthIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Active Campaigns
          </Typography>
          <Typography color="text.secondary">
            Check back soon for new health and wellness campaigns!
          </Typography>
        </Paper>
      )}

      {/* Campaign Cards */}
      <Grid container spacing={3}>
        {campaigns.map((campaign) => (
          <Grid item xs={12} md={6} lg={4} key={campaign.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `2px solid transparent`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  border: `2px solid ${getCampaignColor(campaign.campaign_type)}`,
                },
              }}
              onClick={() => handleCampaignClick(campaign)}
            >
              {/* Campaign Header */}
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${getCampaignColor(campaign.campaign_type)}20, ${getCampaignColor(campaign.campaign_type)}10)`,
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {getCampaignIcon(campaign.campaign_type)}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {campaign.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={campaign.campaign_type.replace('_', ' ')}
                      sx={{ 
                        backgroundColor: getCampaignColor(campaign.campaign_type),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    {campaign.priority === 'HIGH' && (
                      <Chip size="small" label="Priority" color="error" />
                    )}
                  </Box>
                </Box>
              </Box>

              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {campaign.summary || campaign.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TimeIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {isActiveCampaign(campaign) ? 'Active Now' : `Ends ${formatDate(campaign.end_date)}`}
                    </Typography>
                  </Box>
                </Box>

                {campaign.target_audience && (
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 'medium' }}>
                    👥 {campaign.target_audience}
                  </Typography>
                )}
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ 
                    borderRadius: 2,
                    backgroundColor: getCampaignColor(campaign.campaign_type),
                    '&:hover': {
                      backgroundColor: getCampaignColor(campaign.campaign_type) + 'dd',
                    }
                  }}
                >
                  Learn More
                </Button>
                <Box>
                  <IconButton 
                    size="small"
                    onClick={(e) => handleBookmark(campaign.id, e)}
                    color={bookmarkedCampaigns.has(campaign.id) ? 'primary' : 'default'}
                  >
                    {bookmarkedCampaigns.has(campaign.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={(e) => handleShare(campaign, e)}
                  >
                    <ShareIcon />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Campaign Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        {selectedCampaign && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {getCampaignIcon(selectedCampaign.campaign_type)}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {selectedCampaign.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip
                      size="small"
                      label={selectedCampaign.campaign_type.replace('_', ' ')}
                      sx={{ 
                        backgroundColor: getCampaignColor(selectedCampaign.campaign_type),
                        color: 'white'
                      }}
                    />
                    {selectedCampaign.priority === 'HIGH' && (
                      <Chip size="small" label="High Priority" color="error" />
                    )}
                  </Box>
                </Box>
                <IconButton onClick={() => setDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  {selectedCampaign.summary}
                </Typography>
                <Divider sx={{ my: 2 }} />
              </Box>

              {/* Campaign Content */}
              <Box sx={{ mb: 3 }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: selectedCampaign.content }} 
                  style={{ lineHeight: 1.6 }}
                />
              </Box>

              {/* Call to Action */}
              {selectedCampaign.call_to_action && (
                <Alert 
                  severity="info" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  icon={<TrendingIcon />}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    <strong>Take Action:</strong> {selectedCampaign.call_to_action}
                  </Typography>
                </Alert>
              )}

              {/* Campaign Details */}
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Duration</Typography>
                    <Typography variant="body2">
                      {formatDate(selectedCampaign.start_date)} - {formatDate(selectedCampaign.end_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Target Audience</Typography>
                    <Typography variant="body2">
                      {selectedCampaign.target_audience || 'All USC Students'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CommentIcon />}
                onClick={() => setFeedbackDialogOpen(true)}
              >
                Give Feedback
              </Button>
              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={(e) => handleShare(selectedCampaign, e)}
                sx={{ 
                  backgroundColor: getCampaignColor(selectedCampaign.campaign_type),
                  '&:hover': {
                    backgroundColor: getCampaignColor(selectedCampaign.campaign_type) + 'dd',
                  }
                }}
              >
                Share Campaign
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Campaign Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" gutterBottom>
              How helpful was this campaign?
            </Typography>
            <Rating
              value={feedback.rating}
              onChange={(_, value) => setFeedback({ ...feedback, rating: value })}
              size="large"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Additional Comments (Optional)"
              value={feedback.comment}
              onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
              placeholder="Tell us what you found most useful or how we can improve..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleFeedbackSubmit} 
            variant="contained"
            disabled={feedback.rating === 0}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default StudentCampaigns;