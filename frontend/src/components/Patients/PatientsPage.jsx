import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, TextField, InputAdornment, IconButton, Typography, Stack } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import PatientList from './PatientList';
import { patientService } from '../../services/api';
import InfoTooltip from '../utils/InfoTooltip';

const PatientsPage = ({ initialPatients = [] }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(initialPatients);

  // Keep results in sync if initial list changes and no query is active
  useEffect(() => {
    if (!query) setResults(initialPatients || []);
  }, [initialPatients]);

  const performSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults(initialPatients || []);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const resp = await patientService.search(q.trim());
      const data = Array.isArray(resp.data?.results) ? resp.data.results : resp.data;
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Patient search error:', e);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  }, [initialPatients]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, performSearch]);

  const countLabel = useMemo(() => {
    const count = results?.length || 0;
    if (loading) return 'Searching...';
    if (query) return `${count} result${count === 1 ? '' : 's'}`;
    return `${count} patient${count === 1 ? '' : 's'}`;
  }, [results, loading, query]);

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
        <InfoTooltip title="Type at least 2 characters to search. Clear to see the full list." />
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110, textAlign: 'right' }}>
          {countLabel}
        </Typography>
      </Stack>
      <PatientList patients={results || []} />
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default PatientsPage;
