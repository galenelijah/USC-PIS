import React, { useEffect, useState } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress, TextField, InputAdornment, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MedicalRecord from './MedicalRecord';
import { healthRecordsService } from '../services/api';
import { useSelector } from 'react-redux';

const MedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const user = useSelector(state => state.auth.user);
  const isStaffOrMedical = user?.role && ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(user.role);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    // Filter records based on search term
    if (searchTerm.trim() === '') {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter(record => 
        record.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.treatment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.visit_date?.includes(searchTerm)
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, records]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthRecordsService.getAll();
      const recordsData = response.data || [];
      setRecords(recordsData);
      setFilteredRecords(recordsData);
    } catch (err) {
      setError('Failed to load medical records.');
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSelect = (id) => {
    setSelectedRecordId(id);
  };

  const handleCreateNew = () => {
    setSelectedRecordId(null);
  };

  const handleRecordSaved = () => {
    // Refresh the records list after a record is saved
    fetchRecords();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Medical Records
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isStaffOrMedical 
            ? 'Create, view, and manage medical records for all patients.' 
            : 'View your medical records and health information.'
          }
        </Typography>
      </Box>
      
      {/* Main Medical Record Form/View */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" color="primary">
            {selectedRecordId ? 'Medical Record Details' : 'New Medical Record'}
          </Typography>
          {isStaffOrMedical && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleCreateNew}
              disabled={!selectedRecordId}
              sx={{ borderRadius: 2 }}
            >
              Create New Record
            </Button>
          )}
        </Box>
        <MedicalRecord 
          medicalRecordId={selectedRecordId} 
          onRecordSaved={handleRecordSaved}
        />
      </Paper>

      {/* Records List Section */}
      <Paper sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary">
              Medical Records History
            </Typography>
            <Chip 
              label={`${filteredRecords.length} record${filteredRecords.length !== 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
            />
          </Box>
          
          {records.length > 0 && (
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by patient name, diagnosis, treatment, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />
          )}
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading medical records...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="error" variant="h6">{error}</Typography>
              <Button 
                variant="outlined" 
                onClick={fetchRecords} 
                sx={{ mt: 2 }}
              >
                Try Again
              </Button>
            </Box>
          ) : filteredRecords.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              {records.length === 0 ? (
                <>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No medical records found
                  </Typography>
                  <Typography color="text.secondary">
                    {isStaffOrMedical 
                      ? 'Create the first medical record using the form above.' 
                      : 'No medical records have been created for your account yet.'
                    }
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No records match your search
                  </Typography>
                  <Typography color="text.secondary">
                    Try adjusting your search terms or clear the search to see all records.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => setSearchTerm('')} 
                    sx={{ mt: 2 }}
                  >
                    Clear Search
                  </Button>
                </>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarTodayIcon sx={{ mr: 1, fontSize: 18 }} />
                        Date
                      </Box>
                    </TableCell>
                    {isStaffOrMedical && (
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                          Patient
                        </Box>
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 'bold' }}>Diagnosis</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Treatment</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow 
                      key={record.id} 
                      hover
                      selected={selectedRecordId === record.id}
                      sx={{ 
                        '&:hover': { backgroundColor: '#f9f9f9' },
                        backgroundColor: selectedRecordId === record.id ? '#e3f2fd' : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(record.visit_date)}
                        </Typography>
                      </TableCell>
                      {isStaffOrMedical && (
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {record.patient_name || `Patient ID: ${record.patient}`}
                          </Typography>
                          {record.patient_usc_id && (
                            <Typography variant="caption" color="text.secondary">
                              USC ID: {record.patient_usc_id}
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {record.diagnosis || 'No diagnosis recorded'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {record.treatment || 'No treatment recorded'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant={selectedRecordId === record.id ? "contained" : "outlined"}
                          color="primary"
                          onClick={() => handleRecordSelect(record.id)}
                          sx={{ borderRadius: 2 }}
                        >
                          {selectedRecordId === record.id ? 'Selected' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MedicalRecordsPage;
