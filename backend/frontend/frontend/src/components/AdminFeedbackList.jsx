import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // No longer needed directly
import { feedbackService } from '../services/api'; // Import the service
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Box, Chip, TablePagination } from '@mui/material';
import FeedbackAnalytics from './FeedbackAnalytics'; // Import the new component

const AdminFeedbackList = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Or your preferred default

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the feedbackService
        const response = await feedbackService.getAll();
        setFeedback(response.data);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        // Use error message from service/interceptor if available
        setError(err.response?.data?.detail || err.message || 'Failed to load feedback list.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate feedback for the current page
  const currentFeedback = feedback.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Admin - Patient Feedback
      </Typography>

      <FeedbackAnalytics />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader aria-label="sticky feedback table">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Patient Email</TableCell>
                  <TableCell align="right">Rating (1-5)</TableCell>
                  <TableCell>Courteous?</TableCell>
                  <TableCell>Recommend?</TableCell>
                  <TableCell>Comments</TableCell>
                  <TableCell>Improvement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentFeedback.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No feedback submitted yet.</TableCell>
                  </TableRow>
                ) : (
                  currentFeedback.map((item) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={item.id}>
                      <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{item.patient_email || 'N/A'}</TableCell> 
                      <TableCell align="right">{item.rating}</TableCell>
                      <TableCell>{item.courteous || 'N/A'}</TableCell>
                      <TableCell>{item.recommend || 'N/A'}</TableCell>
                      <TableCell>{item.comments || '-'}</TableCell>
                      <TableCell>{item.improvement || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={feedback.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
};

export default AdminFeedbackList;