import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  CardMedia,
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
  TextField,
  Snackbar,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Stack,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  CloudUpload as UploadIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  TrendingUp as TrendingIcon,
  MoreVert as MoreVertIcon,
  Campaign as CampaignIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { campaignService } from '../services/api';

const CampaignsPage = () => {
  // State management - Initialize with empty arrays
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form state
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
    status: 'DRAFT'
  });
  
  // File uploads
  const [bannerFile, setBannerFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [pubmatFile, setPubmatFile] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCampaign, setMenuCampaign] = useState(null);

  const user = useSelector(state => state.auth.user);
  const isNonStudent = user && !['STUDENT', 'PATIENT'].includes(user.role);

  // Campaign types
  const CAMPAIGN_TYPES = [
    { value: 'GENERAL', label: 'General Health Information', color: 'primary' },
    { value: 'VACCINATION', label: 'Vaccination Campaign', color: 'success' },
    { value: 'MENTAL_HEALTH', label: 'Mental Health Awareness', color: 'info' },
    { value: 'NUTRITION', label: 'Nutrition & Wellness', color: 'warning' },
    { value: 'DENTAL_HEALTH', label: 'Dental Health', color: 'secondary' },
    { value: 'HYGIENE', label: 'Personal Hygiene', color: 'primary' },
    { value: 'EXERCISE', label: 'Physical Exercise', color: 'success' },
    { value: 'SAFETY', label: 'Health & Safety', color: 'error' },
    { value: 'PREVENTION', label: 'Disease Prevention', color: 'warning' },
    { value: 'AWARENESS', label: 'Health Awareness', color: 'info' },
    { value: 'EMERGENCY', label: 'Emergency Health', color: 'error' },
    { value: 'SEASONAL', label: 'Seasonal Health', color: 'secondary' },
    { value: 'CUSTOM', label: 'Custom Campaign', color: 'default' }
  ];

  const PRIORITY_LEVELS = [
    { value: 'LOW', label: 'Low', color: 'default' },
    { value: 'MEDIUM', label: 'Medium', color: 'primary' },
    { value: 'HIGH', label: 'High', color: 'warning' },
    { value: 'URGENT', label: 'Urgent', color: 'error' }
  ];

  const STATUS_OPTIONS = [
    { value: 'DRAFT', label: 'Draft', color: 'default' },
    { value: 'SCHEDULED', label: 'Scheduled', color: 'info' },
    { value: 'ACTIVE', label: 'Active', color: 'success' },
    { value: 'PAUSED', label: 'Paused', color: 'warning' },
    { value: 'COMPLETED', label: 'Completed', color: 'secondary' },
    { value: 'ARCHIVED', label: 'Archived', color: 'default' }
  ];

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchTerm, filterType, filterStatus]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignService.getCampaigns();
      
      console.log('API Response:', response);
      console.log('Response data:', response?.data);
      
      // Ensure we always have an array to work with
      let campaignsData = [];
      
      if (response?.data) {
        // Handle paginated response
        if (response.data.results && Array.isArray(response.data.results)) {
          campaignsData = response.data.results;
        }
        // Handle direct array response
        else if (Array.isArray(response.data)) {
          campaignsData = response.data;
        }
        // Handle other structures
        else {
          console.warn('Unexpected response structure:', response.data);
          campaignsData = [];
        }
      }
      
      console.log('Setting campaigns:', campaignsData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]); // Ensure we set an empty array on error
      showSnackbar('Failed to load campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    // Ensure campaigns is always an array before filtering
    if (!Array.isArray(campaigns)) {
      console.warn('Campaigns is not an array in filterCampaigns:', campaigns);
      setFilteredCampaigns([]);
      return;
    }

    let filtered = [...campaigns];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign?.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'ALL') {
      filtered = filtered.filter(campaign => campaign?.campaign_type === filterType);
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(campaign => campaign?.status === filterStatus);
    }

    setFilteredCampaigns(filtered);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const resetForm = () => {
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
      status: 'DRAFT'
    });
    setBannerFile(null);
    setThumbnailFile(null);
    setPubmatFile(null);
  };

  const handleFileUpload = (type, file) => {
    console.log('handleFileUpload called with:', type, file ? { name: file.name, size: file.size, type: file.type } : null);
    
    if (file && file.size > 0) {
      console.log(`Setting ${type} file:`, file.name, file.size, 'bytes');
      switch (type) {
        case 'banner':
          setBannerFile(file);
          break;
        case 'thumbnail':
          setThumbnailFile(file);
          break;
        case 'pubmat':
          setPubmatFile(file);
          break;
        default:
          break;
      }
    } else if (file && file.size === 0) {
      console.error('Empty file detected:', file.name);
      showSnackbar('Cannot upload empty files', 'error');
    } else {
      console.log('No file or file is null');
    }
  };

  const handleCreateCampaign = async () => {
    try {
      // Validate required fields
      if (!campaignForm.title || !campaignForm.description || !campaignForm.start_date || !campaignForm.end_date) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      const formData = new FormData();
      
      // Add form fields
      Object.keys(campaignForm).forEach(key => {
        if (campaignForm[key]) {
          formData.append(key, campaignForm[key]);
        }
      });

      // Debug file information before adding to FormData
      console.log('Frontend file debug:');
      console.log('bannerFile:', bannerFile ? { name: bannerFile.name, size: bannerFile.size, type: bannerFile.type } : null);
      console.log('thumbnailFile:', thumbnailFile ? { name: thumbnailFile.name, size: thumbnailFile.size, type: thumbnailFile.type } : null);
      console.log('pubmatFile:', pubmatFile ? { name: pubmatFile.name, size: pubmatFile.size, type: pubmatFile.type } : null);

      // Test: Add files with generic names like health-info does
      if (bannerFile && bannerFile.size > 0) {
        formData.append('banner_image', bannerFile, bannerFile.name);  // Explicitly set filename
        console.log('Added banner_image to FormData:', bannerFile.name, bannerFile.size);
      }
      if (thumbnailFile && thumbnailFile.size > 0) {
        formData.append('thumbnail_image', thumbnailFile, thumbnailFile.name);  // Explicitly set filename
        console.log('Added thumbnail_image to FormData:', thumbnailFile.name, thumbnailFile.size);
      }
      if (pubmatFile && pubmatFile.size > 0) {
        formData.append('pubmat_image', pubmatFile, pubmatFile.name);  // Explicitly set filename
        console.log('Added pubmat_image to FormData:', pubmatFile.name, pubmatFile.size);
      }

      // Debug FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(key, ':', value.name, value.size, 'bytes', 'type:', value.type);
        } else {
          console.log(key, ':', value);
        }
      }
      
      // Verify files are still valid File objects
      console.log('bannerFile instanceof File:', bannerFile instanceof File);
      console.log('thumbnailFile instanceof File:', thumbnailFile instanceof File);
      console.log('pubmatFile instanceof File:', pubmatFile instanceof File);

      await campaignService.createCampaign(formData);
      showSnackbar('Campaign created successfully!', 'success');
      setCreateDialogOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      showSnackbar(error.response?.data?.error || 'Failed to create campaign', 'error');
    }
  };

  const handleEditCampaign = async () => {
    try {
      const formData = new FormData();
      
      // Add form fields
      Object.keys(campaignForm).forEach(key => {
        if (campaignForm[key]) {
          formData.append(key, campaignForm[key]);
        }
      });

      // Add files with size validation
      if (bannerFile && bannerFile.size > 0) {
        formData.append('banner_image', bannerFile);
      }
      if (thumbnailFile && thumbnailFile.size > 0) {
        formData.append('thumbnail_image', thumbnailFile);
      }
      if (pubmatFile && pubmatFile.size > 0) {
        formData.append('pubmat_image', pubmatFile);
      }

      await campaignService.updateCampaign(selectedCampaign.id, formData);
      showSnackbar('Campaign updated successfully!', 'success');
      setEditDialogOpen(false);
      resetForm();
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      showSnackbar(error.response?.data?.error || 'Failed to update campaign', 'error');
    }
  };

  const handleDeleteCampaign = async () => {
    try {
      await campaignService.deleteCampaign(campaignToDelete.id);
      showSnackbar('Campaign deleted successfully!', 'success');
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      showSnackbar('Failed to delete campaign', 'error');
    }
  };

  const openEditDialog = (campaign) => {
    setCampaignForm({
      title: campaign.title || '',
      description: campaign.description || '',
      campaign_type: campaign.campaign_type || 'GENERAL',
      priority: campaign.priority || 'MEDIUM',
      content: campaign.content || '',
      summary: campaign.summary || '',
      objectives: campaign.objectives || '',
      target_audience: campaign.target_audience || '',
      call_to_action: campaign.call_to_action || '',
      tags: campaign.tags || '',
      start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
      end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
      status: campaign.status || 'DRAFT'
    });
    setSelectedCampaign(campaign);
    setEditDialogOpen(true);
    setAnchorEl(null);
  };

  const openDeleteDialog = (campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const openViewDialog = (campaign) => {
    setSelectedCampaign(campaign);
    setViewDialogOpen(true);
  };

  const handleMenuOpen = (event, campaign) => {
    setAnchorEl(event.currentTarget);
    setMenuCampaign(campaign);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCampaign(null);
  };

  const getCampaignTypeInfo = (type) => {
    try {
      return CAMPAIGN_TYPES.find(t => t.value === type) || CAMPAIGN_TYPES[0];
    } catch (error) {
      console.error('Error in getCampaignTypeInfo:', error);
      return { value: 'GENERAL', label: 'General Health Information', color: 'primary' };
    }
  };

  const getPriorityInfo = (priority) => {
    try {
      return PRIORITY_LEVELS.find(p => p.value === priority) || PRIORITY_LEVELS[1];
    } catch (error) {
      console.error('Error in getPriorityInfo:', error);
      return { value: 'MEDIUM', label: 'Medium', color: 'primary' };
    }
  };

  const getStatusInfo = (status) => {
    try {
      return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    } catch (error) {
      console.error('Error in getStatusInfo:', error);
      return { value: 'DRAFT', label: 'Draft', color: 'default' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isActive = (campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    return campaign.status === 'ACTIVE' && now >= startDate && now <= endDate;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Health Campaigns
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage and view health awareness campaigns
          </Typography>
        </Box>
        {isNonStudent && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            New Campaign
          </Button>
        )}
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Campaign Type</InputLabel>
              <Select
                value={filterType}
                label="Campaign Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                {CAMPAIGN_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                {STATUS_OPTIONS.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box display="flex" alignItems="center">
              <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {filteredCampaigns.length} campaigns
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Campaign Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ borderRadius: 2 }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Skeleton variant="text" height={60} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredCampaigns.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
          <CampaignIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.primary" gutterBottom>
            No campaigns found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || filterType !== 'ALL' || filterStatus !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first campaign'
            }
          </Typography>
          {isNonStudent && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Campaign
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {(() => {
            try {
              if (!Array.isArray(filteredCampaigns)) {
                console.warn('filteredCampaigns is not an array:', filteredCampaigns);
                return null;
              }
              
              return filteredCampaigns.map((campaign) => {
            // Safety check for campaign object
            if (!campaign || typeof campaign !== 'object' || !campaign.id) {
              console.warn('Invalid campaign object:', campaign);
              return null;
            }

            const typeInfo = getCampaignTypeInfo(campaign.campaign_type || 'GENERAL');
            const statusInfo = getStatusInfo(campaign.status || 'DRAFT');
            const priorityInfo = getPriorityInfo(campaign.priority || 'MEDIUM');
            
            return (
              <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                <Card 
                  sx={{ 
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}
                >
                  {/* Campaign Image */}
                  {(campaign.banner_image_url || campaign.thumbnail_image_url) && (
                    <CardMedia
                      component="img"
                      height={200}
                      image={campaign.banner_image_url || campaign.thumbnail_image_url}
                      alt={campaign.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    {/* Status and Priority Chips */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                          variant={isActive(campaign) ? 'filled' : 'outlined'}
                        />
                        {campaign.priority !== 'MEDIUM' && (
                          <Chip
                            label={priorityInfo.label}
                            color={priorityInfo.color}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                      {isNonStudent && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, campaign)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </Box>

                    {/* Campaign Title and Type */}
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {campaign.title}
                    </Typography>
                    <Chip
                      label={typeInfo.label}
                      color={typeInfo.color}
                      size="small"
                      sx={{ mb: 2 }}
                    />

                    {/* Campaign Summary */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 2
                      }}
                    >
                      {campaign.summary || campaign.description}
                    </Typography>

                    {/* Campaign Stats */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center">
                          <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">
                            {campaign.view_count || 0}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <TrendingIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">
                            {campaign.engagement_count || 0}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(campaign.start_date)}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ pt: 0 }}>
                    <Button
                      size="small"
                      onClick={() => openViewDialog(campaign)}
                      startIcon={<VisibilityIcon />}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
              });
            } catch (error) {
              console.error('Error rendering campaigns:', error);
              return (
                <Grid item xs={12}>
                  <Alert severity="error">
                    Error loading campaigns. Please refresh the page.
                  </Alert>
                </Grid>
              );
            }
          })()}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => openEditDialog(menuCampaign)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Campaign</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => openDeleteDialog(menuCampaign)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Campaign</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Campaign Dialog - Part 1 */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center">
            <CampaignIcon sx={{ mr: 2, color: 'primary.main' }} />
            Create New Campaign
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Campaign Title"
                value={campaignForm.title}
                onChange={(e) => setCampaignForm({...campaignForm, title: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Campaign Type</InputLabel>
                <Select
                  value={campaignForm.campaign_type}
                  label="Campaign Type"
                  onChange={(e) => setCampaignForm({...campaignForm, campaign_type: e.target.value})}
                >
                  {CAMPAIGN_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Summary"
                value={campaignForm.summary}
                onChange={(e) => setCampaignForm({...campaignForm, summary: e.target.value})}
                placeholder="Brief overview of the campaign..."
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Description"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({...campaignForm, description: e.target.value})}
                placeholder="Detailed description of the campaign..."
                multiline
                rows={4}
                required
              />
            </Grid>

            {/* Campaign Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Campaign Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={campaignForm.priority}
                  label="Priority"
                  onChange={(e) => setCampaignForm({...campaignForm, priority: e.target.value})}
                >
                  {PRIORITY_LEVELS.map(priority => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={campaignForm.status}
                  label="Status"
                  onChange={(e) => setCampaignForm({...campaignForm, status: e.target.value})}
                >
                  {STATUS_OPTIONS.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={campaignForm.start_date}
                onChange={(e) => setCampaignForm({...campaignForm, start_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={campaignForm.end_date}
                onChange={(e) => setCampaignForm({...campaignForm, end_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Target Audience"
                value={campaignForm.target_audience}
                onChange={(e) => setCampaignForm({...campaignForm, target_audience: e.target.value})}
                placeholder="Students, Staff, General Public..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Objectives"
                value={campaignForm.objectives}
                onChange={(e) => setCampaignForm({...campaignForm, objectives: e.target.value})}
                placeholder="What are the goals of this campaign?"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Call to Action"
                value={campaignForm.call_to_action}
                onChange={(e) => setCampaignForm({...campaignForm, call_to_action: e.target.value})}
                placeholder="What action should people take?"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                value={campaignForm.tags}
                onChange={(e) => setCampaignForm({...campaignForm, tags: e.target.value})}
                placeholder="health, wellness, students (comma-separated)"
              />
            </Grid>

            {/* Content */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Content
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Content"
                value={campaignForm.content}
                onChange={(e) => setCampaignForm({...campaignForm, content: e.target.value})}
                placeholder="Detailed content for the campaign..."
                multiline
                rows={6}
              />
            </Grid>

            {/* Image Uploads */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Images
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Banner Image
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                  sx={{ py: 2 }}
                >
                  Upload Banner
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      console.log('Raw file input for banner:', file ? { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified } : null);
                      handleFileUpload('banner', file);
                    }}
                  />
                </Button>
                {bannerFile && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="success.main">
                      ✓ {bannerFile.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setBannerFile(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Thumbnail Image
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                  sx={{ py: 2 }}
                >
                  Upload Thumbnail
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      console.log('Raw file input for thumbnail:', file ? { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified } : null);
                      handleFileUpload('thumbnail', file);
                    }}
                  />
                </Button>
                {thumbnailFile && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="success.main">
                      ✓ {thumbnailFile.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setThumbnailFile(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  PubMat Image
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                  sx={{ py: 2 }}
                >
                  Upload PubMat
                  <input
                    type="file"
                    hidden
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      console.log('Raw file input for pubmat:', file ? { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified } : null);
                      handleFileUpload('pubmat', file);
                    }}
                  />
                </Button>
                {pubmatFile && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="success.main">
                      ✓ {pubmatFile.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setPubmatFile(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateCampaign}
            startIcon={<SaveIcon />}
          >
            Create Campaign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center">
            <EditIcon sx={{ mr: 2, color: 'primary.main' }} />
            Edit Campaign
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Campaign Title"
                value={campaignForm.title}
                onChange={(e) => setCampaignForm({...campaignForm, title: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Campaign Type</InputLabel>
                <Select
                  value={campaignForm.campaign_type}
                  label="Campaign Type"
                  onChange={(e) => setCampaignForm({...campaignForm, campaign_type: e.target.value})}
                >
                  {CAMPAIGN_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Summary"
                value={campaignForm.summary}
                onChange={(e) => setCampaignForm({...campaignForm, summary: e.target.value})}
                placeholder="Brief overview of the campaign..."
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Description"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({...campaignForm, description: e.target.value})}
                placeholder="Detailed description of the campaign..."
                multiline
                rows={4}
                required
              />
            </Grid>

            {/* Campaign Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Campaign Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={campaignForm.priority}
                  label="Priority"
                  onChange={(e) => setCampaignForm({...campaignForm, priority: e.target.value})}
                >
                  {PRIORITY_LEVELS.map(priority => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={campaignForm.status}
                  label="Status"
                  onChange={(e) => setCampaignForm({...campaignForm, status: e.target.value})}
                >
                  {STATUS_OPTIONS.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={campaignForm.start_date}
                onChange={(e) => setCampaignForm({...campaignForm, start_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={campaignForm.end_date}
                onChange={(e) => setCampaignForm({...campaignForm, end_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Image Uploads */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Update Images
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Banner Image
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                  sx={{ py: 2 }}
                >
                  Upload Banner
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      console.log('Raw file input for banner:', file ? { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified } : null);
                      handleFileUpload('banner', file);
                    }}
                  />
                </Button>
                {bannerFile && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="success.main">
                      ✓ {bannerFile.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setBannerFile(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                {!bannerFile && selectedCampaign?.banner_image_url && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Current banner uploaded
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Thumbnail Image
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                  sx={{ py: 2 }}
                >
                  Upload Thumbnail
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      console.log('Raw file input for thumbnail:', file ? { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified } : null);
                      handleFileUpload('thumbnail', file);
                    }}
                  />
                </Button>
                {thumbnailFile && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="success.main">
                      ✓ {thumbnailFile.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setThumbnailFile(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                {!thumbnailFile && selectedCampaign?.thumbnail_image_url && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Current thumbnail uploaded
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  PubMat Image
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                  sx={{ py: 2 }}
                >
                  Upload PubMat
                  <input
                    type="file"
                    hidden
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      console.log('Raw file input for pubmat:', file ? { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified } : null);
                      handleFileUpload('pubmat', file);
                    }}
                  />
                </Button>
                {pubmatFile && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="success.main">
                      ✓ {pubmatFile.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setPubmatFile(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                {!pubmatFile && selectedCampaign?.pubmat_image_url && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Current PubMat uploaded
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleEditCampaign}
            startIcon={<SaveIcon />}
          >
            Update Campaign
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Campaign Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selectedCampaign && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {selectedCampaign.title}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip 
                      label={getStatusInfo(selectedCampaign.status).label}
                      color={getStatusInfo(selectedCampaign.status).color}
                      size="small"
                    />
                    <Chip 
                      label={getCampaignTypeInfo(selectedCampaign.campaign_type).label}
                      color={getCampaignTypeInfo(selectedCampaign.campaign_type).color}
                      size="small"
                    />
                    {selectedCampaign.priority !== 'MEDIUM' && (
                      <Chip
                        label={getPriorityInfo(selectedCampaign.priority).label}
                        color={getPriorityInfo(selectedCampaign.priority).color}
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
                <IconButton onClick={() => setViewDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Campaign Images */}
              {(selectedCampaign.banner_image_url || selectedCampaign.thumbnail_image_url) && (
                <Box mb={3}>
                  <img
                    src={selectedCampaign.banner_image_url || selectedCampaign.thumbnail_image_url}
                    alt={selectedCampaign.title}
                    style={{
                      width: '100%',
                      maxHeight: 300,
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                </Box>
              )}

              {/* Campaign Info */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Duration
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedCampaign.start_date)} - {formatDate(selectedCampaign.end_date)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Created By
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedCampaign.created_by_name || 'System'}
                  </Typography>
                </Grid>
                
                {selectedCampaign.summary && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Summary
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedCampaign.summary}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedCampaign.description}
                  </Typography>
                </Grid>

                {selectedCampaign.content && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Content
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedCampaign.content}
                    </Typography>
                  </Grid>
                )}

                {selectedCampaign.objectives && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Objectives
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedCampaign.objectives}
                    </Typography>
                  </Grid>
                )}

                {selectedCampaign.target_audience && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Target Audience
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedCampaign.target_audience}
                    </Typography>
                  </Grid>
                )}

                {selectedCampaign.call_to_action && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Call to Action
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedCampaign.call_to_action}
                    </Typography>
                  </Grid>
                )}

                {/* Engagement Stats */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Engagement Statistics
                  </Typography>
                  <Box display="flex" gap={4}>
                    <Box display="flex" alignItems="center">
                      <VisibilityIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2">
                        {selectedCampaign.view_count || 0} views
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <TrendingIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2">
                        {selectedCampaign.engagement_count || 0} engagements
                      </Typography>
                    </Box>
                    {selectedCampaign.feedback_count > 0 && (
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2">
                          {selectedCampaign.feedback_count} feedback responses
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {selectedCampaign.tags && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tags
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {selectedCampaign.tags && typeof selectedCampaign.tags === 'string' && 
                        selectedCampaign.tags.split(',').map((tag, index) => (
                          <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                        ))
                      }
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              {isNonStudent && (
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setViewDialogOpen(false);
                      openEditDialog(selectedCampaign);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setViewDialogOpen(false);
                      openDeleteDialog(selectedCampaign);
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              )}
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center">
            <WarningIcon sx={{ mr: 2, color: 'error.main' }} />
            Delete Campaign
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this campaign?
          </Typography>
          {campaignToDelete && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>{campaignToDelete.title}</strong> will be permanently deleted. 
                This action cannot be undone.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteCampaign}
            startIcon={<DeleteIcon />}
          >
            Delete Campaign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CampaignsPage;