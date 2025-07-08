import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/api';

const FeedbackSelector = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch the current patient's medical records using the new service method
        const response = await patientService.getMyMedicalRecords();
        // Ensure response.data is always an array
        setRecords(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching user medical records:", err);
        setError('Failed to load medical records for feedback selection.');
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }} elevation={3}>
      <Typography variant="h5" gutterBottom>Leave Feedback</Typography>
      <Typography variant="body1" gutterBottom>
        Select a recent visit to leave feedback, or submit general feedback.
      </Typography>
      <Box sx={{ my: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => navigate('/feedback/general')}
        >
          General Feedback (not tied to a visit)
        </Button>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <List>
          {records.length === 0 && (
            <ListItem>
              <ListItemText primary="No recent visits found." />
            </ListItem>
          )}
          {records.map((rec) => (
            <ListItem key={rec.id} divider>
              <ListItemText
                primary={`Visit on ${rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'Unknown date'}`}
                secondary={rec.diagnosis ? `Diagnosis: ${rec.diagnosis}` : ''}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/feedback/${rec.id}`)}
              >
                Leave Feedback
              </Button>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default FeedbackSelector; 