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
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as ViewIcon 
} from '@mui/icons-material';
import { consultationService } from '../services/api';
import { selectCurrentUser } from '../features/authentication/authSlice';
import { extractErrorMessage } from '../utils/errorUtils';
import ConsultationFormModal from './ConsultationFormModal';
import logger from '../utils/logger';

const ConsultationHistory = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const currentUser = useSelector(selectCurrentUser);
  // ADMIN, DOCTOR, and NURSE have CRUD for general consultations.
  // DENTIST, STAFF, and FACULTY are view-only.
  const isAuthorizedToEdit = currentUser && ['ADMIN', 'DOCTOR', 'NURSE'].includes(currentUser.role);
  // All clinic staff can see the columns and actions if they are authorized
  const isClinicStaff = currentUser && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'].includes(currentUser.role);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentConsultationData, setCurrentConsultationData] = useState(null);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const apiResponse = await consultationService.getAll();
      if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
        setConsultations(apiResponse.data);
      } else {
        logger.warn(
          'Consultations API did not return an array in the data field or response/data was missing. Response received:',
          apiResponse
        );
        setConsultations([]);
      }
    } catch (err) {
      logger.error('Error fetching consultations:', err);
      setError(extractErrorMessage(err));
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
        logger.error('Error deleting consultation:', err);
        alert(`Failed to delete consultation record: ${extractErrorMessage(err)}`);
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
      logger.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };
  
  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
          Consultation History
        </Typography>
        {isAuthorizedToEdit && (
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
      
      <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {isClinicStaff && <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>}
              <TableCell sx={{ fontWeight: 'bold' }}>Date/Time</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Chief Complaints</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Treatment Plan</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Remarks/Results</TableCell>
              {isClinicStaff && <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {consultations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isClinicStaff ? 6 : 5} align="center">
                  No consultation records found.
                </TableCell>
              </TableRow>
            ) : (
              consultations.map((consultation) => (
                <TableRow key={consultation.id} hover>
                  {isClinicStaff && (
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {consultation.patient_name || `Patient ID: ${consultation.patient}`}
                      </Typography>
                      {consultation.patient_usc_id && (
                        <Typography variant="caption" color="text.secondary">
                          USC ID: {consultation.patient_usc_id}
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{formatDateTime(consultation.date_time)}</TableCell>
                  <TableCell>{consultation.chief_complaints}</TableCell>
                  <TableCell>{consultation.treatment_plan}</TableCell>
                  <TableCell>{consultation.remarks}</TableCell>
                  {isClinicStaff && (
                    <TableCell>
                      {isAuthorizedToEdit && (
                        <IconButton onClick={() => handleOpenModal(consultation)} color="primary" size="small">
                          <EditIcon />
                        </IconButton>
                      )}
                      {isAuthorizedToEdit && (
                        <IconButton onClick={() => handleDelete(consultation.id)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      )}
                      {!isAuthorizedToEdit && (
                        <IconButton onClick={() => handleOpenModal(consultation)} color="info" size="small">
                          <ViewIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {isClinicStaff && (
        <ConsultationFormModal
          open={isModalOpen}
          onClose={handleCloseModal}
          consultationData={currentConsultationData}
          onSave={handleSaveConsultation}
          readOnly={!isAuthorizedToEdit}
        />
      )}
    </Box>
  );
};

export default ConsultationHistory; 
