import React, { useState, useEffect } from 'react';
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
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateString; }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const mappingResponse = await api.get('/utils/usc-mappings/');
          const programsArray = mappingResponse?.data?.programs || mappingResponse?.programs || [];
          
          const mappedObj = programsArray.reduce((acc, current) => {
            if (current.id) acc[String(current.id)] = current.label;
            return acc;
          }, {});
          setCourseMap(mappedObj);
        } catch (mapErr) {
          console.error("Non-blocking failure fetching academic program text mappings:", mapErr);
        }

        const medicalResponse = await patientService.getMyMedicalRecords();
        const medicalData = medicalResponse?.data?.results || medicalResponse?.data || [];
        setRecords(medicalData);

      } catch (err) {
        console.error("Initialization failure inside reports workspace:", err);
        setError(err.response?.data?.message || "Failed to load clinical records.");
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    if (records.length === 0) return;

    const resolveProviderNames = async () => {
      const distinctIds = Array.from(new Set(records.map(r => r.created_by).filter(Boolean)));
      const missingIds = distinctIds.filter(id => !providerMap[String(id)]);
      if (missingIds.length === 0) return;

      const updatedMappings = { ...providerMap };
      
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const response = await api.get(`/auth/admin/users/${id}/`);
            const targetUser = response?.data?.user || response?.user;
            if (targetUser) {
              const firstName = targetUser.first_name || '';
              const lastName = targetUser.last_name || '';
              const computedName = `${firstName} ${lastName}`.trim() || targetUser.username;
              updatedMappings[String(id)] = computedName || `User #${id}`;
            } else {
              updatedMappings[String(id)] = `User #${id}`;
            }
          } catch (err) {
            console.error(`Failed to look up baseline identity string for provider account #${id}:`, err);
            updatedMappings[String(id)] = `User #${id}`;
          }
        })
      );

      setProviderMap(updatedMappings);
    };

    resolveProviderNames();
  }, [records]);

  const handleOpenRowDetail = (record) => {
    setSelectedRecord(record);
    setOpenDetailModal(true);
  };

  const handleToggleProviderFilter = (providerId) => {
    const stringId = String(providerId);
    setSelectedProviders((prevSelected) => 
      prevSelected.includes(stringId)
        ? prevSelected.filter(id => id !== stringId) 
        : [...prevSelected, stringId]               
    );
  };

  const sortDataList = (list) => {
    return list.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];

      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';

      if (sortField === 'visit_date') {
        const timeA = valueA ? new Date(valueA).getTime() : 0;
        const timeB = valueB ? new Date(valueB).getTime() : 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (sortField === 'patient_course') {
        valueA = getCourseLabel(valueA);
        valueB = getCourseLabel(valueB);
      }

      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const executeRangeFiltering = (baseArray, rangeType, startBound, endBound) => {
    let result = [...baseArray];
    const now = new Date();

    if (rangeType === '7days') {
      const cutOff = new Date();
      cutOff.setDate(now.getDate() - 7);
      result = result.filter(r => new Date(r.visit_date || r.created_at) >= cutOff);
    } else if (rangeType === '30days') {
      const cutOff = new Date();
      cutOff.setDate(now.getDate() - 30);
      result = result.filter(r => new Date(r.visit_date || r.created_at) >= cutOff);
    } else if (rangeType === '6months') {
      const cutOff = new Date();
      cutOff.setMonth(now.getMonth() - 6);
      result = result.filter(r => new Date(r.visit_date || r.created_at) >= cutOff);
    } else if (rangeType === 'custom') {
      if (startBound) {
        const start = new Date(startBound);
        start.setHours(0, 0, 0, 0);
        result = result.filter(r => new Date(r.visit_date || r.created_at) >= start);
      }
      if (endBound) {
        const end = new Date(endBound);
        end.setHours(23, 59, 59, 999);
        result = result.filter(r => new Date(r.visit_date || r.created_at) <= end);
      }
    }
    return result;
  };

  useEffect(() => {
    const dashboardFiltered = executeRangeFiltering(records, dateRange, customStart, customEnd);
    setDashboardRecords(sortDataList([...dashboardFiltered]));

    let modalFiltered = [...records];
    modalFiltered = executeRangeFiltering(modalFiltered, modalDateRange, modalStartDate, modalEndDate);
    
    if (selectedDiagnoses.length > 0) {
      modalFiltered = modalFiltered.filter(record => 
        selectedDiagnoses.includes(record.diagnosis)
      );
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
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          diagnosis: selectedDiagnoses,
          campus: selectedCampuses,
          school: selectedSchools,
          providers: selectedProviders
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
          label: 'Total Cases',
          data: sortedDiagnoses.map(d => d.count),
          backgroundColor: backgroundColors,
          borderWidth: 0,
          borderRadius: 4,
          barThickness: 18, 
          maxBarThickness: 20
        }
      ]
    };
  };

  const generateProviderChartData = (tallyRows) => {
    const displayRows = tallyRows.slice(0, 6); 
    const blueGradient = ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'];
    
    return {
      labels: displayRows.map(([id]) => providerMap[String(id)] || (id === 'Unknown' ? 'System/Unassigned' : `User #${id}`)),
      datasets: [
        {
          label: 'Logs Created',
          data: displayRows.map(([_, count]) => count),
          backgroundColor: displayRows.map((_, i) => blueGradient[i % blueGradient.length]),
          borderWidth: 0,
          borderRadius: 4,
          barThickness: 14,
          maxBarThickness: 16
        }
      ]
    };
  };

  const chartOptions = {
    indexAxis: 'y', 
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    layout: { padding: { top: 10, bottom: 10, left: 5, right: 15 } },
    scales: {
      x: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 }, stepSize: 1 } },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 11, fontWeight: '500' },
          callback: function(value) {
            const label = this.getLabelForValue(value);
            return label.length > 20 ? label.substring(0, 17) + '...' : label;
          }
        }
      }
    }
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
    executeRangeFiltering(records, modalDateRange, modalStartDate, modalEndDate)
    .filter(r => selectedDiagnoses.length === 0 || selectedDiagnoses.includes(r.diagnosis))
    .reduce((acc, curr) => {
      const creatorId = curr.created_by || 'Unknown';
      acc[creatorId] = (acc[creatorId] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const filteredProviderTallyRows = Object.entries(
    modalRecords.reduce((acc, curr) => {
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
                Medical Records Analysis
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
                Audit Workshop
              </Button>
            )}
          </Box>

          <Box sx={{ height: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: '8px', bgcolor: '#fafafa', p: 1.5 }}>
            {loading ? (
              <CircularProgress sx={{ color: '#16a34a' }} />
            ) : dashboardRecords.length > 0 ? (
              <Bar data={generateChartData(dashboardRecords, 5)} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No medical records found.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- MAIN DRILL DOWN WORKSHOP MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a' }}>
              Detailed Clinical Diagnosis Breakdown Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Analyze consultations by diagnosis, campus, school, and provider. Cooperatively filter down to row level.
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
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                multiple
                size="small"
                options={campusOptions}
                value={selectedCampuses}
                onChange={(event, newValue) => {
                  setSelectedCampuses(newValue);
                  setSelectedSchools([]);
                  setSelectedCourses([]);
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size="small" sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2' }} {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Campus" variant="outlined" />}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Autocomplete
                multiple
                size="small"
                options={schoolOptions}
                value={selectedSchools}
                onChange={(event, newValue) => {
                  setSelectedSchools(newValue);
                  setSelectedCourses([]);
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100' }} {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="School" variant="outlined" />}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Timeline</InputLabel>
                <Select value={modalDateRange} label="Timeline" onChange={(e) => setModalDateRange(e.target.value)}>
                  <MenuItem value="all">Show All</MenuItem>
                  <MenuItem value="7days">Past 7 Days</MenuItem>
                  <MenuItem value="30days">Past 30 Days</MenuItem>
                  <MenuItem value="6months">Past 6 Months</MenuItem>
                  <MenuItem value="custom">Custom...</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* DIAGNOSIS CHART */}
          <Box sx={{ minHeight: 320, maxHeight: 420, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', mb: 4 }}>
            {modalRecords.length > 0 ? (
              <Bar data={generateChartData(modalRecords)} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No matching records found.</Typography>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* TABLE SECTION */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Clinical Audit Trail</Typography>
            <TextField
              size="small"
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              }}
              sx={{ width: 300 }}
            />
          </Box>
          
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: '8px' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {tableColumns.map((col) => (
                    <TableCell key={col.id} sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }} align={col.align}>
                      <TableSortLabel active={sortField === col.id} direction={sortField === col.id ? sortDirection : 'asc'} onClick={() => handleRequestSort(col.id)}>
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {modalRecords.map((row) => (
                  <TableRow key={row.id} hover onClick={() => handleOpenRowDetail(row)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.patient_name || '-'}</TableCell>
                    <TableCell>{row.patient_usc_id || '-'}</TableCell>
                    <TableCell>{row.patient_role || '-'}</TableCell>
                    <TableCell>{getCourseLabel(row.patient_course)}</TableCell> 
                    <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>{row.diagnosis || '-'}</TableCell>
                    <TableCell>{row.concern || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.visit_date || row.created_at)}</TableCell>
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
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#11823b' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Audit PDF'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DETAIL MODAL (Left as is, already excellent) */}
      <Dialog open={openDetailModal} onClose={() => setOpenDetailModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f4fbf7' }}>
          <Typography variant="h6" fontWeight="bold" color="#11823b">Consultation Details</Typography>
          <IconButton onClick={() => setOpenDetailModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
             <Box sx={{ p: 1 }}>
               <Typography variant="subtitle2" gutterBottom fontWeight="bold">Patient Info</Typography>
               <Grid container spacing={2} sx={{ mb: 3 }}>
                 <Grid item xs={6}><Typography variant="caption" color="text.secondary">Name</Typography><Typography variant="body2">{selectedRecord.patient_name}</Typography></Grid>
                 <Grid item xs={6}><Typography variant="caption" color="text.secondary">USC ID</Typography><Typography variant="body2">{selectedRecord.patient_usc_id}</Typography></Grid>
               </Grid>
               <Divider sx={{ mb: 2 }} />
               <Typography variant="subtitle2" gutterBottom fontWeight="bold">Clinical Record</Typography>
               <Typography variant="caption" color="text.secondary">Diagnosis</Typography>
               <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>{selectedRecord.diagnosis}</Typography>
               <Typography variant="caption" color="text.secondary">Notes / Recommendations</Typography>
               <Typography variant="body2" sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: '4px' }}>{selectedRecord.notes || 'No additional notes.'}</Typography>
             </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default MedicalReports;