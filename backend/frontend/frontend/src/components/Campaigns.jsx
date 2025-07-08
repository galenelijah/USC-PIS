import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  IconButton,
  Avatar,
  Rating,
  Divider,
  LinearProgress,
  Alert,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  Badge,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Campaign as CampaignIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Star as StarIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  PhotoCamera as PhotoCameraIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../services/api';

const Campaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    campaign_type: '',
    status: '',
    priority: ''
  });
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    campaign_type: '',
    priority: 'MEDIUM',
    content: '',
    summary: '',
    target_audience: '',
    objectives: '',
    call_to_action: '',
    start_date: null,
    end_date: null,
    featured_until: null,
    tags: '',
    external_link: '',
    contact_info: '',
    banner_image: null,
    thumbnail_image: null,
    pubmat_image: null
  });
  const [feedback, setFeedback] = useState({
    rating: 5,
    usefulness: 5,
    clarity: 5,
    comments: '',
    suggestions: '',
    will_recommend: null,
    took_action: null,
    learned_something_new: null
  });
  const [resources, setResources] = useState([]);
  const [campaignFeedback, setCampaignFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchCampaigns();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchTerm, filters, selectedTab]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      let response;
      
      if (selectedTab === 0) {
        // All campaigns
        response = await campaignService.getCampaigns();
      } else if (selectedTab === 1) {
        // Active campaigns
        response = await campaignService.getCampaigns({ active: 'true' });
      } else if (selectedTab === 2) {
        // Featured campaigns
        response = await campaignService.getFeaturedCampaigns();
      }
      
      setCampaigns(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch campaigns');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await campaignService.getAnalytics();
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const filterCampaigns = () => {
    let filtered = campaigns;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.tags.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filters.campaign_type) {
      filtered = filtered.filter(campaign => campaign.campaign_type === filters.campaign_type);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(campaign => campaign.status === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(campaign => campaign.priority === filters.priority);
    }

    setFilteredCampaigns(filtered);
  };

  const handleCampaignClick = async (campaign) => {
    try {
      setSelectedCampaign(campaign);
      
      // Track engagement
      await campaignService.trackEngagement(campaign.id);
      
      // Fetch resources and feedback
      const [resourcesResponse, feedbackResponse] = await Promise.all([
        campaignService.getCampaignResources(campaign.id),
        campaignService.getCampaignFeedback(campaign.id)
      ]);
      
      setResources(resourcesResponse.data);
      setCampaignFeedback(feedbackResponse.data);
      setDialogOpen(true);
    } catch (err) {
      console.error('Error loading campaign details:', err);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(campaignForm).forEach(key => {
        if (campaignForm[key] !== null && campaignForm[key] !== '' && 
            !['banner_image', 'thumbnail_image', 'pubmat_image'].includes(key)) {
          formData.append(key, campaignForm[key]);
        }
      });
      
      // Add image files
      if (campaignForm.banner_image) {
        formData.append('banner_image', campaignForm.banner_image);
      }
      if (campaignForm.thumbnail_image) {
        formData.append('thumbnail_image', campaignForm.thumbnail_image);
      }
      if (campaignForm.pubmat_image) {
        formData.append('pubmat_image', campaignForm.pubmat_image);
      }
      
      await campaignService.createCampaign(formData);
      setSuccess('Campaign created successfully!');
      setCreateDialogOpen(false);
      resetCampaignForm();
      fetchCampaigns();
    } catch (err) {
      setError('Failed to create campaign');
      console.error('Error creating campaign:', err);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await campaignService.submitFeedback(selectedCampaign.id, feedback);
      setSuccess('Feedback submitted successfully!');
      setFeedbackDialogOpen(false);
      resetFeedback();
      
      // Refresh campaign feedback
      const feedbackResponse = await campaignService.getCampaignFeedback(selectedCampaign.id);
      setCampaignFeedback(feedbackResponse.data);
    } catch (err) {
      setError('Failed to submit feedback');
      console.error('Error submitting feedback:', err);
    }
  };

  const handleFileUpload = (field, file) => {
    setCampaignForm(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      title: '',
      description: '',
      campaign_type: '',
      priority: 'MEDIUM',
      content: '',
      summary: '',
      target_audience: '',
      objectives: '',
      call_to_action: '',
      start_date: null,
      end_date: null,
      featured_until: null,
      tags: '',
      external_link: '',
      contact_info: '',
      banner_image: null,
      thumbnail_image: null,
      pubmat_image: null
    });
  };

  const resetFeedback = () => {
    setFeedback({
      rating: 5,
      usefulness: 5,
      clarity: 5,
      comments: '',
      suggestions: '',
      will_recommend: null,
      took_action: null,
      learned_something_new: null
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SCHEDULED': return 'info';
      case 'PAUSED': return 'warning';
      case 'COMPLETED': return 'default';
      case 'DRAFT': return 'secondary';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const CAMPAIGN_TYPES = [
    { value: 'VACCINATION', label: 'Vaccination Campaign' },
    { value: 'MENTAL_HEALTH', label: 'Mental Health Awareness' },
    { value: 'NUTRITION', label: 'Nutrition & Wellness' },
    { value: 'DENTAL_HEALTH', label: 'Dental Health' },
    { value: 'HYGIENE', label: 'Personal Hygiene' },
    { value: 'EXERCISE', label: 'Physical Exercise' },
    { value: 'SAFETY', label: 'Health & Safety' },
    { value: 'PREVENTION', label: 'Disease Prevention' },
    { value: 'AWARENESS', label: 'Health Awareness' },
    { value: 'EMERGENCY', label: 'Emergency Health' },
    { value: 'SEASONAL', label: 'Seasonal Health' },
    { value: 'CUSTOM', label: 'Custom Campaign' }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Health Campaigns
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Create Campaign
          </Button>
        </Box>

        {/* Analytics Cards */}
        {analytics && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <CampaignIcon color="primary" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{analytics.total_campaigns}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Campaigns
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{analytics.active_campaigns}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Campaigns
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <PeopleIcon color="info" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{analytics.total_views}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Views
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <StarIcon color="warning" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{analytics.average_rating}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Rating
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters and Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.campaign_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, campaign_type: e.target.value }))}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {CAMPAIGN_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                  <MenuItem value="PAUSED">Paused</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="All Campaigns" />
          <Tab label="Active" />
          <Tab label="Featured" />
        </Tabs>

        {/* Campaigns Grid */}
        <Grid container spacing={3}>
          {filteredCampaigns.map((campaign) => (
            <Grid item xs={12} sm={6} md={4} key={campaign.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleCampaignClick(campaign)}
              >
                {campaign.banner_image_url && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={campaign.banner_image_url}
                    alt={campaign.title}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                      {campaign.title}
                    </Typography>
                    {campaign.is_featured && (
                      <Chip
                        label="Featured"
                        color="primary"
                        size="small"
                        icon={<StarIcon />}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {campaign.summary}
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    <Chip
                      label={campaign.campaign_type.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={campaign.status}
                      size="small"
                      color={getStatusColor(campaign.status)}
                    />
                    <Chip
                      label={campaign.priority}
                      size="small"
                      color={getPriorityColor(campaign.priority)}
                    />
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box display="flex" alignItems="center">
                        <ViewIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption">{campaign.view_count}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <ThumbUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption">{campaign.engagement_count}</Typography>
                      </Box>
                      {campaign.average_rating > 0 && (
                        <Box display="flex" alignItems="center">
                          <Rating value={campaign.average_rating} readOnly size="small" />
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            ({campaign.feedback_count})
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
                
                <CardActions>
                  <Button size="small" startIcon={<ViewIcon />}>
                    View Details
                  </Button>
                  <Button size="small" startIcon={<CommentIcon />}>
                    Feedback
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredCampaigns.length === 0 && (
          <Box textAlign="center" py={8}>
            <CampaignIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No campaigns found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        )}

        {/* Campaign Detail Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedCampaign && (
            <>
              <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5">{selectedCampaign.title}</Typography>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={selectedCampaign.status}
                      color={getStatusColor(selectedCampaign.status)}
                    />
                    <Chip
                      label={selectedCampaign.priority}
                      color={getPriorityColor(selectedCampaign.priority)}
                    />
                  </Box>
                </Box>
              </DialogTitle>
              
              <DialogContent>
                {selectedCampaign.banner_image_url && (
                  <Box mb={3}>
                    <img
                      src={selectedCampaign.banner_image_url}
                      alt={selectedCampaign.title}
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </Box>
                )}
                
                <Typography variant="body1" paragraph>
                  {selectedCampaign.description}
                </Typography>
                
                <Typography variant="body2" paragraph>
                  {selectedCampaign.content}
                </Typography>
                
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Target Audience
                    </Typography>
                    <Typography variant="body2">{selectedCampaign.target_audience}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Objectives
                    </Typography>
                    <Typography variant="body2">{selectedCampaign.objectives}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Call to Action
                    </Typography>
                    <Typography variant="body2">{selectedCampaign.call_to_action}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(selectedCampaign.start_date)} - {formatDate(selectedCampaign.end_date)}
                    </Typography>
                  </Grid>
                </Grid>
                
                {/* Resources */}
                {resources.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>Resources</Typography>
                    <List>
                      {resources.map((resource) => (
                        <ListItem key={resource.id} divider>
                          <ListItemIcon>
                            {resource.resource_type === 'DOCUMENT' ? <DocumentIcon /> : 
                             resource.resource_type === 'IMAGE' ? <ImageIcon /> : <AttachFileIcon />}
                          </ListItemIcon>
                          <ListItemText
                            primary={resource.title}
                            secondary={`${resource.resource_type} • ${resource.file_size_formatted} • ${resource.download_count} downloads`}
                          />
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => window.open(resource.file_url, '_blank')}
                          >
                            Download
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {/* Feedback Summary */}
                {campaignFeedback.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>Feedback Summary</Typography>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Rating value={selectedCampaign.average_rating} readOnly />
                      <Typography variant="body2">
                        {selectedCampaign.average_rating}/5 ({campaignFeedback.length} reviews)
                      </Typography>
                    </Box>
                    
                    {campaignFeedback.slice(0, 3).map((fb, index) => (
                      <Box key={index} mb={2} p={2} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle2">{fb.user_name}</Typography>
                          <Rating value={fb.rating} readOnly size="small" />
                        </Box>
                        <Typography variant="body2">{fb.comments}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </DialogContent>
              
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Close</Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setDialogOpen(false);
                    setFeedbackDialogOpen(true);
                  }}
                >
                  Leave Feedback
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog
          open={feedbackDialogOpen}
          onClose={() => setFeedbackDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Leave Feedback</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Overall Rating
                </Typography>
                <Rating
                  value={feedback.rating}
                  onChange={(e, newValue) => setFeedback(prev => ({ ...prev, rating: newValue }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Usefulness
                </Typography>
                <Rating
                  value={feedback.usefulness}
                  onChange={(e, newValue) => setFeedback(prev => ({ ...prev, usefulness: newValue }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Clarity
                </Typography>
                <Rating
                  value={feedback.clarity}
                  onChange={(e, newValue) => setFeedback(prev => ({ ...prev, clarity: newValue }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Comments"
                  value={feedback.comments}
                  onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Suggestions for Improvement"
                  value={feedback.suggestions}
                  onChange={(e) => setFeedback(prev => ({ ...prev, suggestions: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Would you recommend?</InputLabel>
                  <Select
                    value={feedback.will_recommend || ''}
                    onChange={(e) => setFeedback(prev => ({ ...prev, will_recommend: e.target.value }))}
                  >
                    <MenuItem value={true}>Yes</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Did you take action?</InputLabel>
                  <Select
                    value={feedback.took_action || ''}
                    onChange={(e) => setFeedback(prev => ({ ...prev, took_action: e.target.value }))}
                  >
                    <MenuItem value={true}>Yes</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Learned something new?</InputLabel>
                  <Select
                    value={feedback.learned_something_new || ''}
                    onChange={(e) => setFeedback(prev => ({ ...prev, learned_something_new: e.target.value }))}
                  >
                    <MenuItem value={true}>Yes</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitFeedback}>
              Submit Feedback
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Campaign Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaign Title"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Campaign Type</InputLabel>
                  <Select
                    value={campaignForm.campaign_type}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, campaign_type: e.target.value }))}
                  >
                    {CAMPAIGN_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={campaignForm.priority}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Summary"
                  value={campaignForm.summary}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, summary: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Content"
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, content: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Target Audience"
                  value={campaignForm.target_audience}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, target_audience: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Call to Action"
                  value={campaignForm.call_to_action}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, call_to_action: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Objectives"
                  value={campaignForm.objectives}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, objectives: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={campaignForm.start_date}
                  onChange={(newValue) => setCampaignForm(prev => ({ ...prev, start_date: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={campaignForm.end_date}
                  onChange={(newValue) => setCampaignForm(prev => ({ ...prev, end_date: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags (comma-separated)"
                  value={campaignForm.tags}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, tags: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="External Link"
                  value={campaignForm.external_link}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, external_link: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Information"
                  value={campaignForm.contact_info}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, contact_info: e.target.value }))}
                />
              </Grid>
              
              {/* Image Upload Sections */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Visual Content</Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Banner Image
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoCameraIcon />}
                    fullWidth
                  >
                    Upload Banner
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileUpload('banner_image', e.target.files[0])}
                    />
                  </Button>
                  {campaignForm.banner_image && (
                    <Typography variant="caption" display="block" mt={1}>
                      {campaignForm.banner_image.name}
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Thumbnail Image
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<ImageIcon />}
                    fullWidth
                  >
                    Upload Thumbnail
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileUpload('thumbnail_image', e.target.files[0])}
                    />
                  </Button>
                  {campaignForm.thumbnail_image && (
                    <Typography variant="caption" display="block" mt={1}>
                      {campaignForm.thumbnail_image.name}
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    PubMat (Print Material)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PdfIcon />}
                    fullWidth
                  >
                    Upload PubMat
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('pubmat_image', e.target.files[0])}
                    />
                  </Button>
                  {campaignForm.pubmat_image && (
                    <Typography variant="caption" display="block" mt={1}>
                      {campaignForm.pubmat_image.name}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateCampaign}>
              Create Campaign
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for messages */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>
        
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
        >
          <Alert onClose={() => setSuccess('')} severity="success">
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default Campaigns; 