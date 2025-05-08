import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
  CircularProgress,
  Button,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { consultationService } from '../services/api';
import { selectCurrentUser } from '../features/authentication/authSlice';
import ConsultationFormModal from './ConsultationFormModal';

const ConsultationHistory = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const currentUser = useSelector(selectCurrentUser);
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentConsultationData, setCurrentConsultationData] = useState(null);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const apiResponse = await consultationService.getAll();
      if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
        setConsultations(apiResponse.data);
      } else {
        console.warn(
          'Consultations API did not return an array in the data field or response/data was missing. Response received:',
          apiResponse
        );
        setConsultations([]);
      }
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setError('Failed to load consultation history. Please try again later.');
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const handleOpenModal = (consultation = null) => {
    setCurrentConsultationData(consultation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentConsultationData(null);
  };

  const handleSaveConsultation = () => {
    fetchConsultations();
    handleCloseModal();
  };

  const handleDelete = async (consultationId) => {
    if (window.confirm('Are you sure you want to delete this consultation record?')) {
      try {
        await consultationService.delete(consultationId);
        alert('Consultation record deleted successfully.');
        fetchConsultations();
      } catch (err) {
        console.error('Error deleting consultation:', err);
        alert('Failed to delete consultation record.');
      }
    }
  };

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
          Consultation History
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
          >
            Add New Consultation
          </Button>
        )}
      </Box>
      
      {consultations.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          No consultation records found.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="consultation history table">
            <TableHead>
              <TableRow>
                {isAdmin && <TableCell sx={{ fontWeight: 'bold' }}>Patient ID</TableCell>}
                <TableCell sx={{ fontWeight: 'bold' }}>Date/Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Chief Complaints</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Treatment Plan</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Remarks/Results</TableCell>
                {isAdmin && <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {consultations.map((consultation) => (
                <TableRow key={consultation.id} hover>
                  {isAdmin && <TableCell>{consultation.patient}</TableCell>}
                  <TableCell>{formatDateTime(consultation.date_time)}</TableCell>
                  <TableCell>{consultation.chief_complaints}</TableCell>
                  <TableCell>{consultation.treatment_plan}</TableCell>
                  <TableCell>{consultation.remarks}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <IconButton onClick={() => handleOpenModal(consultation)} color="primary" size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(consultation.id)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {isAdmin && (
        <ConsultationFormModal
          open={isModalOpen}
          onClose={handleCloseModal}
          consultationData={currentConsultationData}
          onSave={handleSaveConsultation}
        />
      )}
    </Box>
  );
};

export default ConsultationHistory; 