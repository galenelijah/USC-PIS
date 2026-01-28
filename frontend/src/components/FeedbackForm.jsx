import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Rating, 
  TextField, 
  Button, 
  Snackbar, 
  Alert, 
  Paper, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Divider, 
  CircularProgress 
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { feedbackSchema } from '../utils/validationSchemas';
import { feedbackService } from '../services/api';

const FeedbackForm = ({ medicalRecordId, onSubmitted }) => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasExistingFeedback, setHasExistingFeedback] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  
  const { handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: yupResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      comments: '',
      courteous: '',
      recommend: '',
      improvement: ''
    }
  });

  useEffect(() => {
    const checkExistingFeedback = async () => {
      try {
        setCheckingExisting(true);
        const response = await feedbackService.checkExisting(medicalRecordId);
        setHasExistingFeedback(response.data.has_feedback);
      } catch (err) {
        console.error('Error checking existing feedback:', err);
        // If we can't check, allow them to try submitting
        setHasExistingFeedback(false);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkExistingFeedback();
  }, [medicalRecordId]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      await feedbackService.submitFeedback({
        medical_record: medicalRecordId !== 'general' ? medicalRecordId : null,
        ...data
      });
      setSuccess(true);
      reset();
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error('Feedback submission error:', err);
      // Handle specific error messages from the backend
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.response && err.response.status === 403) {
        setError('You have already submitted feedback for this visit.');
      } else {
        setError('Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingExisting) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Checking existing feedback...
        </Typography>
      </Box>
    );
  }

  if (hasExistingFeedback) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Feedback Already Submitted
        </Typography>
        <Typography variant="body1" color="textSecondary">
          You have already provided feedback for this medical record. Thank you for your input!
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        Share Your Feedback
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Your feedback helps us improve our services. All fields marked with * are required.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Rating */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Overall Rating *
          </Typography>
          <Controller
            name="rating"
            control={control}
            render={({ field }) => (
              <Box>
                <Rating
                  {...field}
                  size="large"
                  onChange={(event, newValue) => {
                    field.onChange(newValue);
                  }}
                />
                {errors.rating && (
                  <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                    {errors.rating.message}
                  </Typography>
                )}
              </Box>
            )}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Courteous Staff */}
        <Box sx={{ mb: 3 }}>
          <Controller
            name="courteous"
            control={control}
            render={({ field }) => (
              <FormControl error={!!errors.courteous}>
                <FormLabel component="legend">
                  Were the staff members courteous and professional? *
                </FormLabel>
                <RadioGroup
                  {...field}
                  row
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
                {errors.courteous && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errors.courteous.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        </Box>

        {/* Recommend Service */}
        <Box sx={{ mb: 3 }}>
          <Controller
            name="recommend"
            control={control}
            render={({ field }) => (
              <FormControl error={!!errors.recommend}>
                <FormLabel component="legend">
                  Would you recommend our services to others? *
                </FormLabel>
                <RadioGroup
                  {...field}
                  row
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
                {errors.recommend && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errors.recommend.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Comments */}
        <Box sx={{ mb: 3 }}>
          <Controller
            name="comments"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={4}
                label="Additional Comments"
                placeholder="Please share any additional thoughts about your experience..."
                error={!!errors.comments}
                helperText={errors.comments?.message}
              />
            )}
          />
        </Box>

        {/* Improvement Suggestions */}
        <Box sx={{ mb: 3 }}>
          <Controller
            name="improvement"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label="Suggestions for Improvement"
                placeholder="How can we improve our services? Your suggestions are valuable to us..."
                error={!!errors.improvement}
                helperText={errors.improvement?.message}
              />
            )}
          />
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Submit Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
            sx={{ minWidth: 150 }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </Box>
      </form>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Thank you for your feedback! Your input helps us improve our services.
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default FeedbackForm;