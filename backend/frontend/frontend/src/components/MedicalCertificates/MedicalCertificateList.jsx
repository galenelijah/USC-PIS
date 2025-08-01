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
} from '@mui/icons-material';
import { format } from 'date-fns';
import { medicalCertificateService } from '../../services/api';

const approvalStatusColors = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const fitnessStatusColors = {
  fit: 'success',
  not_fit: 'error',
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
          {format(new Date(certificate.valid_from), 'MMM d, yyyy')} - {format(new Date(certificate.valid_until), 'MMM d, yyyy')}
        </Typography>
      </Box>
      
      <Box className="mobile-table-row">
        <Typography className="mobile-table-label">Fitness Status:</Typography>
        <Box className="mobile-table-value">
          <Chip
            label={certificate.fitness_status === 'fit' ? 'Fit' : 'Not Fit'}
            color={fitnessStatusColors[certificate.fitness_status]}
            size="small"
            variant={certificate.fitness_status === 'not_fit' ? 'filled' : 'outlined'}
          />
        </Box>
      </Box>
      
      <Box className="mobile-table-row">
        <Typography className="mobile-table-label">Approval Status:</Typography>
        <Box className="mobile-table-value">
          <Chip
            label={certificate.approval_status_display || certificate.approval_status?.replace('_', ' ')}
            color={approvalStatusColors[certificate.approval_status]}
            size="small"
          />
        </Box>
      </Box>
      
      {certificate.fitness_reason && certificate.fitness_status === 'not_fit' && (
        <Box className="mobile-table-row">
          <Typography className="mobile-table-label">Reason:</Typography>
          <Typography className="mobile-table-value" sx={{ fontSize: '0.75rem' }}>
            {certificate.fitness_reason.substring(0, 100)}...
          </Typography>
        </Box>
      )}
      
      <Box className="mobile-actions">
        <Button
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={() => onView(certificate)}
          size="small"
        >
          View
        </Button>
        {(certificate.approval_status === 'draft' || 
          ((userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'NURSE') && 
           certificate.approval_status !== 'approved')) && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => onEdit(certificate)}
            size="small"
          >
            Edit
          </Button>
        )}
        {certificate.approval_status === 'draft' && (
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

const MedicalCertificateList = ({ onView, onEdit, onDelete, userRole }) => {
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
  }, []);

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
    .filter((cert) => statusFilter === 'all' || cert.approval_status === statusFilter)
    .filter((cert) => 
      searchQuery === '' ||
      cert.patient_details?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.patient_details?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.fitness_status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return <Typography>Loading certificates...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
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
          label="Status"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
      </Stack>

      {/* Desktop Table View */}
      <TableContainer component={Paper} className="desktop-table">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient Name</TableCell>
              <TableCell>Diagnosis</TableCell>
              <TableCell>Valid From</TableCell>
              <TableCell>Valid Until</TableCell>
              <TableCell>Fitness Status</TableCell>
              <TableCell>Approval Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCertificates
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((certificate) => (
                <TableRow key={certificate.id}>
                  <TableCell>
                    {certificate.patient_details?.first_name} {certificate.patient_details?.last_name}
                  </TableCell>
                  <TableCell>{certificate.diagnosis}</TableCell>
                  <TableCell>{format(new Date(certificate.valid_from), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(certificate.valid_until), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Chip
                      label={certificate.fitness_status === 'fit' ? 'Fit' : 'Not Fit'}
                      color={fitnessStatusColors[certificate.fitness_status]}
                      size="small"
                      variant={certificate.fitness_status === 'not_fit' ? 'filled' : 'outlined'}
                    />
                    {certificate.fitness_reason && certificate.fitness_status === 'not_fit' && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {certificate.fitness_reason.substring(0, 50)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={certificate.approval_status_display || certificate.approval_status?.replace('_', ' ')}
                      color={approvalStatusColors[certificate.approval_status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => onView(certificate)}>
                      <VisibilityIcon />
                    </IconButton>
                    {/* Show edit button for draft certificates or medical professionals on non-approved certificates */}
                    {(certificate.approval_status === 'draft' || 
                      ((userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'NURSE') && 
                       certificate.approval_status !== 'approved')) && (
                      <IconButton 
                        onClick={() => onEdit(certificate)}
                        title={certificate.approval_status === 'draft' ? 'Edit Certificate' : 'Edit Fitness Status & Medical Details'}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {/* Only allow delete for draft certificates */}
                    {certificate.approval_status === 'draft' && (
                      <IconButton onClick={() => onDelete(certificate)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Mobile Card View */}
      <Box className="mobile-table-card" sx={{ display: { xs: 'block', md: 'none' } }}>
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
        
        {/* Mobile Pagination */}
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