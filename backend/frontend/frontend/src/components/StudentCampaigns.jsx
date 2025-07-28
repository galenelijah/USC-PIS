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
  Snackbar,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CardMedia
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
  Comment as CommentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { campaignService } from '../services/api';
import ImageUpload from '../common/ImageUpload';

const UniversalCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookmarkedCampaigns, setBookmarkedCampaigns] = useState(new Set());
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    campaign_type: 'GENERAL',
    priority: 'MEDIUM',
    content: '',
    summary: '',
    objectives: '',
    target_audience: '',
    call_to_action: '',
    tags: '',
    start_date: '',
    end_date: '',
    status: 'ACTIVE'
  });
  const [campaignImages, setCampaignImages] = useState([]);
  
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    fetchActiveCampaigns();
  }, []);

  const fetchActiveCampaigns = async () => {
    try {
      setLoading(true);
      // Get all campaigns - backend no longer filters by role
      const response = await campaignService.getCampaigns();
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

  const handleCampaignCreate = async () => {
    try {
      const formData = new FormData();
      
      // Add form fields
      Object.keys(campaignForm).forEach(key => {
        if (campaignForm[key]) {
          formData.append(key, campaignForm[key]);
        }
      });

      // Add images if any
      if (campaignImages.length > 0) {
        campaignImages.forEach((image, index) => {
          if (image.file) {
            formData.append(`images`, image.file);
          }
        });
      }

      await campaignService.createCampaign(formData);
      showSnackbar('Campaign created successfully!', 'success');
      setCreateDialogOpen(false);
      resetCampaignForm();
      fetchActiveCampaigns(); // Refresh campaigns
    } catch (error) {
      console.error('Campaign creation error:', error);
      showSnackbar('Failed to create campaign', 'error');
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      title: '',
      description: '',
      campaign_type: 'GENERAL',
      priority: 'MEDIUM',
      content: '',
      summary: '',
      objectives: '',
      target_audience: '',
      call_to_action: '',
      tags: '',
      start_date: '',
      end_date: '',
      status: 'ACTIVE'
    });
    setCampaignImages([]);
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
          Comprehensive health information and campaigns for the entire USC community
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<SchoolIcon />} label={`${campaigns.length} Total Campaigns`} color="primary" />
          <Chip 
            icon={<HealthIcon />} 
            label={`${campaigns.filter(c => c.status === 'ACTIVE').length} Active`} 
            color="success" 
          />
          <Chip icon={<PeopleIcon />} label="For Everyone" color="secondary" />
          {user && ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(user.role) && (
            <Chip icon={<EditIcon />} label="Can Create" color="warning" />
          )}
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
              {/* Show first image as campaign banner if available */}
              {campaign.images && campaign.images.length > 0 && (
                <CardMedia
                  component="img"
                  height="200"
                  image={campaign.images[0].url || campaign.images[0]}
                  alt={campaign.title}
                  sx={{ 
                    cursor: 'pointer',
                    objectFit: 'cover'
                  }}
                />
              )}
              
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
                    <Chip 
                      size="small" 
                      label={campaign.status || 'ACTIVE'} 
                      color={campaign.status === 'ACTIVE' ? 'success' : 'default'}
                      variant={campaign.status === 'ACTIVE' ? 'filled' : 'outlined'}
                    />
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {campaign.target_audience && (
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 'medium' }}>
                      👥 {campaign.target_audience}
                    </Typography>
                  )}
                  {campaign.images && campaign.images.length > 0 && (
                    <Chip 
                      icon={<ImageIcon />} 
                      label={`${campaign.images.length} image${campaign.images.length > 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                </Box>
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

      {/* Create Campaign Button (for authorized users) */}
      {user && ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(user.role) && (
        <Fab
          color="primary"
          aria-label="add campaign"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1000,
          }}
          onClick={() => setCreateDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Simple Campaign Creation Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Health Campaign</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaign Title"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                  placeholder="e.g., Winter Flu Prevention Campaign"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Campaign Type</InputLabel>
                  <Select
                    value={campaignForm.campaign_type}
                    onChange={(e) => setCampaignForm({ ...campaignForm, campaign_type: e.target.value })}
                    label="Campaign Type"
                  >
                    <MenuItem value="MENTAL_HEALTH">Mental Health</MenuItem>
                    <MenuItem value="NUTRITION">Nutrition</MenuItem>
                    <MenuItem value="HYGIENE">Hygiene</MenuItem>
                    <MenuItem value="PREVENTION">Prevention</MenuItem>
                    <MenuItem value="VACCINATION">Vaccination</MenuItem>
                    <MenuItem value="GENERAL">General Health</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={campaignForm.priority}
                    onChange={(e) => setCampaignForm({ ...campaignForm, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Brief description of the campaign..."
                  multiline
                  rows={2}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Short Summary"
                  value={campaignForm.summary}
                  onChange={(e) => setCampaignForm({ ...campaignForm, summary: e.target.value })}
                  placeholder="Additional summary (optional)..."
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaign Content"
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                  placeholder="Detailed campaign content (supports basic HTML)..."
                  multiline
                  rows={6}
                  helperText="You can use basic HTML tags like <h3>, <p>, <ul>, <li>, <strong>, etc."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Objectives *"
                  value={campaignForm.objectives}
                  onChange={(e) => setCampaignForm({ ...campaignForm, objectives: e.target.value })}
                  placeholder="Campaign objectives and goals (e.g., • Increase awareness • Promote healthy habits • Reduce incidents)"
                  multiline
                  rows={3}
                  required
                  helperText="List the main objectives of this campaign"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date *"
                  type="date"
                  value={campaignForm.start_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date *"
                  type="date"
                  value={campaignForm.end_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Target Audience"
                  value={campaignForm.target_audience}
                  onChange={(e) => setCampaignForm({ ...campaignForm, target_audience: e.target.value })}
                  placeholder="e.g., All USC Students, Faculty and Staff"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tags"
                  value={campaignForm.tags}
                  onChange={(e) => setCampaignForm({ ...campaignForm, tags: e.target.value })}
                  placeholder="health, safety, students (comma-separated)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Call to Action"
                  value={campaignForm.call_to_action}
                  onChange={(e) => setCampaignForm({ ...campaignForm, call_to_action: e.target.value })}
                  placeholder="What should people do after reading this campaign?"
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Image Upload Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                  Campaign Images & Pubmats (Optional)
                </Typography>
                <ImageUpload
                  images={campaignImages}
                  onImagesChange={setCampaignImages}
                  maxImages={5}
                  maxSizeMB={10}
                  acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            resetCampaignForm();
          }}>Cancel</Button>
          <Button 
            onClick={handleCampaignCreate}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={
              !campaignForm.title || 
              !campaignForm.description || 
              !campaignForm.content || 
              !campaignForm.objectives || 
              !campaignForm.start_date || 
              !campaignForm.end_date
            }
          >
            Create Campaign
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

export default UniversalCampaigns;