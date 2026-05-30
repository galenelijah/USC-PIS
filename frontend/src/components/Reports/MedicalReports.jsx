import React, { useState, useEffect } from 'react';
/**
 * MedicalReports.jsx
 * Updated: May 29, 2026 - Analytical Reports Workshop
 * Integrated with Enterprise Export Engine
 */
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Autocomplete, Chip, Divider, InputAdornment
} from '@mui/material';
import { 
  BarChart as ChartIcon,
  Visibility as ViewIcon,
  VisibilityOff as ViewOffIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import { patientService, reportService, api } from '../../services/api'; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

// 🔑 Import the cleaner external file map structure asset 
import { ACADEMIC_DIRECTORY_MAP } from './CampusList';
import { ProgramsChoices } from '../static/choices';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

const MedicalReports = ({ dateRange, customStart, customEnd }) => {
  const [records, setRecords] = useState([]);
  const [dashboardRecords, setDashboardRecords] = useState([]); 
  const [modalRecords, setModalRecords] = useState([]);         
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Mappings store hashes
  const [courseMap, setCourseMap] = useState({});
  const [providerMap, setProviderMap] = useState({}); 

  // Modal Internal Independent Filtering Controls
  const [openModal, setOpenModal] = useState(false);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]); 
  
  // Filter Arrays for Campus and School Multi-Select
  const [selectedCampuses, setSelectedCampuses] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]); 
  
  const [modalDateRange, setModalDateRange] = useState('30days'); 
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  
  // Holds an array of selected provider IDs for multi-selection
  const [selectedProviders, setSelectedProviders] = useState([]);

  // Table Specific Text Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Row Drill-Down View Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);

  const [sortField, setSortField] = useState('visit_date');
  const [sortDirection, setSortDirection] = useState('desc');

  const tableColumns = [
    { id: 'patient_name', label: 'Patient Name', align: 'left' },
    { id: 'patient_usc_id', label: 'USC ID', align: 'left' },
    { id: 'patient_role', label: 'Role', align: 'left' },
    { id: 'patient_course', label: 'Course', align: 'left' }, 
    { id: 'diagnosis', label: 'Diagnosis', align: 'left' },
    { id: 'concern', label: 'Chief Complaint', align: 'left' },
    { id: 'visit_date', label: 'Visit Date', align: 'left' },
  ];

  const getCourseLabel = (courseId) => {
    if (!courseId) return '-';
    return courseMap[String(courseId)] || `Course #${courseId}`;
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch all medical records
        const response = await api.get('/patients/medical-records/');
        const dataList = response?.data?.results || response?.data || [];
        setRecords(dataList);

        // 2. Resolve courses from ProgramsChoices mapping
        const cMap = {};
        ProgramsChoices.forEach(p => {
          cMap[String(p.id)] = p.label;
        });
        setCourseMap(cMap);

        // 3. Extract unique providers (users who created records)
        const pMap = {};
        dataList.forEach(r => {
          if (r.created_by && r.created_by_name) {
             pMap[String(r.created_by)] = r.created_by_name;
          }
        });
        setProviderMap(pMap);

      } catch (err) {
        console.error("Failed fetching medical analysis data:", err);
        setError("Network Error: Could not reach clinical data server.");
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  // Shared filtering logic that powers BOTH the Dashboard Headline and the Modal Workshop
  const executeRangeFiltering = (source, range, start, end) => {
    let filtered = [...source];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (range === '7days') {
      const cutOff = new Date();
      cutOff.setDate(today.getDate() - 7);
      filtered = filtered.filter(r => new Date(r.visit_date || r.created_at) >= cutOff);
    } else if (range === '30days') {
      const cutOff = new Date();
      cutOff.setDate(today.getDate() - 30);
      filtered = filtered.filter(r => new Date(r.visit_date || r.created_at) >= cutOff);
    } else if (range === '6months') {
      const cutOff = new Date();
      cutOff.setMonth(today.getMonth() - 6);
      filtered = filtered.filter(r => new Date(r.visit_date || r.created_at) >= cutOff);
    } else if (range === 'custom' && start && end) {
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => {
        const d = new Date(r.visit_date || r.created_at);
        return d >= startDate && d <= endDate;
      });
    }
    return filtered;
  };

  // Sync Global Dashboard Props to Dashboard Preview Component
  useEffect(() => {
    setDashboardRecords(executeRangeFiltering(records, dateRange, customStart, customEnd));
  }, [dateRange, customStart, customEnd, records]);

  // Handle Internal Modal Filtering (Workshop Mode)
  useEffect(() => {
    let modalFiltered = executeRangeFiltering(records, modalDateRange, modalStartDate, modalEndDate);

    if (selectedDiagnoses.length > 0) {
      modalFiltered = modalFiltered.filter(r => selectedDiagnoses.includes(r.diagnosis));
    }

    if (selectedCampuses.length > 0) {
      modalFiltered = modalFiltered.filter(record => {
        const programIdStr = String(record.patient_course || '');
        const structuralData = ACADEMIC_DIRECTORY_MAP[programIdStr];
        return structuralData && selectedCampuses.includes(structuralData.campus);
      });
    }

    if (selectedSchools.length > 0) {
      modalFiltered = modalFiltered.filter(record => {
        const programIdStr = String(record.patient_course || '');
        const structuralData = ACADEMIC_DIRECTORY_MAP[programIdStr];
        return structuralData && selectedSchools.includes(structuralData.school);
      });
    }

    if (selectedCourses.length > 0) {
      modalFiltered = modalFiltered.filter(record =>
        selectedCourses.includes(String(record.patient_course))
      );
    }

    if (selectedProviders.length > 0) {
      modalFiltered = modalFiltered.filter(record => {
        const creatorId = String(record.created_by || 'Unknown');
        return selectedProviders.includes(creatorId);
      });
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      modalFiltered = modalFiltered.filter(record => {
        const name = (record.patient_name || '').toLowerCase();
        const idNum = (record.patient_usc_id || '').toLowerCase();
        const role = (record.patient_role || '').toLowerCase();
        const course = getCourseLabel(record.patient_course).toLowerCase();
        const concern = (record.concern || '').toLowerCase();
        const diagnosis = (record.diagnosis || '').toLowerCase();
        const formattedDate = formatDate(record.visit_date || record.created_at).toLowerCase();

        return name.includes(query) ||
               idNum.includes(query) ||
               role.includes(query) ||
               course.includes(query) ||
               concern.includes(query) ||
               diagnosis.includes(query) ||
               formattedDate.includes(query);
      });
    }

    setModalRecords(sortDataList([...modalFiltered]));
  }, [selectedDiagnoses, selectedCampuses, selectedSchools, selectedCourses, modalDateRange, modalStartDate, modalEndDate, searchQuery, dateRange, customStart, customEnd, records, sortField, sortDirection, courseMap, selectedProviders]);

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);

      const payload = {
        title: `Comprehensive Clinical Audit Report - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range: modalDateRange,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          diagnosis: selectedDiagnoses,
          campus: selectedCampuses,
          school: selectedSchools,
          providers: selectedProviders,
          course: selectedCourses
        }
      };

      const response = await reportService.generateReport(3, payload); // Template ID 3: Treatment Outcomes/Clinical Audit
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

  const sortDataList = (list) => {
    return list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'visit_date') {
        valA = new Date(valA || a.created_at).getTime();
        valB = new Date(valB || b.created_at).getTime();
      }

      if (sortDirection === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  };

  const generateChartData = (dataSrc, limit = null) => {
    const diagnosisCounts = dataSrc.reduce((acc, curr) => {
      const diag = curr.diagnosis || 'Unspecified';
      acc[diag] = (acc[diag] || 0) + 1;
      return acc;
    }, {});

    let sortedDiagnoses = Object.keys(diagnosisCounts)
      .map(key => ({ diagnosis: key, count: diagnosisCounts[key] }))
      .sort((a, b) => b.count - a.count);

    const activeLimit = limit || 10;
    sortedDiagnoses = sortedDiagnoses.slice(0, activeLimit);

    const paletteGradient = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#f0fdf4'];
    const backgroundColors = sortedDiagnoses.map((_, index) => paletteGradient[index % paletteGradient.length]);

    return {
      labels: sortedDiagnoses.map(d => d.diagnosis),
      datasets: [
        {
          label: 'Consultation Frequency',
          data: sortedDiagnoses.map(d => d.count),
          backgroundColor: backgroundColors,
          borderColor: '#ffffff',
          borderWidth: 1.5,
          borderRadius: 4
        }
      ]
    };
  };

  const chartOptions = {
    indexAxis: 'y', 
    responsive: true, 
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: { beginAtZero: true, grid: { color: '#f8fafc' }, ticks: { font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11, weight: '500' } } }
    }
  };

  const renderDashboardHeadlineString = () => {
    if (dateRange === '7days') return "(Last 7 Days)";
    if (dateRange === '30days') return "(Last 30 Days)";
    if (dateRange === '6months') return "(Last 6 Months)";
    if (dateRange === 'custom') return `(${modalStartDate} to ${modalEndDate})`;
    return "(All Records)";
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setOpenDetailModal(true);
  };

  const uniqueDiagnoses = Array.from(new Set(records.map(r => r.diagnosis).filter(Boolean)));
  const campusOptions = ['Talamban Campus (TC)', 'Downtown Campus (DC)'];

  const schoolOptions = Array.from(
    new Set(
      Object.values(ACADEMIC_DIRECTORY_MAP)
        .filter(entry => selectedCampuses.length === 0 || selectedCampuses.includes(entry.campus))
        .map(entry => entry.school)
    )
  ).sort();

  const activeCourseFilterOptions = Array.from(new Set(records.map(r => String(r.patient_course)).filter(Boolean)))
    .map(id => ({ 
      id: id, 
      label: courseMap[id] || `Course #${id}`,
      meta: ACADEMIC_DIRECTORY_MAP[id]
    }))
    .filter(item => {
      if (selectedCampuses.length > 0 && (!item.meta || !selectedCampuses.includes(item.meta.campus))) return false;
      if (selectedSchools.length > 0 && (!item.meta || !selectedSchools.includes(item.meta.school))) return false;
      return true;
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const providerTallyRows = Object.entries(
    executeRangeFiltering(records, modalDateRange, modalStartDate, modalEndDate).reduce((acc, curr) => {
      const creatorId = curr.created_by || 'Unknown';
      acc[creatorId] = (acc[creatorId] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <Box sx={{ width: '100%' }}>

      {/* --- DASHBOARD PREVIEW CARD --- */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <ChartIcon sx={{ color: '#16a34a', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a', fontSize: '1.1rem' }}>
                Most Common Diagnosis {renderDashboardHeadlineString()}
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#11823b' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                View Details
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress sx={{ color: '#16a34a' }} />
            ) : dashboardRecords.length > 0 ? (
              <Bar data={generateChartData(dashboardRecords, 5)} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No medical records found inside chosen global parameters.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- MAIN DRILL DOWN WORKSHOP MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" scroll="paper" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a' }}>
              Detailed Clinical Diagnosis Breakdown Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Customize filters dynamically. All inputs work cooperatively to filter your breakdown metrics down to row level specifications.
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: '#fcfcfc' }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          {/* ROW 1 FILTERS: STRUCTURE & ANATOMY GROUPS */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
             <Grid item xs={12} sm={3}>
               <Autocomplete
                 multiple
                 size="small"
                 options={campusOptions}
                 value={selectedCampuses}
                 onChange={(e, v) => { setSelectedCampuses(v); setSelectedSchools([]); setSelectedCourses([]); }}
                 renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip key={key} label={option} size="small" color="success" variant="outlined" {...tagProps} />;
                    })
                 }
                 renderInput={(params) => <TextField {...params} label="Filter by Campus" />}
               />
             </Grid>
             <Grid item xs={12} sm={3}>
               <Autocomplete
                 multiple
                 size="small"
                 options={schoolOptions}
                 value={selectedSchools}
                 onChange={(e, v) => { setSelectedSchools(v); setSelectedCourses([]); }}
                 disabled={selectedCampuses.length === 0}
                 renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip key={key} label={option} size="small" color="success" variant="outlined" {...tagProps} />;
                    })
                 }
                 renderInput={(params) => <TextField {...params} label="Filter by School" placeholder={selectedCampuses.length === 0 ? "Select Campus First" : ""} />}
               />
             </Grid>
             <Grid item xs={12} sm={6}>
               <Autocomplete
                 multiple
                 size="small"
                 options={activeCourseFilterOptions}
                 getOptionLabel={(option) => option.label || option}
                 value={selectedCourses.map(id => activeCourseFilterOptions.find(o => o.id === id) || id)}
                 onChange={(e, v) => setSelectedCourses(v.map(item => item.id || item))}
                 disabled={selectedSchools.length === 0}
                 renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip key={key} label={option.label || option} size="small" color="success" {...tagProps} />;
                    })
                 }
                 renderInput={(params) => <TextField {...params} label="Filter by Academic Program" placeholder={selectedSchools.length === 0 ? "Select School First" : ""} />}
               />
             </Grid>
          </Grid>

          {/* ROW 2 FILTERS: CLINICAL & TIMELINE */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
             <Grid item xs={12} sm={4}>
               <Autocomplete
                 multiple
                 size="small"
                 options={uniqueDiagnoses}
                 value={selectedDiagnoses}
                 onChange={(e, v) => setSelectedDiagnoses(v)}
                 renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip key={key} label={option} size="small" color="primary" {...tagProps} />;
                    })
                 }
                 renderInput={(params) => <TextField {...params} label="Targeted Diagnoses" />}
               />
             </Grid>
             <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Workshop Timeline</InputLabel>
                  <Select value={modalDateRange} label="Workshop Timeline" onChange={(e) => setModalDateRange(e.target.value)}>
                    <MenuItem value="all">Full Academic History</MenuItem>
                    <MenuItem value="7days">Last 7 Days</MenuItem>
                    <MenuItem value="30days">Last 30 Days</MenuItem>
                    <MenuItem value="6months">Last 6 Months</MenuItem>
                    <MenuItem value="custom">Manual Range Selection</MenuItem>
                  </Select>
                </FormControl>
             </Grid>
             {modalDateRange === 'custom' && (
               <>
                 <Grid item xs={12} sm={2}>
                   <TextField fullWidth type="date" label="Start" size="small" value={modalStartDate} onChange={(e) => setModalStartDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ max: modalEndDate || getTodayString() }} />
                 </Grid>
                 <Grid item xs={12} sm={2}>
                   <TextField fullWidth type="date" label="End" size="small" value={modalEndDate} onChange={(e) => setModalEndDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: modalStartDate, max: getTodayString() }} />
                 </Grid>
               </>
             )}
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* ANALYTICS SUMMARY MINI-TILES */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
             <Grid item xs={12} md={8}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: 350 }}>
                   <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Morbidity Visualization (Filtered)</Typography>
                   <Box sx={{ height: 280 }}>
                     {modalRecords.length > 0 ? (
                       <Bar data={generateChartData(modalRecords)} options={chartOptions} />
                     ) : <Typography variant="body2" color="text.secondary" textAlign="center" mt={10}>No morbidity data for current parameters</Typography>}
                   </Box>
                </Box>
             </Grid>
             <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: 350, overflowY: 'auto' }}>
                   <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Provider Performance Tally</Typography>
                   <Table size="small">
                     <TableHead>
                       <TableRow>
                         <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Provider Name</TableCell>
                         <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Records</TableCell>
                       </TableRow>
                     </TableHead>
                     <TableBody>
                        {providerTallyRows.map(([id, count]) => (
                          <TableRow key={id} hover sx={{ 
                            bgcolor: selectedProviders.includes(id) ? '#f0fdf4' : 'transparent',
                            cursor: 'pointer' 
                          }} onClick={() => {
                            if (selectedProviders.includes(id)) setSelectedProviders(selectedProviders.filter(pid => pid !== id));
                            else setSelectedProviders([...selectedProviders, id]);
                          }}>
                            <TableCell sx={{ fontSize: '0.75rem' }}>{providerMap[id] || id}</TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{count}</TableCell>
                          </TableRow>
                        ))}
                     </TableBody>
                   </Table>
                </Box>
             </Grid>
          </Grid>

          {/* DATA TABLE SECTION */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Clinical Audit Log</Typography>
            <TextField
              size="small"
              placeholder="Instant Search Across All Fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}><CloseIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ width: 350 }}
            />
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, borderRadius: '8px' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {tableColumns.map((col) => (
                    <TableCell 
                      key={col.id} 
                      align={col.align} 
                      sx={{ bgcolor: '#f8fafc', fontWeight: 'bold', py: 1.5 }}
                    >
                      <TableSortLabel
                        active={sortField === col.id}
                        direction={sortField === col.id ? sortDirection : 'asc'}
                        onClick={() => handleRequestSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modalRecords.map((row) => (
                  <TableRow key={row.id} hover onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.patient_name}</TableCell>
                    <TableCell>{row.patient_usc_id}</TableCell>
                    <TableCell>
                      <Chip label={row.patient_role} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                    <TableCell>{getCourseLabel(row.patient_course)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 700 }}>{row.diagnosis}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.concern}
                    </TableCell>
                    <TableCell>{formatDate(row.visit_date || row.created_at)}</TableCell>
                    <TableCell align="center">
                       <IconButton size="small" color="primary"><ViewIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {modalRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                       <Typography variant="body2" color="text.secondary">No clinical records found matching your multi-tier filter selection.</Typography>
                    </TableCell>
                  </TableRow>
                )}
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
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#11823b' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Audit PDF'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DETAIL MODAL (Left as is, already excellent) */}
      <Dialog 
        open={openDetailModal} 
        onClose={() => setOpenDetailModal(false)} 
        fullWidth 
        maxWidth="md"
        scroll="paper"
        disableEnforceFocus={false}
        keepMounted={false}
        PaperProps={{
          sx: { borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f4fbf7', borderBottom: '1px solid #c8e6c9' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#11823b' }}>
              Clinical Consultation Details
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Record ID Reference: #{selectedRecord?.id || '-'}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenDetailModal(false)} sx={{ color: '#555' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, bgcolor: '#ffffff' }}>
          {selectedRecord && (
             <Grid container spacing={2.5}>
              {/* Patient Basic Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#11823b', mb: 1, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Patient Demographics
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: '#fcfcfc' }}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Full Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRecord.patient_name}</Typography>
                    </Grid>
                    <Grid item xs={12} display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">University ID</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRecord.patient_usc_id}</Typography>
                    </Grid>
                    <Grid item xs={12} display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Role / Classification</Typography>
                      <Chip label={selectedRecord.patient_role} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                    </Grid>
                    <Grid item xs={12} display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Program / Course</Typography>
                      <Typography variant="body2" sx={{ maxWidth: '60%', textAlign: 'right' }}>{getCourseLabel(selectedRecord.patient_course)}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Consultation Context */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#11823b', mb: 1, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Clinical Session Context
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: '#fcfcfc' }}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Consultation Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(selectedRecord.visit_date || selectedRecord.created_at)}</Typography>
                    </Grid>
                    <Grid item xs={12} display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Attending Provider</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a' }}>{selectedRecord.created_by_name || 'System Auto'}</Typography>
                    </Grid>
                    <Grid item xs={12} display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Primary Diagnosis</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#d32f2f' }}>{selectedRecord.diagnosis}</Typography>
                    </Grid>
                    <Grid item xs={12} display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Chief Complaint</Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{selectedRecord.concern || 'None documented'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Vitals */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#11823b', mb: 1, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Vital Signs Panel
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px' }}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Core Temperature</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRecord.vital_signs?.temperature ? `${selectedRecord.vital_signs.temperature} °C` : '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Blood Pressure</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRecord.vital_signs?.blood_pressure || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Heart Rate</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRecord.vital_signs?.heart_rate ? `${selectedRecord.vital_signs.heart_rate} bpm` : '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Respiratory Rate</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRecord.vital_signs?.respiratory_rate ? `${selectedRecord.vital_signs.respiratory_rate} cpm` : '-'}</Typography>
                    </Grid>
                    <Divider sx={{ width: '100%', my: 0.5 }} />
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Height</Typography>
                      <Typography variant="body2">{selectedRecord.vital_signs?.height ? `${selectedRecord.vital_signs.height} cm` : '-'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Weight</Typography>
                      <Typography variant="body2">{selectedRecord.vital_signs?.weight ? `${selectedRecord.vital_signs.weight} kg` : '-'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Calculated BMI</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedRecord.vital_signs?.bmi || '-'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Physical Exam Checklist */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#11823b', mb: 1, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Physical Examination Logs
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', maxHeight: 180, overflowY: 'auto' }}>
                  <Grid container spacing={1}>
                    {selectedRecord.physical_examination ? (
                      Object.entries(selectedRecord.physical_examination).map(([key, val]) => (
                        <Grid item xs={12} sm={6} key={key} display="flex" justifyContent="space-between" sx={{ pb: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                          <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 500, color: '#666' }}>
                            {key.replace('_', ' ')}:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: val ? '#000' : 'text.secondary' }}>
                            {val || 'Normal'}
                          </Typography>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}><Typography variant="caption" color="text.secondary">No targeted organ reviews documented.</Typography></Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#11823b', mb: 0.5, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Provider Progress Notes / Directives
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, minHeight: 60, bgcolor: '#fafafa', borderRadius: '8px' }}>
                  <Typography variant="body2" sx={{ fontStyle: selectedRecord.notes ? 'normal' : 'italic', color: selectedRecord.notes ? 'text.primary' : 'text.secondary' }}>
                    {selectedRecord.notes || 'No supplementary procedural notes or patient counseling flags were added to this chart row.'}
                  </Typography>
                </Paper>
              </Grid>

            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 1.5, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={() => setOpenDetailModal(false)} 
            variant="outlined" 
            sx={{ textTransform: 'none', borderRadius: '8px', px: 3, borderColor: '#16a34a', color: '#16a34a', '&:hover': { borderColor: '#11823b', bgcolor: '#f4fbf7' }, fontWeight: 600 }}
          >
            Close View
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default MedicalReports;