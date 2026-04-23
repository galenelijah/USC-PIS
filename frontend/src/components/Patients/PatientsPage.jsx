import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Box, TextField, InputAdornment, IconButton, Typography, Stack, 
  Grid, FormControl, InputLabel, Select, MenuItem, Chip, Collapse, Button
} from '@mui/material';
import { 
  Search as SearchIcon, Clear as ClearIcon, 
  FilterList as FilterIcon, ExpandMore as ExpandIcon, 
  ExpandLess as LessIcon 
} from '@mui/icons-material';
import PatientList from './PatientList';
import PatientProfile from './PatientProfile';
import { patientService } from '../../services/api';
import InfoTooltip from '../utils/InfoTooltip';
import { ProgramsChoices, YearLevelChoices } from '../static/choices';

const PatientsPage = ({ initialPatients = [] }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(initialPatients);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Advanced Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    course: '',
    year_level: '',
    academic_year: ''
  });

  const academicYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= 2023; i--) {
      years.push(`${i}-${i + 1}`);
    }
    return years;
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      course: '',
      year_level: '',
      academic_year: ''
    });
    setQuery('');
  };

  const performSearch = useCallback(async (q, currentFilters) => {
    try {
      setLoading(true);
      setError('');
      
      // Clean up filters to remove empty strings
      const activeFilters = Object.entries(currentFilters).reduce((acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      }, {});

      let resp;
      if (q && q.trim().length >= 2) {
        resp = await patientService.search(q.trim(), activeFilters);
      } else {
        resp = await patientService.getAll(activeFilters);
      }
      
      const data = Array.isArray(resp.data?.results) ? resp.data.results : resp.data;
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Patient fetch error:', e);
      setError('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to trigger search when query or filters change
  useEffect(() => {
    const t = setTimeout(() => {
      performSearch(query, filters);
    }, 300);
    return () => clearTimeout(t);
  }, [query, filters, performSearch]);

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  if (selectedPatient) {
    return (
      <Box sx={{ p: 2 }}>
        <PatientProfile patient={selectedPatient} onBack={handleBackToList} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search patients by name, email, or USC ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setQuery('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        
        <Button 
          variant={activeFilterCount > 0 ? "contained" : "outlined"}
          startIcon={<FilterIcon />}
          endIcon={showFilters ? <LessIcon /> : <ExpandIcon />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ minWidth: 120 }}
        >
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>

        <InfoTooltip title="Search by basic details or use the Filter button for advanced options like Academic Year." />
      </Stack>

      <Collapse in={showFilters}>
        <Box sx={{ p: 2, mb: 3, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
          <Grid container spacing={2}>
            {/* Role Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  label="Role"
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="">All Patients</MenuItem>
                  <MenuItem value="STUDENT">Students</MenuItem>
                  <MenuItem value="FACULTY">Faculty</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Program/Course Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Program</InputLabel>
                <Select
                  value={filters.course}
                  label="Program"
                  onChange={(e) => handleFilterChange('course', e.target.value)}
                >
                  <MenuItem value="">All Programs</MenuItem>
                  {ProgramsChoices.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Year Level Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Year Level</InputLabel>
                <Select
                  value={filters.year_level}
                  label="Year Level"
                  onChange={(e) => handleFilterChange('year_level', e.target.value)}
                >
                  <MenuItem value="">All Years</MenuItem>
                  {YearLevelChoices.map(y => (
                    <MenuItem key={y.id} value={y.id}>{y.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Academic Year Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Registration AY</InputLabel>
                <Select
                  value={filters.academic_year}
                  label="Registration AY"
                  onChange={(e) => handleFilterChange('academic_year', e.target.value)}
                >
                  <MenuItem value="">Any AY</MenuItem>
                  {academicYears.map(ay => (
                    <MenuItem key={ay} value={ay}>AY {ay}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button size="small" onClick={clearFilters}>Clear All</Button>
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      {activeFilterCount > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.role && <Chip label={`Role: ${filters.role}`} size="small" onDelete={() => handleFilterChange('role', '')} />}
          {filters.course && <Chip label={`Program: ${ProgramsChoices.find(p => p.id == filters.course)?.label || filters.course}`} size="small" onDelete={() => handleFilterChange('course', '')} />}
          {filters.year_level && <Chip label={`Year: ${YearLevelChoices.find(y => y.id == filters.year_level)?.label || filters.year_level}`} size="small" onDelete={() => handleFilterChange('year_level', '')} />}
          {filters.academic_year && <Chip label={`AY: ${filters.academic_year}`} size="small" onDelete={() => handleFilterChange('academic_year', '')} />}
        </Box>
      )}

      <PatientList patients={results || []} onPatientClick={handlePatientClick} />
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default PatientsPage;
