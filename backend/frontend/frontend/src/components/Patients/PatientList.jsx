import React, { memo, useMemo } from 'react';
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
} from '@mui/material';
import { getSexLabel } from '../../utils/fieldMappers';

const PatientRow = memo(({ patient }) => (
  <TableRow key={patient.id}>
    <TableCell>{patient.usc_id || 'N/A'}</TableCell>
    <TableCell>{`${patient.first_name} ${patient.last_name}`}</TableCell>
    <TableCell>{patient.date_of_birth}</TableCell>
    <TableCell>{getSexLabel(patient.gender)}</TableCell>
    <TableCell>{patient.email}</TableCell>
    <TableCell>{patient.phone_number}</TableCell>
  </TableRow>
));

PatientRow.displayName = 'PatientRow';

// Mobile Patient Card Component
const PatientCard = memo(({ patient }) => (
  <Card className="mobile-table-card" sx={{ mb: 2 }}>
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
        </Box>
      </Box>
      
      <Box className="mobile-table-row">
        <Typography className="mobile-table-label">Email:</Typography>
        <Typography className="mobile-table-value">{patient.email}</Typography>
      </Box>
      
      <Box className="mobile-table-row">
        <Typography className="mobile-table-label">Phone:</Typography>
        <Typography className="mobile-table-value">{patient.phone_number || 'N/A'}</Typography>
      </Box>
      
      <Box className="mobile-table-row">
        <Typography className="mobile-table-label">Date of Birth:</Typography>
        <Typography className="mobile-table-value">{patient.date_of_birth}</Typography>
      </Box>
      
      <Box className="mobile-table-row">
        <Typography className="mobile-table-label">Gender:</Typography>
        <Typography className="mobile-table-value">{getSexLabel(patient.gender)}</Typography>
      </Box>
    </CardContent>
  </Card>
));

PatientCard.displayName = 'PatientCard';

const PatientList = memo(({ patients }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Sort patients by creation date (newest first)
  const sortedPatients = useMemo(() => {
    if (!patients || patients.length === 0) return [];
    return [...patients].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [patients]);
  return (
    <Box>

        {/* Desktop Table View */}
        <TableContainer component={Paper} className="desktop-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>USC ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPatients.length > 0 ? (
                sortedPatients.map((patient) => (
                  <PatientRow 
                    key={patient.id} 
                    patient={patient} 
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No patients found in the system.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Card View */}
        <Box className="mobile-table-card" sx={{ display: { xs: 'block', md: 'none' } }}>
          {sortedPatients.length > 0 ? (
            sortedPatients.map((patient) => (
              <PatientCard 
                key={patient.id} 
                patient={patient} 
              />
            ))
          ) : (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No patients found in the system.
              </Typography>
            </Card>
          )}
        </Box>
      </Box>
  );
});

PatientList.displayName = 'PatientList';

export default PatientList; 