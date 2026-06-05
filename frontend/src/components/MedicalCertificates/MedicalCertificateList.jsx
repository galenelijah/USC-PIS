import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Card,
  CardContent,
  Avatar,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { medicalCertificateService } from '../../services/api';
import { formatDatePH } from '../../utils/dateUtils';

const issuanceStatusColors = {
  draft: 'default',
  pending: 'warning',
  issued: 'success',
  rejected: 'error',
};

const fitnessStatusColors = {
  FIT: 'success',
  UNFIT: 'error',
  physically_fit: 'success', // Fallback for legacy data
  physically_unfit: 'error', // Fallback for legacy data
};

const fitnessStatusLabels = {
  FIT: 'Physically Fit',
  UNFIT: 'Physically Unfit',
  physically_fit: 'Physically Fit',
  physically_unfit: 'Physically Unfit',
};

// Mobile Certificate Card Component
const CertificateCard = ({ certificate, onView, onEdit, onDelete, userRole }) => (
  <Card className="mobile-table-card" sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
          {certificate.patient_details?.first_name?.charAt(0)}{certificate.patient_details?.last_name?.charAt(0)}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {certificate.patient_details?.first_name} {certificate.patient_details?.last_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {certificate.diagnosis}
          </Typography>
        </Box>
      </Box>
      
      <Box className="mobile-table-row">
        <Typography className="mobile-table-label">Valid Period:</Typography>
        <Typography className="mobile-table-value">
          {formatDatePH(certificate.valid_from)} - {formatDatePH(certificate.valid_until)}
        </Typography>
      </Box>
      
      <Box className="mobile-table-row">
        <Typography className="mobile-table-label">Fitness Status:</Typography>
        <Box className="mobile-table-value">
          <Chip
            label={fitnessStatusLabels[certificate.fitness_status] || certificate.fitness_status_display}
            color={fitnessStatusColors[certificate.fitness_status] || 'default'}
            size="small"
            variant={(certificate.fitness_status === 'UNFIT' || certificate.fitness_status === 'physically_unfit') ? 'filled' : 'outlined'}
          />
        </Box>
      </Box>
      
      <Box className="mobile-table-row">
        <Typography className="mobile-table-label">Issuance Status:</Typography>
        <Box className="mobile-table-value">
          <Chip
            label={certificate.issuance_status_display}
            color={issuanceStatusColors[certificate.issuance_status]}
            size="small"
          />
        </Box>
      </Box>
      
      <Box className="mobile-actions">
        <Button
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={() => onView(certificate)}
          size="small"
        >
          View
        </Button>
        {(certificate.issuance_status === 'draft' || 
          ((userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'NURSE') && 
           certificate.issuance_status !== 'issued' &&
           certificate.issuance_status !== 'rejected')) && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => onEdit(certificate)}
            size="small"
          >
            Edit
          </Button>
        )}
        {(certificate.issuance_status === 'draft' || 
          (userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'NURSE')) && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(certificate)}
            size="small"
          >
            Delete
          </Button>
        )}
      </Box>
    </CardContent>
  </Card>
);

const MedicalCertificateList = ({ onView, onEdit, onDelete, userRole, refreshTrigger }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [certificates, setCertificates] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, [refreshTrigger]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await medicalCertificateService.getAll();
      setCertificates(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch medical certificates');
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const filteredCertificates = certificates
    .filter((cert) => statusFilter === 'all' || cert.issuance_status === statusFilter)
    .filter((cert) => {
      if (searchQuery === '') return true;
      
      const query = searchQuery.toLowerCase().trim();
      const patientName = `${cert.patient_details?.first_name || ''} ${cert.patient_details?.last_name || ''}`.toLowerCase();
      
      const fitnessStatus = (cert.fitness_status_display || '').toLowerCase();
      const issuanceStatus = (cert.issuance_status_display || '').toLowerCase();
      const diagnosis = (cert.diagnosis || '').toLowerCase();
      
      return (
        patientName.includes(query) ||
        diagnosis.includes(query) ||
        fitnessStatus.includes(query) ||
        issuanceStatus.includes(query)
      );
    });

  if (loading) {
    return <Typography sx={{ p: 2 }}>Loading certificates...</Typography>;
  }

  if (error) {
    return <Typography color="error" sx={{ p: 2 }}>{error}</Typography>;
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          label="Issuance Status"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="issued">Issued</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchCertificates}
          disabled={loading}
          sx={{ minWidth: 'auto' }}
        >
          Refresh
        </Button>
      </Stack>

      {/* Desktop Table View */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, width: '100%', overflow: 'hidden' }}>
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell>Patient Name</TableCell>
              <TableCell>Purpose/Requirement</TableCell>
              <TableCell>Valid From</TableCell>
              <TableCell>Valid Until</TableCell>
              <TableCell>Fitness Status</TableCell>
              <TableCell>Issuance Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCertificates
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((certificate) => (
                <TableRow key={certificate.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {certificate.patient_details?.first_name} {certificate.patient_details?.last_name}
                  </TableCell>
                  <TableCell>{certificate.diagnosis}</TableCell>
                  <TableCell>{formatDatePH(certificate.valid_from)}</TableCell>
                  <TableCell>{formatDatePH(certificate.valid_until)}</TableCell>
                  <TableCell>
                    <Chip
                      label={fitnessStatusLabels[certificate.fitness_status] || certificate.fitness_status_display}
                      color={fitnessStatusColors[certificate.fitness_status] || 'default'}
                      size="small"
                      variant={(certificate.fitness_status === 'UNFIT' || certificate.fitness_status === 'physically_unfit') ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={certificate.issuance_status_display}
                      color={issuanceStatusColors[certificate.issuance_status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => onView(certificate)} title="View Details">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {(certificate.issuance_status === 'draft' || 
                        ((userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'NURSE') && 
                         certificate.issuance_status !== 'issued' &&
                         certificate.issuance_status !== 'rejected')) && (
                        <IconButton 
                          size="small"
                          onClick={() => onEdit(certificate)}
                          title={certificate.issuance_status === 'draft' ? 'Edit Certificate' : 'Update Medical Assessment'}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {(certificate.issuance_status === 'draft' || 
                        (userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'NURSE')) && (
                        <IconButton 
                          size="small"
                          onClick={() => onDelete(certificate)}
                          title="Delete Certificate"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            {filteredCertificates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  No medical certificates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCertificates.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        </TableContainer>
      </Box>

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filteredCertificates
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((certificate) => (
            <CertificateCard 
              key={certificate.id} 
              certificate={certificate} 
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              userRole={userRole}
            />
          ))}
        
        {filteredCertificates.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            No medical certificates found.
          </Paper>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCertificates.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              '& .MuiTablePagination-toolbar': {
                flexWrap: 'wrap',
                justifyContent: 'center',
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MedicalCertificateList;
