import React, { useState } from 'react';
import { Box, Grid, FormControl, InputLabel, Select, MenuItem, TextField, Typography, Card, CardContent } from '@mui/material';
import { DateRange as CalendarIcon } from '@mui/icons-material';
import HealthCampaignPreview from './Reports/HealthCampaign';

const Reports = () => {
  // --- Shared Global Dashboard Date Filter State ---
  const [globalDateRange, setGlobalDateRange] = useState('30days'); // Defaults to past 30 days
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* --- GLOBAL CONTROL BAR --- */}
      <Card sx={{ mb: 4, borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={4} display="flex" alignItems="center" gap={1}>
              <CalendarIcon sx={{ color: '#303f9f' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
                Global Dashboard Analytics Filter
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Grid container spacing={2} justifyContent="flex-end">
                <Grid item xs={12} sm={globalDateRange === 'custom' ? 4 : 6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="global-timeline-select-label">Clinic Timeline</InputLabel>
                    <Select
                      labelId="global-timeline-select-label"
                      value={globalDateRange}
                      label="Clinic Timeline"
                      onChange={(e) => setGlobalDateRange(e.target.value)}
                    >
                      <MenuItem value="7days">Past 7 Days</MenuItem>
                      <MenuItem value="30days">Past 30 Days</MenuItem>
                      <MenuItem value="6months">Past 6 Months</MenuItem>
                      <MenuItem value="all">All School Records</MenuItem>
                      <MenuItem value="custom">Custom Range...</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {globalDateRange === 'custom' && (
                  <>
                    <Grid item xs={12} sm={4} md={4}>
                      <TextField fullWidth type="date" label="From" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ max: endDate || getTodayString() }} />
                    </Grid>
                    <Grid item xs={12} sm={4} md={4}>
                      <TextField fullWidth type="date" label="To" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: startDate, max: getTodayString() }} />
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* --- DASHBOARD CHARTS ROW CONTAINER --- */}
      <Grid container spacing={"20px"} alignItems="stretch">
        
        {/* Left Grid: Pass down global filter parameters directly */}
        <Grid item xs={12} md={6}>
          <HealthCampaignPreview 
            dateRange={globalDateRange} 
            customStart={startDate} 
            customEnd={endDate} 
          />

        </Grid>

        {/* Right Grid Component Placeholder (Will follow the exact same pattern when introduced) */}
        <Grid item xs={12} md={6}>

        </Grid>

      </Grid>
    </Box>
  );
};

export default Reports;