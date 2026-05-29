import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Divider, InputAdornment
} from '@mui/material';
import { 
  People as PeopleIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import { reportService, api } from '../../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Import USC Directory Mapping for deep extraction
import { ACADEMIC_DIRECTORY_MAP } from '../CampusList';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const PatientSummaryPreview = ({ dateRange, customStart, customEnd }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Workshop Modal Internal Independent Filtering Controls
  const [openModal, setOpenModal] = useState(false);
  const [modalDateRange, setModalDateRange] = useState('30days'); 
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');

  // Domain Specific Filters (University Hierarchy)
  const [selectedCampuses, setSelectedCampuses] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedYearLevels, setSelectedYearLevels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Course Mappings
  const [courseMap, setCourseMap] = useState({});

  const [sortField, setSortField] = useState('count');
  const [sortDirection, setSortDirection] = useState('desc');

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchMappings = async () => {
    try {
      const response = await api.get('/utils/usc-mappings/');
      const programsArray = response?.data?.programs || response?.programs || [];
      const mappedObj = programsArray.reduce((acc, current) => {
        if (current.id) acc[String(current.id)] = current.label;
        return acc;
      }, {});
      setCourseMap(mappedObj);
    } catch (err) {
      console.error("Non-blocking failure fetching academic program text mappings:", err);
    }
  };

  const fetchAnalytics = async (isModal = false) => {
    try {
      if (!isModal) setLoading(true);
      setError(null);
      
      const params = {
        date_start: isModal ? (modalDateRange === 'custom' ? modalStartDate : undefined) : (dateRange === 'custom' ? customStart : undefined),
        date_end: isModal ? (modalDateRange === 'custom' ? modalEndDate : undefined) : (dateRange === 'custom' ? customEnd : undefined),
        date_range: isModal ? modalDateRange : dateRange,
      };

      // If specific filters are active in modal, pass them to backend
      if (isModal) {
        if (selectedCampuses.length > 0) params.campus = selectedCampuses.join(',');
        if (selectedSchools.length > 0) params.school = selectedSchools.join(',');
        if (selectedCourses.length > 0) params.course = selectedCourses.join(',');
        if (selectedYearLevels.length > 0) params.year_level = selectedYearLevels.join(',');
      }

      const response = await reportService.getDashboardAnalytics(params);
      setData(response.data);
    } catch (err) {
      console.error("Failed fetching patient demographics:", err);
      setError("Failed to load patient summary data.");
    } finally {
      if (!isModal) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
    fetchAnalytics(false);
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    if (openModal) {
      fetchAnalytics(true);
    }
  }, [openModal, modalDateRange, modalStartDate, modalEndDate, selectedCampuses, selectedSchools, selectedCourses, selectedYearLevels]);

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Patient Population Analysis - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range: modalDateRange,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          campus: selectedCampuses,
          school: selectedSchools,
          course: selectedCourses,
          year_level: selectedYearLevels
        }
      };

      const response = await reportService.generateReport(1, payload); // Template ID 1
      setSuccess(`Report generation started! ID: ${response.data.report_id}`);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setError("Failed to trigger report generation.");
    } finally {
      setGenerating(false);
    }
  };

  const generateDoughnutData = () => {
    if (!data?.demographics?.colleges) return { labels: [], datasets: [] };
    
    // Sort colleges by count for visualization
    const colleges = [...data.demographics.colleges].sort((a, b) => b.count - a.count).slice(0, 8);
    
    return {
      labels: colleges.map(c => c.college || 'Other'),
      datasets: [
        {
          data: colleges.map(c => c.count),
          backgroundColor: [
            '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', 
            '#0f172a', '#334155', '#64748b'
          ],
          borderWidth: 0,
          hoverOffset: 15,
          borderRadius: 4
        }
      ]
    };
  };

  const generateRoleBarData = () => {
    if (!data?.demographics?.roles) return { labels: [], datasets: [] };
    
    const roles = data.demographics.roles; // { 'STUDENT': X, 'FACULTY / STAFF': Y }
    return {
      labels: Object.keys(roles).map(r => r.charAt(0) + r.slice(1).toLowerCase()),
      datasets: [
        {
          data: Object.values(roles),
          backgroundColor: ['#1e3a8a', '#fbbf24'],
          borderWidth: 0,
          hoverOffset: 15,
          borderRadius: 4
        }
      ]
    };
  };

  const generateCoursePieData = () => {
    if (!data?.demographics?.courses) return { labels: [], datasets: [] };
    
    // Show top 8 courses, group rest as other
    const sortedCourses = [...data.demographics.courses].sort((a, b) => b.count - a.count);
    const topCourses = sortedCourses.slice(0, 7);
    const otherCount = sortedCourses.slice(7).reduce((sum, c) => sum + c.count, 0);
    
    const finalData = [...topCourses];
    if (otherCount > 0) {
      finalData.push({ name: 'Other Programs', count: otherCount });
    }

    return {
      labels: finalData.map(c => c.name.length > 25 ? c.name.substring(0, 22) + '...' : c.name),
      datasets: [
        {
          data: finalData.map(c => c.count),
          backgroundColor: [
            '#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0',
            '#064e3b', '#065f46', '#047857'
          ],
          borderWidth: 0,
          hoverOffset: 15,
          borderRadius: 4
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 10, font: { size: 10, weight: '500' }, padding: 15 }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6
      }
    },
    cutout: '65%'
  };

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortedTableData = () => {
    if (!data?.demographics?.colleges) return [];
    
    let filtered = data.demographics.colleges;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.college || '').toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortDirection === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  };

  const campusOptions = ['Talamban Campus (TC)', 'Downtown Campus (DC)'];
  const schoolOptions = Array.from(new Set(Object.values(ACADEMIC_DIRECTORY_MAP).map(e => e.school))).sort();
  const yearLevelOptions = ['1', '2', '3', '4', '5'];

  const courseOptions = Object.entries(ACADEMIC_DIRECTORY_MAP)
    .filter(([id, meta]) => {
      if (selectedCampuses.length > 0 && !selectedCampuses.includes(meta.campus)) return false;
      if (selectedSchools.length > 0 && !selectedSchools.includes(meta.school)) return false;
      return true;
    })
    .map(([id, meta]) => ({
      id,
      label: courseMap[id] || `Course #${id}`,
      ...meta
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      
      {/* --- DASHBOARD PREVIEW CARD --- */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <PeopleIcon sx={{ color: '#1e3a8a', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a', fontSize: '1.1rem' }}>
                Institutional Demographics
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#0f172a' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Demographics Workshop
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress sx={{ color: '#1e3a8a' }} />
            ) : data?.demographics?.colleges?.length > 0 ? (
              <Doughnut data={generateDoughnutData()} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No population data found for this period.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- FULL DRILL-DOWN WORKSHOP MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" scroll="paper" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
              Population & Academic Distribution Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Analyze patient volumes across the University hierarchy. Use multi-select to aggregate specific schools or campuses.
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: '#fcfcfc' }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          {/* FILTERS ROW */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={2.5}>
              <Autocomplete
                multiple
                size="small"
                options={campusOptions}
                value={selectedCampuses}
                onChange={(e, v) => {
                  setSelectedCampuses(v);
                  setSelectedSchools([]);
                  setSelectedCourses([]);
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option.split(' (')[1]?.replace(')', '') || option} size="small" color="primary" {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Campus" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                multiple
                size="small"
                options={schoolOptions}
                value={selectedSchools}
                onChange={(e, v) => {
                  setSelectedSchools(v);
                  setSelectedCourses([]);
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size="small" sx={{ bgcolor: '#e0f2fe' }} {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="School / College" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={3.5}>
              <Autocomplete
                multiple
                size="small"
                options={courseOptions}
                getOptionLabel={(option) => option.label}
                value={courseOptions.filter(opt => selectedCourses.includes(opt.id))}
                onChange={(e, v) => setSelectedCourses(v.map(item => item.id))}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip 
                        key={key} 
                        label={option.label} 
                        size="small" 
                        sx={{ bgcolor: '#f0fdf4', color: '#166534', maxWidth: '120px' }} 
                        {...tagProps} 
                      />
                    );
                  })
                }
                renderInput={(params) => <TextField {...params} label="Academic Program" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={1.5}>
              <Autocomplete
                multiple
                size="small"
                options={yearLevelOptions}
                value={selectedYearLevels}
                onChange={(e, v) => setSelectedYearLevels(v)}
                renderInput={(params) => <TextField {...params} label="Year" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Timeline</InputLabel>
                <Select value={modalDateRange} label="Timeline" onChange={(e) => setModalDateRange(e.target.value)}>
                  <MenuItem value="all">All-Time</MenuItem>
                  <MenuItem value="7days">7 Days</MenuItem>
                  <MenuItem value="30days">30 Days</MenuItem>
                  <MenuItem value="custom">Custom...</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* VISUALIZATION GRID */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: 350 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>School-Level Distribution</Typography>
                <Box sx={{ height: 280 }}>
                  {data?.demographics?.colleges?.length > 0 ? (
                    <Bar 
                      data={{
                        labels: data.demographics.colleges.map(c => c.college),
                        datasets: [{
                          label: 'Total Students',
                          data: data.demographics.colleges.map(c => c.count),
                          backgroundColor: '#2563eb',
                          borderRadius: 4
                        }]
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                      }}
                    />
                  ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={10}>No data for selection</Typography>}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: 350 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Course Classification</Typography>
                <Box sx={{ height: 280, display: 'flex', justifyContent: 'center' }}>
                  {data?.demographics?.courses ? (
                    <Pie 
                      data={generateCoursePieData()} 
                      options={{...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: 'bottom' }}}} 
                    />
                  ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={10}>No course data</Typography>}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: 350 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Role Classification</Typography>
                <Box sx={{ height: 280, display: 'flex', justifyContent: 'center' }}>
                  {data?.demographics?.roles ? (
                    <Doughnut 
                      data={generateRoleBarData()} 
                      options={{...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: 'bottom' }}}} 
                    />
                  ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={10}>No role data</Typography>}
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* DATA TABLE SECTION */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Granular Population Audit</Typography>
            <TextField
              size="small"
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              }}
            />
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: '8px' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'college'} direction={sortField === 'college' ? sortDirection : 'asc'} onClick={() => handleRequestSort('college')}>
                      Department / College Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableSortLabel active={sortField === 'count'} direction={sortField === 'count' ? sortDirection : 'asc'} onClick={() => handleRequestSort('count')}>
                      Active Patients
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSortedTableData().map((row, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{row.college || 'Other'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1e3a8a' }}>{row.count.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {((row.count / (data?.demographics?.total_active || 1)) * 100).toFixed(1)}%
                        </Typography>
                        <Box sx={{ width: 60, height: 6, bgcolor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                          <Box sx={{ width: `${(row.count / data.demographics.total_active) * 100}%`, height: '100%', bgcolor: '#3b82f6' }} />
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: 'text.secondary' }}>Close Workshop</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('EXCEL')} disabled={generating} sx={{ mr: 1 }}>Excel</Button>
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('CSV')} disabled={generating} sx={{ mr: 1 }}>CSV</Button>
          <Button 
            variant="contained" 
            onClick={() => handleGenerateReport('PDF')}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#0f172a' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Demographics PDF'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default PatientSummaryPreview;