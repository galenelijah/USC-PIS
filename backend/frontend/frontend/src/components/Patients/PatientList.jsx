import React from 'react';
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

const PatientList = ({ patients, onEdit, onDelete }) => {
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
              <TableCell>Name</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients?.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>{`${patient.first_name} ${patient.last_name}`}</TableCell>
                <TableCell>{patient.date_of_birth}</TableCell>
                <TableCell>{patient.gender}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PatientList; 