import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Card, CardContent, Typography, CircularProgress, Button,
  Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Chip, Autocomplete, Divider, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { 
  VerifiedUser as CertIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon,
  Assessment as StatsIcon,
  PieChart as PieIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Bar, Pie } from 'react-chartjs-2';
import { reportService } from '../../../services/api';
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



const wrapText = (text, maxLength = 20) => {
  if (!text) return '';
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach(word => {
    if ((currentLine + word).length > maxLength) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  if (currentLine) lines.push(currentLine.trim());
  return lines;
};


ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const CertificationWorkshopPreview = ({ dateRange, customStart, customEnd }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Workshop Modal Internal Independent Filtering Controls
  const [openModal, setOpenModal] = useState(false);
  const [modalDateRange, setModalDateRange] = useState('all'); 
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');

  // Domain Specific Filters
  const [selectedFitness, setSelectedFitness] = useState([]);
  const [selectedIssuance, setSelectedIssuance] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedCampuses, setSelectedCampuses] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedYearLevels, setSelectedYearLevels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [masterDoctors, setMasterDoctors] = useState([]);

  const fitnessOptions = ['FIT', 'UNFIT'];
  const issuanceOptions = ['pending', 'issued', 'rejected'];
  const campusOptions = ['Talamban Campus (TC)', 'Downtown Campus (DC)'];
  const roleOptions = ['STUDENT', 'FACULTY'];
  const yearLevelOptions = ['1', '2', '3', '4', '5', '6'];

  const getYearLevelLabel = (val) => {
    if (val === '6') return 'Batch X';
    const suffix = val === '1' ? 'st' : val === '2' ? 'nd' : val === '3' ? 'rd' : 'th';
    return `${val}${suffix} Year`;
  };

  const getRoleLabel = (val) => {
    return val === 'STUDENT' ? 'Student' : 'Faculty & Staff';
  };

  const getFitnessLabel = (val) => {
    const map = { 'FIT': 'Physically Fit', 'UNFIT': 'Physically Unfit' };
    return map[val] || val;
  };

  const getIssuanceLabel = (val) => {
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  const chartRef = React.useRef(null);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch Master list of doctors for the filter options (unfiltered by current selection)
  useEffect(() => {
    const fetchMasterDoctors = async () => {
      try {
        const response = await reportService.getDashboardAnalytics({ 
          date_range: 'all',
          report_type: 'MEDICAL_CERTIFICATE' 
        });
        const doctors = Array.from(new Set((response?.data?.certifications?.doctor_workload || []).map(d => d.name).filter(Boolean))).sort();
        setMasterDoctors(doctors);
      } catch (err) {
        console.error("Failed to fetch master doctors:", err);
      }
    };
    fetchMasterDoctors();
  }, []);

  const fetchAnalytics = useCallback(async (isModal = false) => {
    try {
      if (!isModal) setLoading(true);
      setError(null);
      
      const currentRange = isModal ? modalDateRange : dateRange;
      const params = {
        date_start: isModal ? (modalDateRange === 'custom' ? modalStartDate : undefined) : (dateRange === 'custom' ? customStart : undefined),
        date_end: isModal ? (modalDateRange === 'custom' ? modalEndDate : undefined) : (dateRange === 'custom' ? customEnd : undefined),
        date_range: currentRange,
      };

      if (isModal) {
        if (selectedFitness.length > 0) params.fitness_status = selectedFitness.join(',');
        if (selectedIssuance.length > 0) params.issuance_status = selectedIssuance.join(',');
        if (selectedDoctors.length > 0) params.doctor = selectedDoctors.join(',');
        if (selectedCampuses.length > 0) params.campus = selectedCampuses.join(',');
        if (selectedRoles.length > 0) params.role = selectedRoles.join(',');
        if (selectedYearLevels.length > 0) params.year_level = selectedYearLevels.join(',');
        if (searchQuery) params.search = searchQuery;
      }

      const response = await reportService.getDashboardAnalytics(params);
      setData(response.data);
    } catch (err) {
      console.error("Failed fetching certification stats:", err);
      setError("Failed to load certification statistics.");
    } finally {
      if (!isModal) setLoading(false);
    }
  }, [modalDateRange, dateRange, modalStartDate, customStart, modalEndDate, customEnd, selectedFitness, selectedIssuance, selectedDoctors, selectedCampuses, selectedRoles, selectedYearLevels, searchQuery]);

  useEffect(() => {
    fetchAnalytics(openModal);
  }, [openModal, fetchAnalytics, selectedFitness, selectedIssuance, selectedDoctors, selectedRoles, selectedYearLevels]);

  const handleGenerateReport = async (format = 'PDF') => {
    try {
      setGenerating(true);
      setError(null);
      
      const payload = {
        title: `Medical Fitness & Certification Report - ${new Date().toLocaleDateString()}`,
        export_format: format,
        date_range: modalDateRange,
        date_range_start: modalDateRange === 'custom' ? modalStartDate : undefined,
        date_range_end: modalDateRange === 'custom' ? modalEndDate : undefined,
        filters: {
          fitness_status: selectedFitness.length > 0 ? selectedFitness : undefined,
          issuance_status: selectedIssuance.length > 0 ? selectedIssuance : undefined,
          doctor: selectedDoctors.length > 0 ? selectedDoctors : undefined,
          campus: selectedCampuses.length > 0 ? selectedCampuses : undefined,
          role: selectedRoles.length > 0 ? selectedRoles : undefined,
          year_level: selectedYearLevels.length > 0 ? selectedYearLevels : undefined,
          search: searchQuery || undefined,
          charts_base64: chartRef.current ? [chartRef.current.toBase64Image()] : []
        }
      };

      const response = await reportService.generateReport('MEDICAL_CERTIFICATE', payload);
      // Success toast handled globally via api.js interceptor
    } catch (err) {
      console.error("Failed to generate report:", err);
      setError("Failed to trigger report generation.");
    } finally {
      setGenerating(false);
    }
  };

  const generatePieData = () => {
    if (!data?.certifications?.fitness_distribution) return { labels: [], datasets: [] };
    
    const dist = data.certifications.fitness_distribution;
    return {
      labels: dist.map(d => d.status),
      datasets: [
        {
          data: dist.map(d => d.count),
          backgroundColor: dist.map(d => 
            d.status.toLowerCase().includes('unfit') ? '#ef4444' : 
            d.status.toLowerCase().includes('fit') ? '#10b981' : 
            '#3b82f6'
          ),
          borderWidth: 1
        }
      ]
    };
  };

  const generateBarData = () => {
    if (!data?.certifications?.purpose_distribution) return { labels: [], datasets: [] };
    
    // Sort by count and take top 10
    const dist = [...data.certifications.purpose_distribution]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      labels: dist.map(d => wrapText(d.name, 35)), // Increased wrap limit for horizontal
      datasets: [
        {
          label: 'Total Certificates Issued',
          data: dist.map(d => d.count),
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          barThickness: 24,
        }
      ]
    };
  };

  return (
    <Box sx={{ width: '100%', marginBottom: '20px' }}>
      
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <CertIcon sx={{ color: '#059669', fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#065f46', fontSize: '1.1rem' }}>
                Medical Fitness & Certification
              </Typography>
            </Box>
            {!loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setOpenModal(true)}
                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Certification Workshop
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: '8px', textAlign: 'center', border: '1px solid #dcfce7' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#166534' }}>
                  {loading ? '...' : data?.certifications?.total_certificates || 0}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#15803d', textTransform: 'uppercase', display: 'block' }}>
                  Total Certificates
                </Typography>
                <Typography variant="caption" sx={{ color: '#166534', fontStyle: 'italic', fontSize: '0.65rem' }}>
                  Includes all issuance & workflow statuses
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? <CircularProgress size={20} /> : (
                  <Pie 
                    data={generatePieData()} 
                    options={{ 
                      plugins: { legend: { display: false } },
                      maintainAspectRatio: false 
                    }} 
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#065f46' }}>
              Medical Fitness & Certification Workshop
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Monitor institutional health clearance workflows, fitness distributions, and doctor issuance workloads.
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: '#fcfcfc' }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          {/* FILTERS ROW 1 */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                multiple
                size="small"
                options={fitnessOptions}
                value={selectedFitness}
                getOptionLabel={(option) => getFitnessLabel(option)}
                onChange={(e, v) => setSelectedFitness(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={getFitnessLabel(option)} size="small" color="primary" {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Fitness Status" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                multiple
                size="small"
                options={issuanceOptions}
                value={selectedIssuance}
                getOptionLabel={(option) => getIssuanceLabel(option)}
                onChange={(e, v) => setSelectedIssuance(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={getIssuanceLabel(option)} size="small" color="secondary" {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Issuance Status" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                multiple
                size="small"
                options={masterDoctors}
                value={selectedDoctors}
                getOptionLabel={(option) => `Dr. ${option}`}
                onChange={(e, v) => setSelectedDoctors(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={`Dr. ${option}`} size="small" color="primary" variant="outlined" {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Issuing Doctor" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Timeline</InputLabel>
                <Select value={modalDateRange} label="Timeline" onChange={(e) => setModalDateRange(e.target.value)}>
                  <MenuItem value="all">Full Academic History</MenuItem>
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="30days">Last 30 Days</MenuItem>
                  <MenuItem value="6months">Last 6 Months</MenuItem>
                  <MenuItem value="custom">Manual Range Selection</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* FILTERS ROW 2 */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                multiple
                size="small"
                options={campusOptions}
                value={selectedCampuses}
                onChange={(e, v) => setSelectedCampuses(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={option.split(' (')[1]?.replace(')', '') || option} size="small" color="info" {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Campus Location" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                multiple
                size="small"
                options={roleOptions}
                value={selectedRoles}
                getOptionLabel={(option) => getRoleLabel(option)}
                onChange={(e, v) => setSelectedRoles(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={getRoleLabel(option)} size="small" sx={{ bgcolor: '#f0f9ff', color: '#0369a1' }} {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Patient Role" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                multiple
                size="small"
                options={yearLevelOptions}
                value={selectedYearLevels}
                getOptionLabel={(option) => getYearLevelLabel(option)}
                onChange={(e, v) => setSelectedYearLevels(v)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} label={getYearLevelLabel(option)} size="small" variant="outlined" {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Year Level" variant="outlined" />}
              />
            </Grid>
            {modalDateRange === 'custom' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" label="Start Date" size="small" value={modalStartDate} onChange={(e) => setModalStartDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ max: modalEndDate || getTodayString() }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" label="End Date" size="small" value={modalEndDate} onChange={(e) => setModalEndDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: modalStartDate, max: getTodayString() }} />
                </Grid>
              </>
            )}
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PieIcon sx={{ color: '#059669' }} fontSize="small" /> Fitness Determination Distribution
                </Typography>
                <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                  {data?.certifications?.fitness_distribution?.length > 0 ? (
                    <Pie data={generatePieData()} options={{ maintainAspectRatio: false }} />
                  ) : <Typography variant="body2" color="text.secondary" sx={{ mt: 10 }}>No fitness data found</Typography>}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#ffffff', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StatsIcon sx={{ color: '#3b82f6' }} fontSize="small" /> Top Certificate Purposes
                </Typography>
                <Box sx={{ height: 400 }}>
                  {data?.certifications?.purpose_distribution?.length > 0 ? (
                    <Bar 
                      ref={chartRef} 
                      data={generateBarData()} 
                      options={{ 
                        maintainAspectRatio: false, 
                        indexAxis: 'y', 
                        plugins: { 
                          legend: { display: false },
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
                        scales: {
                          x: { beginAtZero: true, grid: { display: false }, ticks: { precision: 0 } },
                          y: { 
                            grid: { color: '#f1f5f9' }, 
                            ticks: { 
                              font: { size: 10, weight: '500' },
                              padding: 10
                            } 
                          }
                        },
                        layout: {
                          padding: { left: 20, right: 40, top: 0, bottom: 0 }
                        }
                      }} 
                    />
                  ) : <Typography variant="body2" color="text.secondary" sx={{ mt: 10, textAlign: 'center' }}>No purpose data found</Typography>}
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Issuance Audit Log</Typography>
            <TextField
              size="small"
              placeholder="Search by student, ID, or template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              }}
              sx={{ width: 350 }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350, borderRadius: '8px' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Patient Name</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>ID Number</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Purpose / Template</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Fitness</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Issuing Doctor</TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.certifications?.certificates_log || []).map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.patient}</TableCell>
                      <TableCell>{row.usc_id}</TableCell>
                      <TableCell>{row.template}</TableCell>
                      <TableCell>
                        <Chip 
                          label={row.fitness} 
                          size="small" 
                          variant="outlined"
                          color={row.fitness?.toLowerCase().includes('fit') && !row.fitness?.toLowerCase().includes('unfit') ? 'success' : 'error'} 
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={row.status} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                      </TableCell>
                      <TableCell>{row.doctor}</TableCell>
                      <TableCell>{row.date}</TableCell>
                    </TableRow>
                  ))}
                  {(!data?.certifications?.certificates_log || data.certifications.certificates_log.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">No certificates found matching criteria.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Doctor Workload & Issuance Metrics</Typography>
            <Grid container spacing={2}>
              {(data?.certifications?.doctor_workload || []).map((doc, i) => (
                <Grid item xs={6} sm={3} key={i}>
                  <Box sx={{ p: 1.5, border: '1px dotted #cbd5e1', borderRadius: '8px', textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{doc.count}</Typography>
                    <Typography variant="caption" color="text.secondary">Dr. {doc.name}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: 'text.secondary' }}>Close Workshop</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('EXCEL')} disabled={generating} sx={{ mr: 1 }}>Excel</Button>
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('CSV')} disabled={generating} sx={{ mr: 1 }}>CSV</Button>
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('HTML')} disabled={generating} sx={{ mr: 1 }}>HTML</Button>
          <Button variant="outlined" size="small" onClick={() => handleGenerateReport('JSON')} disabled={generating} sx={{ mr: 1 }}>JSON</Button>
          <Button 
            variant="contained" 
            onClick={() => handleGenerateReport('PDF')}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, px: 3, fontWeight: 600 }}
          >
            {generating ? 'Processing...' : 'Generate Certification PDF'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default CertificationWorkshopPreview;
