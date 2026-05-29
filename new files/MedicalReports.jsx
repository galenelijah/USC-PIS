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
  Search as SearchIcon
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import { patientService, api } from '../../services/api'; 
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
  const [error, setError] = useState(null);

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

  // 🔑 Fixed: Wrapped initialization block cleanly to prevent the Vite 404/Missing Semicolon crash
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

    // Campus Filter Processing
    if (selectedCampuses.length > 0) {
      modalFiltered = modalFiltered.filter(record => {
        const programIdStr = String(record.patient_course || '');
        const structuralData = ACADEMIC_DIRECTORY_MAP[programIdStr];
        return structuralData && selectedCampuses.includes(structuralData.campus);
      });
    }

    // School Filter Processing
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

  const renderDashboardHeadlineString = () => {
    if (dateRange === '7days') return "Trends (Past 7 Days)";
    if (dateRange === '30days') return "Trends (Past 30 Days)";
    if (dateRange === '6months') return "Trends (Past 6 Months)";
    if (dateRange === 'custom') return "Trends (Custom Range)";
    return "Trends (All-Time Records)";
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

  const baseModalRecordsBeforeProviderFilter = executeRangeFiltering(records, modalDateRange, modalStartDate, modalEndDate)
    .filter(r => selectedDiagnoses.length === 0 || selectedDiagnoses.includes(r.diagnosis))
    .filter(r => {
      const meta = ACADEMIC_DIRECTORY_MAP[String(r.patient_course || '')];
      if (selectedCampuses.length > 0 && (!meta || !selectedCampuses.includes(meta.campus))) return false;
      if (selectedSchools.length > 0 && (!meta || !selectedSchools.includes(meta.school))) return false;
      if (selectedCourses.length > 0 && !selectedCourses.includes(String(r.patient_course))) return false;
      return true;
    });

  const providerTallyRows = Object.entries(
    baseModalRecordsBeforeProviderFilter.reduce((acc, curr) => {
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

          {/* ROW 1 FILTERS: STRUCTURE & ANATOMY GROUPS */}
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
                    // 🔑 Fixed: Stripping explicit key off getTagProps to squash the key-spreading error stack
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip 
                        key={key}
                        label={option} 
                        size="small" 
                        sx={{ borderRadius: '6px', fontWeight: 500, bgcolor: '#f3e5f5', color: '#7b1fa2', border: '1px solid #e1bee7' }}
                        {...tagProps} 
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Filter by Campus" variant="outlined" placeholder="Select campuses..." />
                )}
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
                    // 🔑 Fixed: Key destructuring on tags
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip 
                        key={key}
                        label={option.split(' (')[1]?.replace(')', '') || option} 
                        size="small" 
                        sx={{ borderRadius: '6px', fontWeight: 500, bgcolor: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2' }}
                        {...tagProps} 
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Filter by School" variant="outlined" placeholder="Select colleges..." />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Autocomplete
                multiple
                size="small"
                options={activeCourseFilterOptions}
                getOptionLabel={(option) => option.label}
                value={activeCourseFilterOptions.filter(opt => selectedCourses.includes(opt.id))}
                onChange={(event, newValue) => setSelectedCourses(newValue.map(v => v.id))}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    // 🔑 Fixed: Key destructuring on tags
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip 
                        key={key}
                        label={option.label} 
                        size="small" 
                        sx={{ borderRadius: '6px', fontWeight: 500, bgcolor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', maxWidth: '160px' }}
                        {...tagProps} 
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Filter by Academic Program" variant="outlined" placeholder="Select courses..." />
                )}
              />
            </Grid>
          </Grid>

          {/* ROW 2 FILTERS: CLINICAL & CONDITION METRICS */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                size="small"
                options={uniqueDiagnoses}
                value={selectedDiagnoses}
                onChange={(event, newValue) => setSelectedDiagnoses(newValue)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    // 🔑 Fixed: Key destructuring on tags
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip 
                        key={key}
                        label={option} 
                        size="small" 
                        sx={{ borderRadius: '6px', fontWeight: 500, bgcolor: '#e8f5e9', color: '#16a34a', border: '1px solid #c8e6c9' }}
                        {...tagProps} 
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Filter by Diagnosis" variant="outlined" placeholder="Choose conditions..." />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="modal-med-date-label">Filter by Timeline</InputLabel>
                <Select 
                  labelId="modal-med-date-label" 
                  id="modal-med-date-range" 
                  value={modalDateRange} 
                  label="Filter by Timeline" 
                  onChange={(e) => setModalDateRange(e.target.value)}
                >
                  <MenuItem value="all">All Available Timelines (Show All)</MenuItem>
                  <MenuItem value="7days">Past 7 Days</MenuItem>
                  <MenuItem value="30days">Past 30 Days</MenuItem>
                  <MenuItem value="6months">Past 6 Months</MenuItem>
                  <MenuItem value="custom">Custom Date Range...</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {modalDateRange === 'custom' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" size="small" value={modalStartDate} onChange={(e) => setModalStartDate(e.target.value)} inputProps={{ max: modalEndDate || getTodayString() }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" size="small" value={modalEndDate} onChange={(e) => setModalEndDate(e.target.value)} inputProps={{ min: modalStartDate, max: getTodayString() }} />
                </Grid>
              </>
            )}
          </Grid>

          {/* MAIN BIG DIAGNOSIS CHART */}
          <Box sx={{ minHeight: 320, maxHeight: 420, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', mb: 4 }}>
            {modalRecords.length > 0 ? (
              <Bar data={generateChartData(modalRecords)} options={chartOptions} />
            ) : (
              <Typography color="text.secondary" variant="body2">No medical case rows found matching your criteria rules.</Typography>
            )}
          </Box>

          {/* TWO COLUMN SPLIT LAYOUT */}
          <Box sx={{ mb: 5 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#424242' }}>
                      Consultations Created Per Provider Summary
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Toggle eye icons to isolate multiple staff creators simultaneously.
                    </Typography>
                  </Box>
                  {selectedProviders.length > 0 && (
                    <Button 
                      size="small" 
                      variant="text" 
                      onClick={() => setSelectedProviders([])}
                      sx={{ color: '#0284c7', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      Clear Selection ({selectedProviders.length})
                    </Button>
                  )}
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', bgcolor: '#ffffff', minHeight: 242, maxHeight: 242, overflow: 'auto' }}>
                  <Table size="small" stickyHeader aria-label="provider metrics table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: '#f8fafc', py: 1.2, fontWeight: 'bold', width: '50px', borderBottom: '2px solid #e2e8f0' }} align="center">View</TableCell>
                        <TableCell sx={{ bgcolor: '#f8fafc', py: 1.2, fontWeight: 'bold', borderBottom: '2px solid #e2e8f0' }}>Provider Name / ID</TableCell>
                        <TableCell sx={{ bgcolor: '#f8fafc', py: 1.2, fontWeight: 'bold', borderBottom: '2px solid #e2e8f0' }} align="right">Records</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {providerTallyRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No active records found to aggregate.
                          </TableCell>
                        </TableRow>
                      ) : (
                        providerTallyRows.map(([providerId, totalCount]) => {
                          const isCurrentlySelected = selectedProviders.includes(String(providerId));
                          const baselineDisplayName = providerMap[String(providerId)] || (providerId === 'Unknown' ? 'Unassigned/System' : `User #${providerId}`);

                          return (
                            <TableRow 
                              key={providerId} 
                              hover 
                              onClick={() => handleToggleProviderFilter(providerId)}
                              selected={isCurrentlySelected}
                              sx={{ 
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                '&.Mui-selected': { bgcolor: '#f0f9ff', '&:hover': { bgcolor: '#e0f2fe' } }
                              }}
                            >
                              <TableCell align="center" sx={{ py: 0.5, px: 1 }}>
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleToggleProviderFilter(providerId);
                                  }}
                                  sx={{ color: isCurrentlySelected ? '#0284c7' : '#94a3b8' }}
                                >
                                  {isCurrentlySelected ? <ViewIcon fontSize="small" /> : <ViewOffIcon fontSize="small" />}
                                </IconButton>
                              </TableCell>
                              <TableCell sx={{ fontWeight: isCurrentlySelected ? 700 : 500, color: isCurrentlySelected ? '#0369a1' : '#475569' }}>
                                {baselineDisplayName}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: isCurrentlySelected ? '#0284c7' : '#16a34a', pr: 3 }}>
                                {totalCount}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#424242', mb: 0.5 }}>
                  Staff Production Distribution Analysis
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Visual comparison tracking operational workloads and output volumes across medical personnel.
                </Typography>

                <Box sx={{ height: 242, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 1.5, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff' }}>
                  {filteredProviderTallyRows.length > 0 ? (
                    <Bar 
                      data={generateProviderChartData(filteredProviderTallyRows)} 
                      options={{
                        ...chartOptions,
                        scales: {
                          ...chartOptions.scales,
                          x: { ...chartOptions.scales.x, ticks: { ...chartOptions.scales.x.ticks, stepSize: undefined } }
                        }
                      }} 
                    />
                  ) : (
                    <Typography color="text.secondary" variant="body2">No staff operations found to map graphics metrics.</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 3.5 }} />

          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} sx={{ mb: 1.5, px: 0.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#424242' }}>
                Clinical Consultation Audit Logs ({modalRecords.length} items)
              </Typography>
              {selectedProviders.length > 0 && (
                <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                  {selectedProviders.map(id => (
                    <Chip 
                      key={id}
                      label={providerMap[id] || (id === 'Unknown' ? 'System' : `User #${id}`)}
                      size="small"
                      onDelete={() => handleToggleProviderFilter(id)}
                      sx={{ bgcolor: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 500 }}
                    />
                  ))}
                </Box>
              )}
            </Box>
            
            <TextField
              size="small"
              placeholder="Search table variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ 
                width: { xs: '100%', sm: 280 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  bgcolor: '#ffffff',
                  '&.Mui-focused fieldset': { borderColor: '#16a34a' }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )
              }}
            />
          </Box>
          
          {modalRecords.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320, overflow: 'auto', borderRadius: '8px' }}>
              <Table stickyHeader aria-label="medical records table" size="small">
                <TableHead>
                  <TableRow>
                    {tableColumns.map((col) => (
                      <TableCell key={col.id} sx={{ bgcolor: '#f5f5f5', py: 1.5, fontWeight: 'bold' }} align={col.align}>
                        <TableSortLabel active={sortField === col.id} direction={sortField === col.id ? sortDirection : 'asc'} onClick={() => handleRequestSort(col.id)}>
                          {col.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modalRecords.map((row) => (
                    <TableRow 
                      key={row.id} 
                      hover
                      onClick={() => handleOpenRowDetail(row)} 
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>{row.patient_name || '-'}</TableCell>
                      <TableCell>{row.patient_usc_id || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#555' }}>{row.patient_role || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getCourseLabel(row.patient_course)}
                      </TableCell> 
                      <TableCell sx={{ fontWeight: 600, color: '#16a34a' }}>{row.diagnosis || '-'}</TableCell>
                      <TableCell>{row.concern || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.visit_date || row.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed #e0e0e0', borderRadius: '8px' }}>
              <Typography color="text.secondary" variant="body2">
                {searchQuery ? "No matches found for your query keyword." : "No structural records found inside your parameters."}
              </Typography>
            </Box>
          )}

        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={() => alert('Generating diagnostic medical report... (Feature coming soon)')} 
            variant="contained" 
            sx={{ textTransform: 'none', borderRadius: '8px', px: 3, bgcolor: '#16a34a', '&:hover': { bgcolor: '#11823b' }, fontWeight: 600 }}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>


      {/* --- NESTED SECONDARY MODAL: SINGLE FULL RECORD DRILL-DOWN --- */}
      <Dialog 
        open={openDetailModal} 
        onClose={() => setOpenDetailModal(false)} 
        fullWidth 
        maxWidth="md" 
        scroll="paper"
        // Add these props to help manage focus behavior in nested scenarios:
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
              
              {/* Patient Demographics */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#11823b', mb: 1, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Patient Demographics
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: '8px' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Full Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRecord.patient_name || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block">USC ID Number</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRecord.patient_usc_id || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Role Classification</Typography>
                      <Chip label={selectedRecord.patient_role || 'UNKNOWN'} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: '#e8f5e9', color: '#16a34a', mt: 0.5 }} />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="caption" color="text.secondary" display="block">Course / Degree Program</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getCourseLabel(selectedRecord.patient_course)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Department Affiliation</Typography>
                      <Typography variant="body2">{selectedRecord.patient_department || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Encounter Timestamp</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{formatDate(selectedRecord.visit_date)}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Created By (Provider Name)</Typography>
                      <Typography component="div" variant="body2" sx={{ fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 1, minHeight: '20px' }}>
                        {providerMap[String(selectedRecord.created_by)] || `User #${selectedRecord.created_by}`}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Evaluation Summaries */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#11823b', mb: 1, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Clinical Evaluation Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderLeft: '4px solid #16a34a', borderRadius: '4px 8px 8px 4px' }}>
                      <Typography variant="caption" color="text.secondary" display="block">Primary Diagnosis</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#11823b' }}>{selectedRecord.diagnosis || '-'}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px' }}>
                      <Typography variant="caption" color="text.secondary" display="block">Chief Complaint (Concern)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedRecord.concern || '-'}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px' }}>
                      <Typography variant="caption" color="text.secondary" display="block">Prescribed Treatment / Plan</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedRecord.treatment || '-'}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
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