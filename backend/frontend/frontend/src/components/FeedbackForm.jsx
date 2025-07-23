import React, { useState, useEffect } from 'react';
import { Box, Typography, Rating, TextField, Button, Snackbar, Alert, Paper, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Divider, CircularProgress } from '@mui/material';
import { feedbackService } from '../services/api';

const FeedbackForm = ({ medicalRecordId, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [courteous, setCourteous] = useState('');
  const [recommend, setRecommend] = useState('');
  const [improvement, setImprovement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasExistingFeedback, setHasExistingFeedback] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await feedbackService.submitFeedback({
        medical_record: medicalRecordId !== 'general' ? medicalRecordId : null,
        rating,
        comments,
        courteous,
        recommend,
        improvement,
      });
      setSuccess(true);
      setRating(0);
      setComments('');
      setCourteous('');
      setRecommend('');
      setImprovement('');
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
      <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4 }} elevation={3}>
        <Box display="flex" alignItems="center" justifyContent="center" p={4}>
          <CircularProgress size={30} />
          <Typography variant="body1" sx={{ ml: 2 }}>Checking feedback status...</Typography>
        </Box>
      </Paper>
    );
  }

  if (hasExistingFeedback) {
    return (
      <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4 }} elevation={3}>
        <Typography variant="h5" gutterBottom>Feedback Already Submitted</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          {medicalRecordId !== 'general'
            ? 'You have already submitted feedback for this medical visit.'
            : 'You have already submitted general feedback about our clinic.'}
        </Alert>
        <Typography variant="body1" color="text.secondary">
          Thank you for your previous feedback. Each patient can only submit feedback once 
          {medicalRecordId !== 'general' ? ' per visit' : ''} to ensure the integrity of our feedback system.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4 }} elevation={3}>
      <Typography variant="h5" gutterBottom>Patient Feedback</Typography>
      <Typography variant="body1" gutterBottom>
        {medicalRecordId !== 'general'
          ? 'Please rate your experience for this visit and leave any comments below.'
          : 'Please provide your general feedback about our clinic.'}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Overall Experience</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Rating
            name="rating"
            value={rating}
            onChange={(_, newValue) => setRating(newValue)}
            size="large"
          />
        </Box>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Was the staff courteous?</FormLabel>
          <RadioGroup
            row
            value={courteous}
            onChange={e => setCourteous(e.target.value)}
          >
            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Would you recommend us?</FormLabel>
          <RadioGroup
            row
            value={recommend}
            onChange={e => setRecommend(e.target.value)}
          >
            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>
        <TextField
          label="Comments (optional)"
          multiline
          minRows={3}
          fullWidth
          value={comments}
          onChange={e => setComments(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <TextField
          label="What could we improve? (optional)"
          multiline
          minRows={2}
          fullWidth
          value={improvement}
          onChange={e => setImprovement(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={submitting || !rating}
          fullWidth
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </Box>
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Thank you for your feedback!
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default FeedbackForm; 