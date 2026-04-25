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
        // Fetch the current patient's medical and dental records
        const [medicalResponse, dentalResponse] = await Promise.all([
          patientService.getMyMedicalRecords(),
          patientService.getMyDentalRecords()
        ]);
        
        const medicalRecords = (Array.isArray(medicalResponse?.data) ? medicalResponse.data : []).map(r => ({ ...r, type: 'medical' }));
        const dentalRecords = (Array.isArray(dentalResponse?.data) ? dentalResponse.data : []).map(r => ({ ...r, type: 'dental' }));
        
        // Combine and sort by date (visit_date or created_at)
        const combined = [...medicalRecords, ...dentalRecords].sort((a, b) => {
          const dateA = new Date(a.visit_date || a.created_at);
          const dateB = new Date(b.visit_date || b.created_at);
          return dateB - dateA;
        });
        
        setRecords(combined);
      } catch (err) {
        console.error("Error fetching user records for feedback:", err);
        setError('Failed to load recent visits for feedback selection.');
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
            <ListItem key={`${rec.type}-${rec.id}`} divider>
              <ListItemText
                primary={`${rec.type === 'dental' ? 'Dental' : 'Medical'} visit on ${new Date(rec.visit_date || rec.created_at).toLocaleDateString()}`}
                secondary={rec.type === 'dental' ? (rec.procedure_performed_display || 'Consultation') : (rec.diagnosis ? `Diagnosis: ${rec.diagnosis}` : '')}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/feedback/${rec.id}?type=${rec.type}`)}
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