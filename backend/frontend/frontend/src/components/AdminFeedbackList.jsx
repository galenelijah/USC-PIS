import React, { useEffect, useState } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Box, Chip } from '@mui/material';
import { feedbackService, patientService } from '../services/api';

const AdminFeedbackList = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await feedbackService.getAll();
        setFeedback(response.data || []);
      } catch (err) {
        setError('Failed to load feedback.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto', mt: 4 }} elevation={3}>
      <Typography variant="h5" gutterBottom>All Patient Feedback</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Comments</TableCell>
                <TableCell>Staff Courteous</TableCell>
                <TableCell>Recommend</TableCell>
                <TableCell>Improvement</TableCell>
                <TableCell>Visit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedback.map((fb) => (
                <TableRow key={fb.id}>
                  <TableCell>{fb.created_at ? new Date(fb.created_at).toLocaleDateString() : ''}</TableCell>
                  <TableCell>{fb.patient ? (fb.patient.first_name || '') + ' ' + (fb.patient.last_name || '') : 'Unknown'}</TableCell>
                  <TableCell>{fb.rating}</TableCell>
                  <TableCell>{fb.comments}</TableCell>
                  <TableCell>{fb.courteous ? fb.courteous.charAt(0).toUpperCase() + fb.courteous.slice(1) : ''}</TableCell>
                  <TableCell>{fb.recommend ? fb.recommend.charAt(0).toUpperCase() + fb.recommend.slice(1) : ''}</TableCell>
                  <TableCell>{fb.improvement}</TableCell>
                  <TableCell>
                    {fb.medical_record ? (
                      <Chip label={`Visit #${fb.medical_record}`} color="primary" size="small" />
                    ) : (
                      <Chip label="General" color="secondary" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default AdminFeedbackList; 