import React, { useEffect, useState, useCallback } from 'react';
import { 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  CircularProgress, 
  TextField, 
  InputAdornment, 
  Chip,
  Tab,
  Tabs,
  Grid,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  LinearProgress,
  Stack,
  Divider,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  LocalHospital as MedicalIcon,
  //Healing as DentalIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Print as PrintIcon,
  GetApp as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  InsertDriveFile as CsvIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Medication as MedicationIcon,
  Favorite as VitalIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { healthRecordsService, patientService } from '../services/api';
import { useSelector } from 'react-redux';
import { formatDateComprehensive, formatDatePH, formatDateTimePH } from '../utils/dateUtils';
import InfoTooltip from './utils/InfoTooltip';

dayjs.extend(relativeTime);

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`medical-records-tabpanel-${index}`}
      aria-labelledby={`medical-records-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const MedicalRecordsPage = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [filteredMedicalRecords, setFilteredMedicalRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [procedureFilter, setProcedureFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  const user = useSelector(state => state.auth.user);
  const isStaffOrMedical = user?.role && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'].includes(user.role);
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    fetchMedicalRecords();
    if (isStaffOrMedical) {
      fetchPatients();
    }
  }, []);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, medicalRecords, selectedPatient, startDate, endDate, priorityFilter]);

  const fetchMedicalRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthRecordsService.getAll();
      const recordsData = response.data || [];
      setMedicalRecords(recordsData);
    } catch (err) {
      setError('Failed to load medical records.');
      console.error('Error fetching medical records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dental records are handled on the dedicated /dental-records page

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const filterRecords = () => {
    // Enhanced search functionality
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Filter medical records with enhanced multi-field search
    let filteredMedical = medicalRecords;
    
    if (selectedPatient) {
      filteredMedical = filteredMedical.filter(record => record.patient?.id === selectedPatient.id);
    }
    
    if (searchLower !== '') {
      filteredMedical = filteredMedical.filter(record => 
        // Patient information
        record.patient_name?.toLowerCase().includes(searchLower) ||
        record.patient?.first_name?.toLowerCase().includes(searchLower) ||
        record.patient?.last_name?.toLowerCase().includes(searchLower) ||
        record.patient?.email?.toLowerCase().includes(searchLower) ||
        record.patient_usc_id?.toLowerCase().includes(searchLower) ||
        
        // Medical information
        record.diagnosis?.toLowerCase().includes(searchLower) ||
        record.treatment?.toLowerCase().includes(searchLower) ||
        record.chief_complaint?.toLowerCase().includes(searchLower) ||
        record.medications?.toLowerCase().includes(searchLower) ||
        record.notes?.toLowerCase().includes(searchLower) ||
        
        // Vital signs search
        record.temperature?.toString().includes(searchLower) ||
        record.blood_pressure?.toLowerCase().includes(searchLower) ||
        record.pulse_rate?.toString().includes(searchLower) ||
        
        // Full name search
        `${record.patient?.first_name} ${record.patient?.last_name}`.toLowerCase().includes(searchLower)
      );
    }
    
    if (startDate) {
      filteredMedical = filteredMedical.filter(record => 
        dayjs(record.visit_date).isAfter(dayjs(startDate).subtract(1, 'day'))
      );
    }
    
    if (endDate) {
      filteredMedical = filteredMedical.filter(record => 
        dayjs(record.visit_date).isBefore(dayjs(endDate).add(1, 'day'))
      );
    }
    
    setFilteredMedicalRecords(filteredMedical.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date)));
    
  };


  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return { formatted: 'N/A', relative: 'N/A' };
    try {
      // Use our centralized date utilities for consistent Philippines timezone handling
      return formatDateComprehensive(dateString);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return { formatted: dateString, relative: '' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return '#f44336';
      case 'HIGH': return '#ff9800';
      case 'MEDIUM': return '#2196f3';
      case 'LOW': return '#4caf50';
      default: return '#757575';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPatient(null);
    setStartDate(null);
    setEndDate(null);
    setProcedureFilter('');
    setPriorityFilter('');
  };

  // Enhanced export functions with multiple formats and comprehensive data
  const handleExportCSV = (recordType = 'all') => {
    let exportData = [];

    if (recordType === 'medical' || recordType === 'all') {
      const medicalExport = filteredMedicalRecords.map(record => ({
        'Record Type': 'Medical',
        'Record ID': record.id,
        'Visit Date': formatDate(record.visit_date).formatted,
        'Patient Name': record.patient_name || 'Unknown',
        'USC ID': record.patient_usc_id || 'N/A',
        'Chief Complaint': record.chief_complaint || 'Not specified',
        'Present Illness': record.history_present_illness || 'Not documented',
        'Past Medical History': record.past_medical_history || 'None reported',
        'Physical Examination': record.physical_examination || 'Not performed',
        'Vital Signs': `BP: ${record.blood_pressure || 'N/A'}, Temp: ${record.temperature || 'N/A'}°C, Pulse: ${record.pulse_rate || 'N/A'} bpm, RR: ${record.respiratory_rate || 'N/A'}/min`,
        'Diagnosis': record.diagnosis || 'No diagnosis',
        'Treatment Plan': record.treatment || 'No treatment',
        'Medications': record.medications || 'None prescribed',
        'Laboratory Results': record.laboratory_results || 'None ordered',
        'Follow-up Instructions': record.follow_up_instructions || 'None specified',
        'Clinical Notes': record.notes || 'No additional notes',
        'Created Date': formatDate(record.created_at).formatted,
        'Last Updated': formatDate(record.updated_at).formatted
      }));
      exportData = [...exportData, ...medicalExport];
    }
    
    // Dental export removed from this page
    
    if (exportData.length === 0) {
      alert('No records to export');
      return;
    }
    
    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(record => 
        Object.values(record).map(value => 
          `"${String(value).replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${recordType}-records-comprehensive-${dayjs().format('YYYY-MM-DD-HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = (recordType = 'medical') => {
    let exportData = [];
    
    if (recordType === 'medical' || recordType === 'all') {
      const medicalExport = filteredMedicalRecords.map(record => ({
        'Record Type': 'Medical',
        'ID': record.id,
        'Visit Date': record.visit_date,
        'Patient': record.patient_name || 'Unknown',
        'USC ID': record.patient_usc_id || '',
        'Chief Complaint': record.chief_complaint || '',
        'Present Illness History': record.history_present_illness || '',
        'Past Medical History': record.past_medical_history || '',
        'Physical Exam': record.physical_examination || '',
        'Blood Pressure': record.blood_pressure || '',
        'Temperature (°C)': record.temperature || '',
        'Pulse Rate (bpm)': record.pulse_rate || '',
        'Respiratory Rate': record.respiratory_rate || '',
        'Clinical Diagnosis': record.diagnosis || '',
        'Treatment Plan': record.treatment || '',
        'Medications Prescribed': record.medications || '',
        'Lab Results': record.laboratory_results || '',
        'Follow-up Instructions': record.follow_up_instructions || '',
        'Additional Notes': record.notes || '',
        'Record Created': record.created_at,
        'Last Modified': record.updated_at
      }));
      exportData = [...exportData, ...medicalExport];
    }
    
    // Dental export removed from this page
    
    if (exportData.length === 0) {
      alert('No records to export');
      return;
    }

    // Create tab-separated content for Excel compatibility
    const tsvContent = [
      Object.keys(exportData[0]).join('\t'),
      ...exportData.map(record => 
        Object.values(record).map(value => 
          String(value).replace(/\t/g, ' ').replace(/\n/g, ' ')
        ).join('\t')
      )
    ].join('\n');

    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${recordType}-records-comprehensive-${dayjs().format('YYYY-MM-DD-HHmm')}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = (recordType = 'medical') => {
    let recordsToPrint = filteredMedicalRecords;
    let reportTitle = 'Medical Records Report';
    
    if (recordsToPrint.length === 0) {
      alert('No records to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>USC-PIS ${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1976d2; padding-bottom: 20px; }
            .header h1 { color: #1976d2; margin: 10px 0; font-size: 24px; }
            .header h2 { color: #1976d2; margin: 5px 0; font-size: 20px; }
            .header p { margin: 5px 0; color: #666; }
            .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .record { border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 5px; page-break-inside: avoid; }
            .record-header { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 10px; margin: -15px -15px 15px -15px; border-radius: 5px 5px 0 0; }
            .record-type { display: inline-block; background: #1976d2; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin-right: 10px; }
            .record-title { font-weight: bold; color: #1976d2; font-size: 16px; margin-top: 5px; }
            .record-meta { color: #666; font-size: 14px; margin-top: 5px; }
            .record-body { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
            .field-group { margin-bottom: 15px; }
            .field-group h4 { color: #1976d2; margin-bottom: 8px; font-size: 14px; border-bottom: 1px solid #e0e0e0; padding-bottom: 3px; }
            .field { margin-bottom: 6px; }
            .field-label { font-weight: bold; color: #333; display: inline-block; min-width: 120px; }
            .field-value { color: #666; }
            .vitals { background: #f0f8ff; padding: 10px; border-radius: 3px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; color: #666; }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; }
              .record { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>University of Southern California</h1>
            <h2>Patient Information System</h2>
            <h2>${reportTitle}</h2>
            <p>Generated on: ${dayjs().format('MMMM DD, YYYY [at] HH:mm')}</p>
            <p>Total Records: ${recordsToPrint.length}</p>
          </div>
          
          <div class="summary">
            <h3>Report Summary</h3>
            <p><strong>Medical Records:</strong> ${filteredMedicalRecords.length}</p>
            <p><strong>Date Range:</strong> ${startDate && endDate ? `${dayjs(startDate).format('MMM DD, YYYY')} - ${dayjs(endDate).format('MMM DD, YYYY')}` : 'All dates'}</p>
            <p><strong>Patient Filter:</strong> ${selectedPatient ? selectedPatient.first_name + ' ' + selectedPatient.last_name : 'All patients'}</p>
          </div>
          
          ${recordsToPrint.map(record => {
            const ismedical = record.chief_complaint !== undefined;
            return `
              <div class="record">
                <div class="record-header">
                  <span class="record-type">${ismedical ? 'MEDICAL' : 'DENTAL'}</span>
                  <div class="record-title">${record.patient_name || 'Unknown Patient'}</div>
                  <div class="record-meta">
                    Record #${record.id} | Visit: ${formatDate(record.visit_date).formatted} | 
                    USC ID: ${record.patient_usc_id || 'N/A'}
                  </div>
                </div>
                <div class="record-body">
                  <div>
                    ${ismedical ? `
                      <div class="field-group">
                        <h4>Clinical Assessment</h4>
                        <div class="field">
                          <span class="field-label">Chief Complaint:</span>
                          <span class="field-value">${record.chief_complaint || 'Not specified'}</span>
                        </div>
                        <div class="field">
                          <span class="field-label">Present Illness:</span>
                          <span class="field-value">${record.history_present_illness || 'Not documented'}</span>
                        </div>
                        <div class="field">
                          <span class="field-label">Physical Exam:</span>
                          <span class="field-value">${record.physical_examination || 'Not performed'}</span>
                        </div>
                      </div>
                      <div class="vitals">
                        <h4>Vital Signs</h4>
                        <div class="field">
                          <span class="field-label">Blood Pressure:</span>
                          <span class="field-value">${record.blood_pressure || 'N/A'}</span>
                        </div>
                        <div class="field">
                          <span class="field-label">Temperature:</span>
                          <span class="field-value">${record.temperature || 'N/A'}°C</span>
                        </div>
                        <div class="field">
                          <span class="field-label">Pulse Rate:</span>
                          <span class="field-value">${record.pulse_rate || 'N/A'} bpm</span>
                        </div>
                        <div class="field">
                          <span class="field-label">Respiratory Rate:</span>
                          <span class="field-value">${record.respiratory_rate || 'N/A'}/min</span>
                        </div>
                      </div>
                    ` : `
                      <div class="field-group">
                        <h4>Dental Information</h4>
                        <div class="field">
                          <span class="field-label">Procedure:</span>
                          <span class="field-value">${record.procedure_performed_display || 'N/A'}</span>
                        </div>
                        <div class="field">
                          <span class="field-label">Tooth Number:</span>
                          <span class="field-value">${record.tooth_number || 'N/A'}</span>
                        </div>
                        <div class="field">
                          <span class="field-label">Priority:</span>
                          <span class="field-value">${record.priority || 'N/A'}</span>
                        </div>
                        <div class="field">
                          <span class="field-label">Pain Level:</span>
                          <span class="field-value">${record.pain_level || 'N/A'}/10</span>
                        </div>
                        <div class="field">
                          <span class="field-label">Cost:</span>
                          <span class="field-value">${formatCurrency(record.cost)}</span>
                        </div>
                      </div>
                    `}
                  </div>
                  <div>
                    <div class="field-group">
                      <h4>Treatment & Diagnosis</h4>
                      <div class="field">
                        <span class="field-label">Diagnosis:</span>
                        <span class="field-value">${record.diagnosis || 'No diagnosis'}</span>
                      </div>
                      <div class="field">
                        <span class="field-label">Treatment:</span>
                        <span class="field-value">${record.treatment || record.treatment_performed || 'No treatment'}</span>
                      </div>
                      ${ismedical ? `
                        <div class="field">
                          <span class="field-label">Medications:</span>
                          <span class="field-value">${record.medications || 'None prescribed'}</span>
                        </div>
                        <div class="field">
                          <span class="field-label">Lab Results:</span>
                          <span class="field-value">${record.laboratory_results || 'None ordered'}</span>
                        </div>
                      ` : ''}
                      <div class="field">
                        <span class="field-label">Notes:</span>
                        <span class="field-value">${record.notes || 'No additional notes'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
          
          <div class="footer">
            <p>University of Southern California Patient Information System</p>
            <p>This report contains confidential medical information</p>
            <p>Generated by USC-PIS on ${dayjs().format('MMMM DD, YYYY')}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Legacy function for backwards compatibility
  const handleExportRecords = (recordType = 'all') => {
    handleExportCSV(recordType);
  };

  // Generate insights data
  const generateInsights = () => {
    const allRecords = [...filteredMedicalRecords];
    
    const insights = {
      totalRecords: allRecords.length,
      medicalRecords: filteredMedicalRecords.length,
      dentalRecords: 0,
      recentRecords: allRecords.filter(r => 
        dayjs(r.visit_date).isAfter(dayjs().subtract(30, 'day'))
      ).length,
      commonConditions: getCommonConditions(allRecords),
      healthTrend: getHealthTrend(allRecords),
      monthlyVisits: getMonthlyVisits(allRecords),
      recommendations: getRecommendations(allRecords)
    };
    
    return insights;
  };

  const getCommonConditions = (records) => {
    const conditions = {};
    records.forEach(record => {
      if (record.diagnosis) {
        conditions[record.diagnosis] = (conditions[record.diagnosis] || 0) + 1;
      }
    });
    
    return Object.entries(conditions)
      .filter(([, count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([condition, count]) => ({ condition, count }));
  };

  const getHealthTrend = (records) => {
    if (records.length < 2) return 'insufficient-data';
    
    const recentVisits = records.filter(r => 
      dayjs(r.visit_date).isAfter(dayjs().subtract(6, 'month'))
    ).length;
    
    const olderVisits = records.filter(r => 
      dayjs(r.visit_date).isBetween(dayjs().subtract(12, 'month'), dayjs().subtract(6, 'month'))
    ).length;
    
    if (recentVisits > olderVisits) return 'increasing';
    if (recentVisits < olderVisits) return 'decreasing';
    return 'stable';
  };

  const getMonthlyVisits = (records) => {
    const months = {};
    records.forEach(record => {
      const month = dayjs(record.visit_date).format('MMM YYYY');
      months[month] = (months[month] || 0) + 1;
    });

    return Object.entries(months)
      .sort(([a], [b]) => dayjs(a, 'MMM YYYY').isAfter(dayjs(b, 'MMM YYYY')) ? -1 : 1)
      .slice(0, 6)
      .map(([month, visits]) => ({ month, visits }));
  };

  const getRecommendations = (records) => {
    const recommendations = [];
    
    const hasRecentVisits = records.some(r => 
      dayjs(r.visit_date).isAfter(dayjs().subtract(3, 'month'))
    );
    
    if (!hasRecentVisits) {
      recommendations.push({
        type: 'warning',
        title: 'Schedule Health Check-up',
        description: 'Consider scheduling a routine health check-up as it has been a while since your last visit.'
      });
    }
    
    const commonConditions = getCommonConditions(records);
    if (commonConditions.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Monitor Recurring Conditions',
        description: `Keep track of symptoms related to ${commonConditions[0].condition} and follow your healthcare provider's advice.`
      });
    }
    
    const dentalVisits = records.filter(r => r.procedure_performed || r.treatment_performed);
    if (dentalVisits.length === 0) {
      recommendations.push({
        type: 'info',
        title: 'Dental Care',
        description: 'Regular dental check-ups are important for overall health. Consider scheduling a dental examination.'
      });
    }
    
    if (records.length >= 5) {
      recommendations.push({
        type: 'success',
        title: 'Good Health Monitoring',
        description: 'You are actively monitoring your health. Keep up with regular medical care.'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        title: 'Maintain Regular Check-ups',
        description: 'Continue with regular health check-ups to maintain optimal health and catch any issues early.'
      });
    }
    
    return recommendations;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" gutterBottom color="primary">
              {isStudent ? 'Patient Medical Records' : 'Patient Medical Records'}
            </Typography>
            <InfoTooltip title="Browse medical records. Use filters to narrow and actions to export." />
          </Box>
          <Typography variant="body1" color="text.secondary">
            {isStaffOrMedical 
              ? 'Browse and search through patient medical history records with advanced filtering capabilities.' 
              : 'View your complete medical records history, plus personalized health insights.'
            }
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="medical records tabs">
            <Tab 
              label={`Medical Records (${filteredMedicalRecords.length})`} 
              icon={<MedicalIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Health Insights" 
              icon={<AnalyticsIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" gutterBottom color="primary">
            🔍 Search & Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search medical records"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Search by patient name, diagnosis, treatment, medications, notes..."
                helperText="Search across all medical records"
              />
            </Grid>
            
            {/* Enhanced Patient Filter for Staff */}
            {isStaffOrMedical && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Patient</InputLabel>
                  <Select
                    value={selectedPatient?.id || ''}
                    label="Filter by Patient"
                    onChange={(e) => {
                      const patient = patients.find(p => p.id === e.target.value);
                      setSelectedPatient(patient || null);
                    }}
                    startAdornment={<PersonIcon sx={{ color: 'action.active', mr: 1 }} />}
                  >
                    <MenuItem value="">
                      <em>All Patients ({patients.length} total)</em>
                    </MenuItem>
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
                            {patient.first_name?.[0]}{patient.last_name?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {patient.first_name} {patient.last_name}
                            </Typography>
                            {patient.usc_id && (
                              <Typography variant="caption" color="text.secondary">
                                USC ID: {patient.usc_id}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} md={2}>
              <DatePicker
                label="From Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                maxDate={endDate || dayjs()}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <DatePicker
                label="To Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                minDate={startDate}
                maxDate={dayjs()}
              />
            </Grid>

            {tabValue === 1 && (
              <>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={priorityFilter}
                      label="Priority"
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <MenuItem value="">All Priorities</MenuItem>
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="URGENT">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12} md={tabValue === 1 ? 1 : 3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  size="small"
                >
                  Clear
                </Button>
                {/* Enhanced Export Options */}
                <Button
                  variant="outlined"
                  startIcon={<CsvIcon />}
                  onClick={() => handleExportCSV(tabValue === 0 ? 'medical' : tabValue === 1 ? 'dental' : 'all')}
                  size="small"
                  disabled={filteredMedicalRecords.length === 0}
                >
                  CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExcelIcon />}
                  onClick={() => handleExportExcel(tabValue === 0 ? 'medical' : tabValue === 1 ? 'dental' : 'all')}
                  size="small"
                  disabled={filteredMedicalRecords.length === 0}
                  sx={{ color: '#0d7c34', borderColor: '#0d7c34', '&:hover': { borderColor: '#0d7c34', bgcolor: '#f0f9f0' } }}
                >
                  Excel
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => handlePrintReport(tabValue === 0 ? 'medical' : tabValue === 1 ? 'dental' : 'all')}
                  size="small"
                  disabled={filteredMedicalRecords.length === 0}
                  sx={{ color: '#d32f2f', borderColor: '#d32f2f', '&:hover': { borderColor: '#d32f2f', bgcolor: '#fff0f0' } }}
                >
                  Print
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Tab Panels */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress size={60} />
            <Typography sx={{ ml: 2 }}>Loading records...</Typography>
          </Box>
        ) : (
          <>
            {/* Medical Records Tab */}
            <TabPanel value={tabValue} index={0}>
              {/* Medical Records List */}
              <Paper sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      Medical Records History
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        label={`${filteredMedicalRecords.length} record${filteredMedicalRecords.length !== 1 ? 's' : ''}`}
                        color="primary"
                        variant="outlined"
                      />
                      {isStaffOrMedical && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => window.open('/health-records', '_blank')}
                          sx={{ 
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' }
                          }}
                        >
                          Create New
                        </Button>
                      )}
                    </Box>
                  </Box>
                  {isStaffOrMedical && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>📝 Create New Records:</strong> Use the "Create New" button above or visit the{' '}
                        <Button 
                          variant="text" 
                          size="small" 
                          onClick={() => window.open('/health-records', '_blank')}
                          sx={{ textTransform: 'none', p: 0, textDecoration: 'underline' }}
                        >
                          Health Records page
                        </Button>{' '}
                        to create new medical records for patients.
                      </Typography>
                    </Alert>
                  )}
                </Box>

                <Box sx={{ p: 3 }}>
                  {filteredMedicalRecords.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <MedicalIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No medical records found
                      </Typography>
                      <Typography color="text.secondary">
                        {isStaffOrMedical 
                          ? 'Create the first medical record using the form above.' 
                          : 'No medical records have been created for your account yet.'
                        }
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarTodayIcon sx={{ mr: 1, fontSize: 18 }} />
                                Date
                              </Box>
                            </TableCell>
                            {isStaffOrMedical && (
                              <TableCell sx={{ fontWeight: 'bold' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                                  Patient
                                </Box>
                              </TableCell>
                            )}
                            <TableCell sx={{ fontWeight: 'bold' }}>Diagnosis</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Treatment</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredMedicalRecords.map((record) => (
                            <TableRow 
                              key={record.id} 
                              hover
                              sx={{ 
                                '&:hover': { backgroundColor: '#f9f9f9' }
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {formatDate(record.visit_date).formatted}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(record.visit_date).relative}
                                </Typography>
                              </TableCell>
                              {isStaffOrMedical && (
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {record.patient_name || `Patient ID: ${record.patient}`}
                                  </Typography>
                                  {record.patient_usc_id && (
                                    <Typography variant="caption" color="text.secondary">
                                      USC ID: {record.patient_usc_id}
                                    </Typography>
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    maxWidth: 200, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {record.diagnosis || 'No diagnosis recorded'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    maxWidth: 200, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {record.treatment || 'No treatment recorded'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Paper>
            </TabPanel>

            {/* Health Insights Tab */}
            <TabPanel value={tabValue} index={1}>
              {(() => {
            const insights = generateInsights();
                
                if (insights.totalRecords === 0) {
                  return (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                      <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No health data available
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Health insights will appear here once you have medical records.
                      </Typography>
                    </Paper>
                  );
                }
                
                return (
                  <Box>
                    <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
                      📊 Your Health Insights
                    </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Personalized insights based on your medical history to help you understand your health better.
            </Typography>

                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={12} md={3}>
                        <Card elevation={2} sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">
                            {insights.totalRecords}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Records
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card elevation={2} sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">
                            {insights.medicalRecords}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Medical Records
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card elevation={2} sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="secondary">
                            {insights.dentalRecords}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Dental Records
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card elevation={2} sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="success.main">
                            {insights.recentRecords}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Recent (30 days)
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                      {/* Health Trend */}
                      <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">
                              📈 Health Trend
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              {insights.healthTrend === 'increasing' && (
                                <>
                                  <TrendingUpIcon color="warning" sx={{ mr: 1 }} />
                                  <Typography>Increased medical visits recently</Typography>
                                </>
                              )}
                              {insights.healthTrend === 'decreasing' && (
                                <>
                                  <TrendingDownIcon color="success" sx={{ mr: 1 }} />
                                  <Typography>Fewer visits recently - good trend</Typography>
                                </>
                              )}
                              {insights.healthTrend === 'stable' && (
                                <>
                                  <TimelineIcon color="info" sx={{ mr: 1 }} />
                                  <Typography>Consistent healthcare monitoring</Typography>
                                </>
                              )}
                              {insights.healthTrend === 'insufficient-data' && (
                                <>
                                  <AnalyticsIcon color="action" sx={{ mr: 1 }} />
                                  <Typography>Need more data for trend analysis</Typography>
                                </>
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Based on the last 12 months of visit patterns.
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Common Conditions */}
                      <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">
                              🏥 Health Patterns
                            </Typography>
                            {insights.commonConditions.length > 0 ? (
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Most frequently addressed conditions:
                                </Typography>
                                <Stack spacing={1}>
                                  {insights.commonConditions.map((condition, index) => (
                                    <Chip 
                                      key={index}
                                      label={`${condition.condition} (${condition.count} times)`}
                                      color="primary"
                                      variant="outlined"
                                      size="small"
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No recurring conditions identified.
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Monthly Visits Chart */}
                      {insights.monthlyVisits.length > 0 && (
                        <Grid item xs={12}>
                          <Card elevation={2}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom color="primary">
                                📅 Visit Frequency (Last 6 Months)
                              </Typography>
                              <Box sx={{ mt: 2 }}>
                                {insights.monthlyVisits.map((month, index) => (
                                  <Box key={index} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                      <Typography variant="body2">{month.month}</Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {month.visits} visit{month.visits !== 1 ? 's' : ''}
                                      </Typography>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={(month.visits / Math.max(...insights.monthlyVisits.map(m => m.visits))) * 100}
                                      sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: '#667eea',
                                          borderRadius: 4,
                                        }
                                      }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {/* Recommendations */}
                      <Grid item xs={12}>
                        <Card elevation={2}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">
                              💡 Personalized Recommendations
                            </Typography>
                            <Grid container spacing={2}>
                              {insights.recommendations.map((rec, index) => (
                                <Grid item xs={12} md={6} key={index}>
                                  <Alert severity={rec.type} sx={{ borderRadius: 2 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                      {rec.title}
                                    </Typography>
                                    <Typography variant="body2">
                                      {rec.description}
                                    </Typography>
                                  </Alert>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })()}
            </TabPanel>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default MedicalRecordsPage;
