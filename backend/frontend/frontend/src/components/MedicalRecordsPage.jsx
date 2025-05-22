import React, { useEffect, useState } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from '@mui/material';
import MedicalRecord from './MedicalRecord';
import { healthRecordsService } from '../services/api';

const MedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await healthRecordsService.getAll();
        setRecords(response.data || []);
      } catch (err) {
        setError('Failed to load medical records.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const handleRowClick = (id) => {
    setSelectedRecordId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRecordId(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Medical Records</Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : records.length === 0 ? (
        <Typography>No medical records found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxWidth: 900 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Treatment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{record.visit_date}</TableCell>
                  <TableCell>{record.diagnosis}</TableCell>
                  <TableCell>{record.treatment}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleRowClick(record.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>Medical Record Details</DialogTitle>
        <DialogContent dividers>
          {selectedRecordId && <MedicalRecord medicalRecordId={selectedRecordId} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecordsPage; 