import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Avatar,
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon,
  Download as DownloadIcon,
  CalendarMonth as CalendarIcon,
  MedicalServices as MedicalIcon,
  Healing as HealingIcon,
  Description as TemplateIcon,
  Timeline as TimelineIcon,
  Assignment as CertificateIcon,
  BarChart as ReportIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Medication as MedicationIcon,
  LocalHospital as HospitalIcon,
  Favorite as HeartIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import dayjs from 'dayjs';
import InfoTooltip from './utils/InfoTooltip';
import { healthRecordsService } from '../services/api';

// Tab panel component for different record types
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-health-record-tabpanel-${index}`}
      aria-labelledby={`student-health-record-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StudentHealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [expandedRecord, setExpandedRecord] = useState(false);
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    fetchMyHealthRecords();
  }, []);

  const fetchMyHealthRecords = async () => {
    setLoading(true);
    try {
      const response = await healthRecordsService.getAll();
      console.log('API Response for student health records:', response.data);
      console.log('Current user:', user);
      
      // Backend already filters records for students, filter for medical records only
      const medicalRecords = (response.data || []).filter(record => {
        // Include if it's explicitly marked as MEDICAL or has medical-specific fields
        const isMedical = record.record_type === 'MEDICAL' || 
                         record.chief_complaint || 
                         record.history_present_illness ||
                         record.physical_examination ||
                         record.blood_pressure ||
                         record.temperature ||
                         record.pulse_rate ||
                         record.medications ||
                         record.vital_signs?.blood_pressure ||
                         record.vital_signs?.temperature ||
                         record.vital_signs?.heart_rate ||
                         record.vital_signs?.respiratory_rate;
        
        // Exclude if it's explicitly marked as DENTAL or has dental-specific fields  
        const isDental = record.record_type === 'DENTAL' ||
                        record.procedure_performed ||
                        record.procedure_performed_display ||
                        record.tooth_number ||
                        record.pain_level !== undefined ||
                        record.cost !== undefined;
        
        // Include if it's medical OR if it's not clearly dental
        return isMedical || !isDental;
      });
      console.log('Filtered medical records:', medicalRecords);
      setRecords(medicalRecords);
    } catch (error) {
      console.error('Error fetching my health records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedRecord(isExpanded ? panel : false);
  };

  // Filter records based on search term and selected date (only medical records)
  const filteredRecords = records.filter(record => {
    const searchMatch = 
      (record.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.treatment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.chief_complaint || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateMatch = selectedDate ? record.visit_date === dayjs(selectedDate).format('YYYY-MM-DD') : true;
    
    return searchMatch && dateMatch;
  });

  // Get health insights for the student
  const getHealthInsights = () => {
    const insights = [];
    const totalRecords = records.length;
    const recentRecords = records.filter(r => dayjs(r.visit_date).isAfter(dayjs().subtract(90, 'day'))).length;
    
    if (totalRecords === 0) {
      insights.push({
        type: 'info',
        message: 'No medical records found. Visit the clinic for your first medical checkup!',
        icon: <HospitalIcon />
      });
    } else {
      insights.push({
        type: 'success',
        message: `You have ${totalRecords} medical record${totalRecords > 1 ? 's' : ''} in our system.`,
        icon: <HeartIcon />
      });
      
      if (recentRecords > 0) {
        insights.push({
          type: 'info',
          message: `${recentRecords} medical visit${recentRecords > 1 ? 's' : ''} in the last 3 months. Keep up with regular health checkups!`,
          icon: <CalendarIcon />
        });
      }
      
      insights.push({
        type: 'info',
        message: 'For dental records, please visit the dedicated Dental Records page.',
        icon: <HealingIcon />
      });
    }
    
    return insights;
  };

  // Export student's own records
  const handleExportMyRecords = () => {
    if (filteredRecords.length === 0) {
      alert('No health records to export');
      return;
    }

    const exportData = filteredRecords.map(record => ({
      'Visit Date': dayjs(record.visit_date).format('YYYY-MM-DD'),
      'Record Type': record.record_type === 'MEDICAL' ? 'Medical' : 'Dental',
      'Chief Complaint': record.chief_complaint || 'N/A',
      'Diagnosis': record.diagnosis || 'No diagnosis',
      'Treatment': record.treatment || record.treatment_performed || 'No treatment',
      'Notes': record.notes || 'No additional notes',
      'Blood Pressure': record.blood_pressure || 'N/A',
      'Temperature': record.temperature || 'N/A',
      'Pulse Rate': record.pulse_rate || 'N/A',
      'Medications': record.medications || 'None prescribed',
      'Follow-up Instructions': record.follow_up_instructions || 'None specified',
      'Created Date': dayjs(record.created_at).format('YYYY-MM-DD HH:mm')
    }));

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
    link.setAttribute('download', `my-health-records-${dayjs().format('YYYY-MM-DD-HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Medical Records
        </Typography>
        <InfoTooltip title="Search and filter your medical records. Export data or open related pages from quick actions." />
      </Box>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View your complete medical history from USC clinic visits.
      </Typography>

      {/* Health Insights */}
      <Card elevation={2} sx={{ mb: 3, background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InsightsIcon sx={{ color: '#2e7d32' }} />
            <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
              Health Insights
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {getHealthInsights().map((insight, index) => (
              <Grid item xs={12} key={index}>
                <Alert 
                  severity={insight.type} 
                  icon={insight.icon}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '& .MuiAlert-icon': { color: '#2e7d32' }
                  }}
                >
                  {insight.message}
                </Alert>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Medical Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.filter(r => dayjs(r.visit_date).isAfter(dayjs().subtract(30, 'day'))).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 30 Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.filter(r => dayjs(r.visit_date).isAfter(dayjs().subtract(90, 'day'))).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 90 Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<CertificateIcon />}
              onClick={() => window.open('/medical-certificates', '_blank')}
              size="small"
            >
              Request Medical Certificate
            </Button>
            <Button
              variant="outlined"
              startIcon={<HealingIcon />}
              onClick={() => window.open('/dental-records', '_blank')}
              size="small"
            >
              View Dental Records
            </Button>
            <Button
              variant="outlined"
              startIcon={<HospitalIcon />}
              onClick={() => window.open('/health-info', '_blank')}
              size="small"
            >
              Health Information
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportMyRecords}
              disabled={filteredRecords.length === 0}
              size="small"
              sx={{ borderColor: '#2e7d32', color: '#2e7d32', '&:hover': { borderColor: '#1b5e20', bgcolor: '#f1f8e9' } }}
            >
              Export My Records
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Search Records"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
          sx={{ flexGrow: 1, maxWidth: 300 }}
          placeholder="Search diagnosis, treatment, notes..."
        />

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Filter by Date"
            value={selectedDate}
            onChange={setSelectedDate}
            slotProps={{ textField: { size: 'small' } }}
            sx={{ width: 200 }}
          />
        </LocalizationProvider>
      </Box>

      {/* Medical Records Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MedicalIcon color="primary" />
          Medical Records ({records.length})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your complete medical visit history and treatment records
        </Typography>
      </Box>

      {/* Records Display */}
      {loading ? (
        <Typography>Loading your health records...</Typography>
      ) : filteredRecords.length > 0 ? (
        <Box sx={{ mt: 2 }}>
          {filteredRecords.map((record, index) => {
            return (
              <Accordion 
                key={record.id} 
                expanded={expandedRecord === `panel${index}`}
                onChange={handleAccordionChange(`panel${index}`)}
                sx={{ mb: 2 }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel${index}bh-content`}
                  id={`panel${index}bh-header`}
                  sx={{ 
                    backgroundColor: 'rgba(25, 118, 210, 0.05)',
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      <MedicalIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {dayjs(record.visit_date).format('MMMM DD, YYYY')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.diagnosis || 'No diagnosis recorded'}
                      </Typography>
                    </Box>
                    <Chip 
                      label="Medical Record" 
                      color="primary" 
                      size="small" 
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {/* Left Column */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        Clinical Information
                      </Typography>
                      
                      {record.chief_complaint && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Chief Complaint:</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {record.chief_complaint}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold">Diagnosis:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {record.diagnosis || 'No diagnosis recorded'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold">Treatment:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {record.treatment || 'No treatment recorded'}
                        </Typography>
                      </Box>

                      {record.notes && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Notes:</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {record.notes}
                          </Typography>
                        </Box>
                      )}

                      {record.medications && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Medications:</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {record.medications}
                          </Typography>
                        </Box>
                      )}
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        Vital Signs
                      </Typography>
                      <Box sx={{ backgroundColor: 'rgba(25, 118, 210, 0.05)', p: 2, borderRadius: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" fontWeight="bold">Blood Pressure:</Typography>
                            <Typography variant="body2">
                              {record.vital_signs?.blood_pressure || record.blood_pressure || 'Not recorded'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" fontWeight="bold">Temperature:</Typography>
                            <Typography variant="body2">
                              {record.vital_signs?.temperature || record.temperature ? 
                                `${record.vital_signs?.temperature || record.temperature}°C` : 'Not recorded'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" fontWeight="bold">Pulse Rate:</Typography>
                            <Typography variant="body2">
                              {record.vital_signs?.heart_rate || record.pulse_rate || record.heart_rate ? 
                                `${record.vital_signs?.heart_rate || record.pulse_rate || record.heart_rate} bpm` : 'Not recorded'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" fontWeight="bold">Respiratory Rate:</Typography>
                            <Typography variant="body2">
                              {record.vital_signs?.respiratory_rate || record.respiratory_rate ? 
                                `${record.vital_signs?.respiratory_rate || record.respiratory_rate}/min` : 'Not recorded'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      {record.follow_up_instructions && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" fontWeight="bold">Follow-up Instructions:</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {record.follow_up_instructions}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="caption" color="text.secondary">
                        Record created: {dayjs(record.created_at).format('MMM DD, YYYY HH:mm')}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HospitalIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Health Records Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchTerm || selectedDate 
              ? 'No records match your current filters. Try adjusting your search criteria.'
              : 'You don\'t have any health records yet. Visit the USC clinic for your first checkup!'
            }
          </Typography>
          {(searchTerm || selectedDate) && (
            <Button 
              variant="outlined" 
              onClick={() => { setSearchTerm(''); setSelectedDate(null); }}
              size="small"
            >
              Clear Filters
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default StudentHealthRecords;
