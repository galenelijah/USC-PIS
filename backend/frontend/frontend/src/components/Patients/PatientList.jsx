import React, { memo, useMemo, useState, useCallback } from 'react';
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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Grid,
  Card,
  CardContent,
  Collapse,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
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

// Mobile Patient Card Component
const PatientCard = memo(({ patient, onEdit, onDelete }) => (
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
      
      <Box className="mobile-actions">
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => onEdit(patient)}
          size="small"
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(patient.id)}
          size="small"
        >
          Delete
        </Button>
      </Box>
    </CardContent>
  </Card>
));

PatientCard.displayName = 'PatientCard';

const PatientList = memo(({ patients, onEdit, onDelete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setGenderFilter('');
    setStartDate(null);
    setEndDate(null);
  }, []);

  // Filter and search logic
  const filteredAndSearchedPatients = useMemo(() => {
    let filtered = [...(patients || [])];

    // Text search across multiple fields
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.first_name?.toLowerCase().includes(searchLower) ||
        patient.last_name?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.usc_id?.toLowerCase().includes(searchLower) ||
        patient.phone_number?.toLowerCase().includes(searchLower) ||
        patient.address?.toLowerCase().includes(searchLower) ||
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchLower)
      );
    }

    // Gender filter
    if (genderFilter) {
      filtered = filtered.filter(patient => patient.gender === genderFilter);
    }

    // Date range filter (registration date)
    if (startDate) {
      filtered = filtered.filter(patient => 
        dayjs(patient.created_at).isAfter(dayjs(startDate).subtract(1, 'day'))
      );
    }
    if (endDate) {
      filtered = filtered.filter(patient => 
        dayjs(patient.created_at).isBefore(dayjs(endDate).add(1, 'day'))
      );
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [patients, searchTerm, genderFilter, startDate, endDate]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (genderFilter) count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  }, [searchTerm, genderFilter, startDate, endDate]);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header with Search and Add Button */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search patients by name, email, USC ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    position: 'relative',
                  }}
                >
                  Filters
                  {activeFilterCount > 0 && (
                    <Chip
                      label={activeFilterCount}
                      size="small"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        minWidth: 20,
                        height: 20,
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                  {showFilters ? <ExpandLessIcon sx={{ ml: 1 }} /> : <ExpandMoreIcon sx={{ ml: 1 }} />}
                </Button>
                <Button variant="contained" color="primary">
                  Add New Patient
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Advanced Filters Panel */}
        <Collapse in={showFilters}>
          <Card sx={{ mb: 3, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon />
                Advanced Filters
              </Typography>
              <Grid container spacing={3}>
                {/* Gender Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={genderFilter}
                      label="Gender"
                      onChange={(e) => setGenderFilter(e.target.value)}
                    >
                      <MenuItem value="">All Genders</MenuItem>
                      <MenuItem value="M">Male</MenuItem>
                      <MenuItem value="F">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Registration Date Range */}
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Registration From"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'medium',
                      },
                    }}
                    maxDate={endDate || dayjs()}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Registration To"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'medium',
                      },
                    }}
                    minDate={startDate}
                    maxDate={dayjs()}
                  />
                </Grid>

                {/* Clear Filters */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={clearAllFilters}
                      disabled={activeFilterCount === 0}
                      fullWidth
                    >
                      Clear All Filters
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {/* Active Filters Display */}
              {activeFilterCount > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Active filters:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {searchTerm && (
                      <Chip
                        label={`Search: "${searchTerm}"`}
                        onDelete={() => setSearchTerm('')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {genderFilter && (
                      <Chip
                        label={`Gender: ${getSexLabel(genderFilter)}`}
                        onDelete={() => setGenderFilter('')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {startDate && (
                      <Chip
                        label={`From: ${dayjs(startDate).format('MMM DD, YYYY')}`}
                        onDelete={() => setStartDate(null)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {endDate && (
                      <Chip
                        label={`To: ${dayjs(endDate).format('MMM DD, YYYY')}`}
                        onDelete={() => setEndDate(null)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Collapse>

        {/* Results Summary */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredAndSearchedPatients.length} of {patients?.length || 0} patients
            {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)`}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

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
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSearchedPatients.length > 0 ? (
                filteredAndSearchedPatients.map((patient) => (
                  <PatientRow 
                    key={patient.id} 
                    patient={patient} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {activeFilterCount > 0 
                        ? 'No patients match the current search criteria. Try adjusting your filters.'
                        : 'No patients found in the system.'
                      }
                    </Typography>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={clearAllFilters}
                        sx={{ mt: 1 }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Card View */}
        <Box className="mobile-table-card" sx={{ display: { xs: 'block', md: 'none' } }}>
          {filteredAndSearchedPatients.length > 0 ? (
            filteredAndSearchedPatients.map((patient) => (
              <PatientCard 
                key={patient.id} 
                patient={patient} 
                onEdit={onEdit} 
                onDelete={onDelete} 
              />
            ))
          ) : (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {activeFilterCount > 0 
                  ? 'No patients match the current search criteria. Try adjusting your filters.'
                  : 'No patients found in the system.'
                }
              </Typography>
              {activeFilterCount > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={clearAllFilters}
                  sx={{ mt: 2 }}
                >
                  Clear All Filters
                </Button>
              )}
            </Card>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
});

PatientList.displayName = 'PatientList';

export default PatientList; 