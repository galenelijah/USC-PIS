import React, { memo, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Box,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getSexLabel } from '../../utils/fieldMappers';

const PatientRow = memo(({ patient, onEdit, onDelete }) => (
  <TableRow key={patient.id}>
    <TableCell>{patient.usc_id || 'N/A'}</TableCell>
    <TableCell>{`${patient.first_name} ${patient.last_name}`}</TableCell>
    <TableCell>{patient.date_of_birth}</TableCell>
    <TableCell>{getSexLabel(patient.gender)}</TableCell>
    <TableCell>{patient.email}</TableCell>
    <TableCell>{patient.phone_number}</TableCell>
    <TableCell>
      <IconButton onClick={() => onEdit(patient)}>
        <EditIcon />
      </IconButton>
      <IconButton onClick={() => onDelete(patient.id)}>
        <DeleteIcon />
      </IconButton>
    </TableCell>
  </TableRow>
));

PatientRow.displayName = 'PatientRow';

const PatientList = memo(({ patients, onEdit, onDelete }) => {
  const sortedPatients = useMemo(() => {
    return [...(patients || [])].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  }, [patients]);
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary">
          Add New Patient
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>USC ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPatients.map((patient) => (
              <PatientRow 
                key={patient.id} 
                patient={patient} 
                onEdit={onEdit} 
                onDelete={onDelete} 
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

PatientList.displayName = 'PatientList';

export default PatientList; 