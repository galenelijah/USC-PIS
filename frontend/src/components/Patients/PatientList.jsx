import React, { memo, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  useTheme,
  useMediaQuery,
  TablePagination,
} from '@mui/material';
import { getSexLabel } from '../../utils/fieldMappers';
import { ProgramsChoices } from '../static/choices';

// Helper to get course label from ID
const getCourseLabel = (courseId) => {
  if (!courseId) return 'N/A';
  // Try to find by ID (handling both string and number inputs)
  const course = ProgramsChoices.find(c => c.id == courseId);
  return course ? course.label : courseId; // Fallback to ID if not found (e.g. if it was saved as text)
};

const PatientRow = memo(({ patient, onClick }) => (
  <TableRow 
    key={patient.id} 
    hover 
    onClick={() => onClick(patient)}
    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
  >
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{patient.usc_id || 'N/A'}</TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{`${patient.first_name} ${patient.last_name}`}</TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{getCourseLabel(patient.course)}</TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{patient.date_of_birth}</TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{getSexLabel(patient.gender)}</TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{patient.email}</TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{patient.phone_number}</TableCell>
  </TableRow>
));

PatientRow.displayName = 'PatientRow';

// Mobile Patient Card Component
const PatientCard = memo(({ patient, onClick }) => (
  <Card 
    className="mobile-table-card" 
    sx={{ mb: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
    onClick={() => onClick(patient)}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
          {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {`${patient.first_name} ${patient.last_name}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {patient.usc_id || 'No USC ID'}
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
            {getCourseLabel(patient.course)}
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Email:</Typography>
        <Typography variant="caption">{patient.email}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Phone:</Typography>
        <Typography variant="caption">{patient.phone_number || 'N/A'}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Date of Birth:</Typography>
        <Typography variant="caption">{patient.date_of_birth}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Gender:</Typography>
        <Typography variant="caption">{getSexLabel(patient.gender)}</Typography>
      </Box>
    </CardContent>
  </Card>
));

PatientCard.displayName = 'PatientCard';

const PatientList = memo(({ patients, onPatientClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sort patients by creation date (newest first)
  const sortedPatients = useMemo(() => {
    if (!patients || patients.length === 0) return [];
    return [...patients].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [patients]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedPatients = useMemo(() => {
    return sortedPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedPatients, page, rowsPerPage]);

  return (
    <Box>
      {/* Desktop Table View */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={1} sx={{ overflowX: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>USC ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Date of Birth</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Gender</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Phone</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient) => (
                  <PatientRow 
                    key={patient.id} 
                    patient={patient} 
                    onClick={onPatientClick}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No patients found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={sortedPatients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Showing {paginatedPatients.length} of {sortedPatients.length} patients
          </Typography>
        </Box>
        
        {paginatedPatients.length > 0 ? (
          paginatedPatients.map((patient) => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              onClick={onPatientClick}
            />
          ))
        ) : (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No patients found.
            </Typography>
          </Card>
        )}
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          component="div"
          count={sortedPatients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ mt: 2 }}
        />
      </Box>
    </Box>
  );
});

PatientList.displayName = 'PatientList';

export default PatientList;
