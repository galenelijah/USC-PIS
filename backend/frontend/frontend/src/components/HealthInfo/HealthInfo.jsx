import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  useTheme,
  Chip,
  Card,
  CardContent,
  CardActions,
  CardMedia,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import ImageUpload from '../common/ImageUpload';
import ImageViewer from '../common/ImageViewer';
import ContentViewer from '../common/ContentViewer';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { healthInfoSchema } from '../../utils/validationSchemas';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHealthInfo, addHealthInfo, updateHealthInfo, deleteHealthInfo, setEditing, clearEditing } from '../../features/healthInfoSlice';
import { selectCurrentUser } from '../../features/authentication/authSlice';

const HealthInfo = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { list: healthInfo = [], loading, error, editing } = useSelector(state => state.healthInfo);
  const user = useSelector(selectCurrentUser);
  const { handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: yupResolver(healthInfoSchema),
    defaultValues: {
      title: '',
      content: '',
      category: ''
    }
  });

  // State for image handling and viewers
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [contentViewerOpen, setContentViewerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewerImages, setViewerImages] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => { dispatch(fetchHealthInfo()); }, [dispatch]);
  useEffect(() => {
    if (editing) {
      reset(editing);
      // Load existing images if editing
      setUploadedImages(editing.images || []);
    } else {
      reset({ title: '', content: '', category: '' });
      setUploadedImages([]);
    }
  }, [editing, reset]);

  const isStaffOrMedical = user && ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(user.role);
  const isStudent = user && user.role === 'STUDENT';
  const isPatient = user && user.role === 'PATIENT';
  const isReadOnly = !isStaffOrMedical;

  const onSubmit = (data) => {
    const formData = new FormData();
    
    // Add form fields
    Object.keys(data).forEach(key => {
      if (data[key]) {
        formData.append(key, data[key]);
      }
    });

    // Add images if any
    if (uploadedImages.length > 0) {
      uploadedImages.forEach((image, index) => {
        if (image.file) {
          formData.append(`images`, image.file);
        }
      });
    }
    
    if (editing) {
      dispatch(updateHealthInfo({ id: editing.id, data: formData })).then(() => {
        dispatch(clearEditing());
        dispatch(fetchHealthInfo()); // Refresh list to show updated images
        setUploadedImages([]);
      });
    } else {
      dispatch(addHealthInfo(formData)).then(() => {
        // Refresh the health info list to show new item with images
        dispatch(fetchHealthInfo());
        setUploadedImages([]);
      });
    }
    reset({ title: '', content: '', category: '' });
  };

  const handleViewContent = (item) => {
    setSelectedItem(item);
    setContentViewerOpen(true);
  };

  const handleViewImages = (images, index = 0) => {
    setViewerImages(images);
    setImageIndex(index);
    setImageViewerOpen(true);
  };

  const handleCancelEdit = () => {
    dispatch(clearEditing());
    setUploadedImages([]);
    reset({ title: '', content: '', category: '' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        Health Information Dissemination
      </Typography>
      <Box sx={{ mb: 2 }}>
        {isStaffOrMedical && <Typography color="success.main">Admin/Staff/Doctor View</Typography>}
        {(isStudent || isPatient) && <Typography color="info.main">Patient/Student View (Read-Only)</Typography>}
      </Box>

      {/* Add/Edit Health Information (Staff/Admin/Doctor only) */}
      {isStaffOrMedical && (
        <Paper sx={{ p: 3, mb: 3, borderLeft: `4px solid ${theme.palette.primary.main}` }}>
          <Typography variant="h6" gutterBottom color="primary">
            {editing ? 'Edit Health Information' : 'Add New Health Information'}
          </Typography>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Title"
                      variant="outlined"
                      required
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Category"
                      variant="outlined"
                      required
                      error={!!errors.category}
                      helperText={errors.category?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      label="Content"
                      variant="outlined"
                      required
                      error={!!errors.content}
                      helperText={errors.content?.message}
                    />
                  )}
                />
              </Grid>
              
              {/* Image Upload Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                  Images (Optional)
                </Typography>
                <ImageUpload
                  images={uploadedImages}
                  onImagesChange={setUploadedImages}
                  maxImages={5}
                  maxSizeMB={5}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={editing ? <EditIcon /> : <AddIcon />}
                    type="submit"
                  >
                    {editing ? 'Update Information' : 'Add Information'}
                  </Button>
                  {editing && (
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {/* Health Information List */}
      <Paper sx={{ p: 3, borderLeft: `4px solid ${theme.palette.secondary.main}` }}>
        <Typography variant="h6" gutterBottom color="secondary">
          Health Information List
        </Typography>
        {loading && <Typography>Loading...</Typography>}
        {error && <Typography color="error">Error: {error}</Typography>}
        
        <Grid container spacing={3}>
          {healthInfo.map((info) => (
            <Grid item xs={12} md={6} lg={4} key={info.id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': { 
                    elevation: 4,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {/* Show first image as card header if available */}
                {info.images && info.images.length > 0 && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={info.images[0].url || info.images[0]}
                    alt={info.title}
                    sx={{ 
                      cursor: 'pointer',
                      objectFit: 'cover'
                    }}
                    onClick={() => handleViewImages(info.images, 0)}
                    onError={(e) => {
                      console.log('Image failed to load:', info.images[0]);
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                      {info.title}
                    </Typography>
                    <Chip 
                      label={info.category} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {info.content}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(info.created_at).toLocaleDateString()}
                    </Typography>
                    {info.images && info.images.length > 0 && (
                      <Chip 
                        icon={<ImageIcon />} 
                        label={`${info.images.length} image${info.images.length > 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewContent(info)}
                    variant="outlined"
                  >
                    View Full
                  </Button>
                  
                  {info.images && info.images.length > 0 && (
                    <Button
                      size="small"
                      startIcon={<ImageIcon />}
                      onClick={() => handleViewImages(info.images, 0)}
                      variant="outlined"
                      color="secondary"
                    >
                      Images ({info.images.length})
                    </Button>
                  )}
                  
                  {isStaffOrMedical && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => dispatch(setEditing(info))}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => dispatch(deleteHealthInfo(info.id))}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {healthInfo.length === 0 && !loading && (
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            No health information available yet.
          </Typography>
        )}
      </Paper>

      {/* Image Viewer Modal */}
      <ImageViewer
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        images={viewerImages}
        currentIndex={imageIndex}
        title="Health Information Images"
      />

      {/* Content Viewer Modal */}
      <ContentViewer
        open={contentViewerOpen}
        onClose={() => setContentViewerOpen(false)}
        title={selectedItem?.title || ''}
        content={selectedItem?.content || ''}
        category={selectedItem?.category || ''}
        date={selectedItem?.created_at || ''}
        images={selectedItem?.images || []}
      />
    </Box>
  );
};

export default HealthInfo; 