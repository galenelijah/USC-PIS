import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress
} from '@mui/material';
import { consultationService } from '../services/api';

const ConsultationHistory = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchConsultations = async () => {
      setLoading(true);
      try {
        const apiResponse = await consultationService.getAll(); // apiResponse is the full Axios response
        
        if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
          setConsultations(apiResponse.data);
        } else {
          // Log a warning if the data field is present but not an array, or if response/data is missing
          console.warn(
            'Consultations API did not return an array in the data field or response/data was missing. Response received:',
            apiResponse
          );
          setConsultations([]); // Default to an empty array
        }
      } catch (err) {
        console.error('Error fetching consultations:', err);
        setError('Failed to load consultation history. Please try again later.');
        setConsultations([]); // Ensure consultations is an array even on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsultations();
  }, []);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };
  
  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 'bold', mb: 2 }}>
        Consultation History
      </Typography>
      
      {consultations.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          No consultation records found.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="consultation history table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date/Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Chief Complaints</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Treatment Plan</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Remarks/Results</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {consultations.map((consultation) => (
                <TableRow key={consultation.id} hover>
                  <TableCell>{formatDateTime(consultation.date_time)}</TableCell>
                  <TableCell>{consultation.chief_complaints}</TableCell>
                  <TableCell>{consultation.treatment_plan}</TableCell>
                  <TableCell>{consultation.remarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ConsultationHistory; 