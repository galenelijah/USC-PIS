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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Divider,
  Autocomplete,
  Avatar,
  Tooltip
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  GetApp as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  InsertDriveFile as CsvIcon,
  Print as PrintIcon,
  CalendarMonth as CalendarIcon,
  MedicalServices as MedicalIcon,
  Person as PersonIcon,
  Medication as MedicationIcon,
  Healing as HealingIcon,
  Description as TemplateIcon,
  LibraryBooks as LibraryIcon,
  Timeline as TimelineIcon,
  Assignment as CertificateIcon,
  BarChart as ReportIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import dayjs from 'dayjs';
import { healthRecordsService, patientService } from '../services/api';
import MedicalRecord from './MedicalRecord';
import ClinicalAnalytics from './ClinicalAnalytics';

// Tab panel component for different record types
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`health-record-tabpanel-${index}`}
      aria-labelledby={`health-record-tab-${index}`}
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

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const user = useSelector(selectCurrentUser);
  const [selectedMedicalRecordId, setSelectedMedicalRecordId] = useState(null);
  const [openMedicalRecordModal, setOpenMedicalRecordModal] = useState(false);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);

  // Check if user can edit records (not a student)
  const canEditRecords = user && user.role !== 'STUDENT';

  // Clinical Templates for quick record creation
  const clinicalTemplates = [
    {
      name: "Common Cold",
      category: "MEDICAL",
      chief_complaint: "Runny nose, sneezing, and mild cough",
      diagnosis: "Common Cold (Upper Respiratory Infection)",
      treatment: "Rest, increased fluid intake, OTC decongestants as needed. Avoid antibiotics.",
      notes: "Patient advised on proper hand hygiene and rest. Follow-up if symptoms worsen or persist beyond 7-10 days."
    },
    {
      name: "Headache Assessment",
      category: "MEDICAL", 
      chief_complaint: "Headache with mild to moderate intensity",
      diagnosis: "Tension Headache",
      treatment: "OTC pain relievers (acetaminophen/ibuprofen), rest, hydration, stress management.",
      notes: "Patient counseled on trigger identification and lifestyle modifications. Return if severe or persistent."
    },
    {
      name: "Routine Dental Cleaning",
      category: "DENTAL",
      chief_complaint: "Routine dental checkup and cleaning",
      diagnosis: "Routine dental prophylaxis, good oral hygiene",
      treatment: "Professional dental cleaning, fluoride treatment, oral hygiene education.",
      notes: "Regular 6-month dental checkups recommended. Patient demonstrates good oral hygiene practices."
    },
    {
      name: "Minor Wound Care",
      category: "MEDICAL",
      chief_complaint: "Minor cut/abrasion requiring care",
      diagnosis: "Minor laceration/abrasion",
      treatment: "Wound cleaning, antiseptic application, bandaging. Tetanus status verified.",
      notes: "Patient educated on wound care, signs of infection. Follow-up if signs of infection develop."
    },
    {
      name: "Blood Pressure Check",
      category: "MEDICAL",
      chief_complaint: "Routine blood pressure monitoring",
      diagnosis: "Blood pressure assessment",
      treatment: "Lifestyle counseling, dietary recommendations as appropriate.",
      notes: "Patient advised on regular monitoring and healthy lifestyle practices."
    },
    {
      name: "Dental Pain Assessment",
      category: "DENTAL",
      chief_complaint: "Dental pain and discomfort",
      diagnosis: "Dental caries/tooth sensitivity",
      treatment: "Pain management, dental restoration referral if needed.",
      notes: "Patient referred for comprehensive dental evaluation and treatment planning."
    }
  ];

  useEffect(() => {
    fetchHealthRecords();
    fetchPatients();
  }, []);

  const fetchHealthRecords = async () => {
    setLoading(true);
    try {
      const response = await healthRecordsService.getAll();
      setRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching health records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setCurrentRecord({
      patient: null,
      visit_date: dayjs().format('YYYY-MM-DD'),
      record_type: 'MEDICAL',
      chief_complaint: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      vital_signs: {
        temperature: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        oxygen_saturation: ''
      },
      medications: []
    });
    setOpenDialog(true);
  };

  const handleOpenTemplateDialog = () => {
    setOpenTemplateDialog(true);
  };

  const handleCloseTemplateDialog = () => {
    setOpenTemplateDialog(false);
  };

  const handleUseTemplate = (template) => {
    setDialogMode('create');
    setCurrentRecord({
      patient: null,
      visit_date: dayjs().format('YYYY-MM-DD'),
      record_type: template.category,
      chief_complaint: template.chief_complaint,
      diagnosis: template.diagnosis,
      treatment: template.treatment,
      notes: template.notes,
      vital_signs: {
        temperature: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        oxygen_saturation: ''
      },
      medications: []
    });
    setOpenTemplateDialog(false);
    setOpenDialog(true);
  };

  // Workflow automation functions
  const getFollowUpSuggestions = (record) => {
    const suggestions = [];
    
    // Check if follow-up is needed based on diagnosis
    const followUpDiagnoses = [
      'hypertension', 'diabetes', 'chronic', 'ongoing', 'monitor'
    ];
    
    if (followUpDiagnoses.some(keyword => 
      record.diagnosis?.toLowerCase().includes(keyword)
    )) {
      suggestions.push({
        type: 'follow-up',
        message: 'Consider scheduling a follow-up appointment in 2-4 weeks',
        action: 'Schedule Follow-up'
      });
    }
    
    // Check if medical certificate might be needed
    if (record.diagnosis?.toLowerCase().includes('sick') || 
        record.treatment?.toLowerCase().includes('rest')) {
      suggestions.push({
        type: 'certificate',
        message: 'Patient may need a medical certificate',
        action: 'Generate Certificate'
      });
    }
    
    // Check if lab work might be needed
    if (record.diagnosis?.toLowerCase().includes('blood') || 
        record.diagnosis?.toLowerCase().includes('test')) {
      suggestions.push({
        type: 'lab',
        message: 'Consider ordering relevant lab tests',
        action: 'Order Lab Work'
      });
    }
    
    return suggestions;
  };

  const handleAutomationAction = (action, record) => {
    switch (action) {
      case 'Schedule Follow-up':
        // Auto-create a follow-up record template
        setDialogMode('create');
        setCurrentRecord({
          patient: record.patient,
          visit_date: dayjs().add(2, 'week').format('YYYY-MM-DD'),
          record_type: record.record_type,
          chief_complaint: `Follow-up for: ${record.diagnosis}`,
          diagnosis: '',
          treatment: '',
          notes: `Follow-up appointment for previous diagnosis: ${record.diagnosis}`,
          vital_signs: {
            temperature: '',
            blood_pressure: '',
            heart_rate: '',
            respiratory_rate: '',
            oxygen_saturation: ''
          },
          medications: []
        });
        setOpenDialog(true);
        break;
      case 'Generate Certificate':
        window.open('/medical-certificates', '_blank');
        break;
      case 'Order Lab Work':
        alert('Lab work ordering system integration would be implemented here.');
        break;
      default:
        break;
    }
  };

  const handleGenerateReport = () => {
    // Generate comprehensive clinical report
    const reportData = {
      totalRecords: records.length,
      medicalRecords: records.filter(r => r.record_type === 'MEDICAL').length,
      dentalRecords: records.filter(r => r.record_type === 'DENTAL').length,
      recentRecords: records.filter(r => dayjs(r.visit_date).isAfter(dayjs().subtract(30, 'day'))).length,
      commonDiagnoses: getCommonDiagnoses(),
      patientStats: getPatientStatistics(),
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    
    // Create and download report
    downloadClinicalReport(reportData);
  };

  const getCommonDiagnoses = () => {
    const diagnoses = records.map(r => r.diagnosis).filter(Boolean);
    const diagnosisCount = {};
    diagnoses.forEach(d => {
      diagnosisCount[d] = (diagnosisCount[d] || 0) + 1;
    });
    return Object.entries(diagnosisCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([diagnosis, count]) => ({ diagnosis, count }));
  };

  const getPatientStatistics = () => {
    const uniquePatients = [...new Set(records.map(r => r.patient?.id).filter(Boolean))];
    return {
      totalPatients: uniquePatients.length,
      avgRecordsPerPatient: uniquePatients.length > 0 ? (records.length / uniquePatients.length).toFixed(1) : 0,
      patientsThisMonth: records.filter(r => 
        dayjs(r.visit_date).isAfter(dayjs().startOf('month'))
      ).map(r => r.patient?.id).filter((id, index, arr) => arr.indexOf(id) === index).length
    };
  };

  const downloadClinicalReport = (data) => {
    const reportContent = `
CLINICAL RECORDS REPORT
Generated: ${data.generatedAt}

=== SUMMARY STATISTICS ===
Total Records: ${data.totalRecords}
Medical Records: ${data.medicalRecords}
Dental Records: ${data.dentalRecords}
Records (Last 30 Days): ${data.recentRecords}

=== PATIENT STATISTICS ===
Total Patients: ${data.patientStats.totalPatients}
Average Records per Patient: ${data.patientStats.avgRecordsPerPatient}
New Patients This Month: ${data.patientStats.patientsThisMonth}

=== COMMON DIAGNOSES ===
${data.commonDiagnoses.map(d => `${d.diagnosis}: ${d.count} cases`).join('\n')}

=== DETAILED RECORDS ===
${filteredRecords.map(r => `
Date: ${r.visit_date}
Patient: ${r.patient_name || `Patient ID: ${r.patient}`}
Type: ${r.record_type}
Diagnosis: ${r.diagnosis || 'N/A'}
Treatment: ${r.treatment || 'N/A'}
`).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-report-${dayjs().format('YYYY-MM-DD')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenEditDialog = (record) => {
    setDialogMode('edit');
    setCurrentRecord({
      ...record,
      visit_date: record.visit_date,
      vital_signs: record.vital_signs || {
        temperature: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        oxygen_saturation: ''
      }
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRecord(null);
  };

  const handleSaveRecord = async () => {
    try {
      // Validate required fields
      if (dialogMode === 'create' && !currentRecord.patient) {
        alert('Please select a patient.');
        return;
      }

      if (!currentRecord.diagnosis.trim()) {
        alert('Please enter a diagnosis.');
        return;
      }

      if (dialogMode === 'create') {
        await healthRecordsService.create(currentRecord);
      } else {
        await healthRecordsService.update(currentRecord.id, currentRecord);
      }
      // Refresh list from server for authoritative state
      await fetchHealthRecords();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving health record:', error);
      if (error.response && error.response.data) {
        const errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
        alert(`Error saving record: ${errorMessage}`);
      } else {
        alert('An error occurred while saving the record.');
      }
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await healthRecordsService.delete(id);
        setRecords(records.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting health record:', error);
        alert('An error occurred while deleting the record.');
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentRecord({ ...currentRecord, [name]: value });
  };

  const handlePatientChange = (event, newValue) => {
    setCurrentRecord({ 
      ...currentRecord, 
      patient: newValue ? newValue.id : null 
    });
  };

  const handleVitalSignChange = (e) => {
    const { name, value } = e.target;
    setCurrentRecord({
      ...currentRecord,
      vital_signs: {
        ...(currentRecord.vital_signs || {}),
        [name]: value
      }
    });
  };

  // Filter records based on search term and selected date
  const filteredRecords = records.filter(record => {
    const searchMatch = 
      (record.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.patient_usc_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateMatch = selectedDate ? record.visit_date === dayjs(selectedDate).format('YYYY-MM-DD') : true;
    
    // Filter based on tab selection (0: All, 1: Analytics)
    const typeMatch = tabValue === 0 || tabValue === 1; // Both tabs show all records
    
    return searchMatch && dateMatch && typeMatch;
  });

  // Enhanced Export Functions
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No health records to export');
      return;
    }

    const exportData = filteredRecords.map(record => {
      const baseData = {
        'Record ID': record.id,
        'Record Type': record.record_type === 'MEDICAL' ? 'Medical' : 'Dental',
        'Visit Date': dayjs(record.visit_date).format('YYYY-MM-DD'),
        'Patient Name': record.patient_name || 'Unknown',
        'Patient ID': record.patient_id || 'N/A',
        'USC ID': record.patient_usc_id || 'N/A',
        'Clinical Diagnosis': record.diagnosis || 'No diagnosis',
        'Treatment': record.treatment || record.treatment_performed || 'No treatment',
        'Clinical Notes': record.notes || 'No additional notes',
        'Created Date': dayjs(record.created_at).format('YYYY-MM-DD HH:mm'),
        'Last Updated': dayjs(record.updated_at).format('YYYY-MM-DD HH:mm')
      };

      // Add medical-specific fields if it's a medical record
      if (record.record_type === 'MEDICAL' || record.chief_complaint) {
        return {
          ...baseData,
          'Chief Complaint': record.chief_complaint || 'Not specified',
          'Present Illness History': record.history_present_illness || 'Not documented',
          'Past Medical History': record.past_medical_history || 'None reported',
          'Physical Examination': record.physical_examination || 'Not performed',
          'Blood Pressure': record.blood_pressure || 'N/A',
          'Temperature (°C)': record.temperature || 'N/A',
          'Pulse Rate (bpm)': record.pulse_rate || 'N/A',
          'Respiratory Rate': record.respiratory_rate || 'N/A',
          'Medications': record.medications || 'None prescribed',
          'Laboratory Results': record.laboratory_results || 'None ordered',
          'Follow-up Instructions': record.follow_up_instructions || 'None specified',
          'Dental Procedure': 'N/A',
          'Tooth Number': 'N/A',
          'Priority Level': 'N/A',
          'Pain Level': 'N/A',
          'Cost': 'N/A',
          'Insurance Covered': 'N/A'
        };
      } 
      // Add dental-specific fields if it's a dental record
      else {
        return {
          ...baseData,
          'Chief Complaint': 'N/A',
          'Present Illness History': 'N/A',
          'Past Medical History': 'N/A',
          'Physical Examination': 'N/A',
          'Blood Pressure': 'N/A',
          'Temperature (°C)': 'N/A',
          'Pulse Rate (bpm)': 'N/A',
          'Respiratory Rate': 'N/A',
          'Medications': 'N/A',
          'Laboratory Results': 'N/A',
          'Follow-up Instructions': 'N/A',
          'Dental Procedure': record.procedure_performed_display || 'Not specified',
          'Tooth Number': record.tooth_number || 'N/A',
          'Priority Level': record.priority || 'N/A',
          'Pain Level': record.pain_level || 'N/A',
          'Cost': record.cost ? `₱${parseFloat(record.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A',
          'Insurance Covered': record.insurance_covered ? 'Yes' : 'No'
        };
      }
    });

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
    link.setAttribute('download', `health-records-${dayjs().format('YYYY-MM-DD-HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert('No health records to export');
      return;
    }

    const exportData = filteredRecords.map(record => {
      const baseData = {
        'ID': record.id,
        'Type': record.record_type === 'MEDICAL' ? 'Medical' : 'Dental',
        'Visit Date': record.visit_date,
        'Patient': record.patient_name || 'Unknown',
        'Patient ID': record.patient_id || '',
        'USC ID': record.patient_usc_id || '',
        'Diagnosis': record.diagnosis || '',
        'Treatment': record.treatment || record.treatment_performed || '',
        'Notes': record.notes || '',
        'Created': record.created_at,
        'Updated': record.updated_at
      };

      // Add type-specific fields
      if (record.record_type === 'MEDICAL' || record.chief_complaint) {
        return {
          ...baseData,
          'Chief Complaint': record.chief_complaint || '',
          'Present Illness': record.history_present_illness || '',
          'Medical History': record.past_medical_history || '',
          'Physical Exam': record.physical_examination || '',
          'Blood Pressure': record.blood_pressure || '',
          'Temperature': record.temperature || '',
          'Pulse Rate': record.pulse_rate || '',
          'Respiratory Rate': record.respiratory_rate || '',
          'Medications': record.medications || '',
          'Lab Results': record.laboratory_results || '',
          'Follow-up': record.follow_up_instructions || '',
          'Procedure': '',
          'Tooth Number': '',
          'Priority': '',
          'Pain Level': '',
          'Cost': '',
          'Insurance': ''
        };
      } else {
        return {
          ...baseData,
          'Chief Complaint': '',
          'Present Illness': '',
          'Medical History': '',
          'Physical Exam': '',
          'Blood Pressure': '',
          'Temperature': '',
          'Pulse Rate': '',
          'Respiratory Rate': '',
          'Medications': '',
          'Lab Results': '',
          'Follow-up': '',
          'Procedure': record.procedure_performed_display || '',
          'Tooth Number': record.tooth_number || '',
          'Priority': record.priority || '',
          'Pain Level': record.pain_level || '',
          'Cost': record.cost || '',
          'Insurance': record.insurance_covered ? 'Covered' : 'Not Covered'
        };
      }
    });

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
    link.setAttribute('download', `health-records-${dayjs().format('YYYY-MM-DD-HHmm')}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    if (filteredRecords.length === 0) {
      alert('No health records to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>USC-PIS Health Records Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1976d2; padding-bottom: 20px; }
            .header h1 { color: #1976d2; margin: 10px 0; font-size: 24px; }
            .header h2 { color: #1976d2; margin: 5px 0; font-size: 20px; }
            .header p { margin: 5px 0; color: #666; }
            .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .record { border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 5px; page-break-inside: avoid; }
            .record-header { background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 100%); padding: 10px; margin: -15px -15px 15px -15px; border-radius: 5px 5px 0 0; }
            .record-type { display: inline-block; background: #2e7d32; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin-right: 10px; }
            .record-title { font-weight: bold; color: #2e7d32; font-size: 16px; margin-top: 5px; }
            .record-meta { color: #666; font-size: 14px; margin-top: 5px; }
            .record-body { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
            .field-group { margin-bottom: 15px; }
            .field-group h4 { color: #2e7d32; margin-bottom: 8px; font-size: 14px; border-bottom: 1px solid #e0e0e0; padding-bottom: 3px; }
            .field { margin-bottom: 6px; }
            .field-label { font-weight: bold; color: #333; display: inline-block; min-width: 120px; }
            .field-value { color: #666; }
            .vitals { background: #f0f8f0; padding: 10px; border-radius: 3px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; color: #666; }
            @media print { body { margin: 0; } .no-print { display: none; } .record { page-break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>University of Southern California</h1>
            <h2>Patient Information System</h2>
            <h2>Comprehensive Health Records Report</h2>
            <p>Generated on: ${dayjs().format('MMMM DD, YYYY [at] HH:mm')}</p>
            <p>Total Records: ${filteredRecords.length}</p>
          </div>
          
          <div class="summary">
            <h3>Report Summary</h3>
            <p><strong>Total Records:</strong> ${filteredRecords.length}</p>
            <p><strong>Medical Records:</strong> ${filteredRecords.filter(r => r.record_type === 'MEDICAL' || r.chief_complaint).length}</p>
            <p><strong>Dental Records:</strong> ${filteredRecords.filter(r => r.record_type === 'DENTAL' || r.procedure_performed_display).length}</p>
            <p><strong>Date Filter:</strong> ${selectedDate ? dayjs(selectedDate).format('MMMM DD, YYYY') : 'All dates'}</p>
            <p><strong>Search Term:</strong> ${searchTerm || 'None'}</p>
            <p><strong>Report Type:</strong> Combined Medical & Dental Health Records</p>
          </div>
          
          ${filteredRecords.map(record => {
            const isMedical = record.record_type === 'MEDICAL' || record.chief_complaint;
            return `
            <div class="record">
              <div class="record-header">
                <span class="record-type">${isMedical ? 'MEDICAL' : 'DENTAL'}</span>
                <div class="record-title">${record.patient_name || 'Unknown Patient'}</div>
                <div class="record-meta">
                  Record #${record.id} | Visit: ${dayjs(record.visit_date).format('MMM DD, YYYY')} | 
                  USC ID: ${record.patient_usc_id || 'N/A'}
                </div>
              </div>
              <div class="record-body">
                <div>
                  ${isMedical ? `
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
                        <span class="field-value">${record.procedure_performed_display || 'Not specified'}</span>
                      </div>
                      <div class="field">
                        <span class="field-label">Tooth Number:</span>
                        <span class="field-value">${record.tooth_number || 'N/A'}</span>
                      </div>
                      <div class="field">
                        <span class="field-label">Priority Level:</span>
                        <span class="field-value">${record.priority || 'N/A'}</span>
                      </div>
                      <div class="field">
                        <span class="field-label">Pain Level:</span>
                        <span class="field-value">${record.pain_level || 'N/A'}/10</span>
                      </div>
                      <div class="field">
                        <span class="field-label">Cost:</span>
                        <span class="field-value">${record.cost ? '₱' + parseFloat(record.cost).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}</span>
                      </div>
                      <div class="field">
                        <span class="field-label">Insurance:</span>
                        <span class="field-value">${record.insurance_covered ? 'Covered' : 'Not Covered'}</span>
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
                    ${isMedical ? `
                      <div class="field">
                        <span class="field-label">Medications:</span>
                        <span class="field-value">${record.medications || 'None prescribed'}</span>
                      </div>
                      <div class="field">
                        <span class="field-label">Lab Results:</span>
                        <span class="field-value">${record.laboratory_results || 'None ordered'}</span>
                      </div>
                      <div class="field">
                        <span class="field-label">Follow-up:</span>
                        <span class="field-value">${record.follow_up_instructions || 'None specified'}</span>
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Health Records
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.filter(r => r.record_type === 'MEDICAL').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Medical Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {records.filter(r => r.record_type === 'DENTAL').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dental Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
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
      </Grid>

      {/* Integration Quick Actions */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions & Integration
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<TimelineIcon />}
              onClick={() => window.open('/medical-records', '_blank')}
              size="small"
              sx={{ 
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5a6fd8',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                }
              }}
            >
              View Medical History
            </Button>
            <Button
              variant="outlined"
              startIcon={<HealingIcon />}
              onClick={() => window.open('/dental-records', '_blank')}
              size="small"
              sx={{ 
                borderColor: '#764ba2',
                color: '#764ba2',
                '&:hover': {
                  borderColor: '#6a4190',
                  backgroundColor: 'rgba(118, 75, 162, 0.1)',
                }
              }}
            >
              Manage Dental Records
            </Button>
            <Button
              variant="outlined"
              startIcon={<CertificateIcon />}
              onClick={() => window.open('/medical-certificates', '_blank')}
              size="small"
            >
              Medical Certificates
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={() => window.open('/reports', '_blank')}
              size="small"
            >
              Generate Reports
            </Button>
            <Button
              variant="outlined"
              startIcon={<LaunchIcon />}
              onClick={() => window.open('/patient-dashboard', '_blank')}
              size="small"
            >
              Patient Dashboard
            </Button>
            
            {/* Export Actions */}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CsvIcon />}
                onClick={handleExportCSV}
                disabled={filteredRecords.length === 0}
                size="small"
                sx={{ borderColor: '#2e7d32', color: '#2e7d32', '&:hover': { borderColor: '#1b5e20', bgcolor: '#f1f8e9' } }}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={handleExportExcel}
                disabled={filteredRecords.length === 0}
                size="small"
                sx={{ borderColor: '#0d7c34', color: '#0d7c34', '&:hover': { borderColor: '#0d7c34', bgcolor: '#f0f9f0' } }}
              >
                Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintReport}
                disabled={filteredRecords.length === 0}
                size="small"
                sx={{ borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { borderColor: '#d32f2f', bgcolor: '#fff0f0' } }}
              >
                Print
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Filters and actions */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
          sx={{ flexGrow: 1, maxWidth: 300 }}
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

        {canEditRecords && (
          <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={() => handleGenerateReport()}
              sx={{ 
                borderColor: '#f093fb',
                color: '#f093fb',
                '&:hover': {
                  borderColor: '#e070f0',
                  backgroundColor: 'rgba(240, 147, 251, 0.1)',
                }
              }}
            >
              Generate Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<TemplateIcon />}
              onClick={() => setOpenTemplateDialog(true)}
              sx={{ 
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5a6fd8',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                }
              }}
            >
              Use Template
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{ 
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                }
              }}
            >
              New Clinical Record
            </Button>
          </Box>
        )}
      </Box>

      {/* Tabs for record types */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="clinical record tabs">
          <Tab label="All Clinical Records" id="clinical-record-tab-0" />
          <Tab label="Analytics" id="clinical-record-tab-1" icon={<ReportIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Records Table or Analytics */}
      {loading ? (
        <Typography>Loading records...</Typography>
      ) : tabValue === 1 ? (
        <Box sx={{ mt: 2 }}>
          <ClinicalAnalytics records={records} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>ID Number</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Treatment</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.visit_date}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {record.patient_name || `Patient ID: ${record.patient}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.patient_usc_id || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.record_type || 'MEDICAL'} 
                        color={record.record_type === 'MEDICAL' ? 'primary' : 'secondary'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{record.diagnosis || 'No diagnosis'}</TableCell>
                    <TableCell>{record.treatment || 'No treatment'}</TableCell>
                    <TableCell align="right">
                      {/* Workflow Automation Suggestions */}
                      {canEditRecords && (() => {
                        const suggestions = getFollowUpSuggestions(record);
                        return suggestions.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, alignItems: 'center' }}>
                            <Tooltip title="Appears when diagnosis contains 'sick' or treatment includes 'rest'">
                              <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                            </Tooltip>
                            {suggestions.map((suggestion, index) => (
                              <Chip
                                key={index}
                                label={suggestion.action}
                                size="small"
                                color={suggestion.type === 'follow-up' ? 'primary' : 
                                       suggestion.type === 'certificate' ? 'secondary' : 'default'}
                                onClick={() => handleAutomationAction(suggestion.action, record)}
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 20,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.8
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        );
                      })()}
                      
                      {/* Regular Action Buttons */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {record.record_type === 'MEDICAL' && (
                          <Button size="small" onClick={() => { setSelectedMedicalRecordId(record.id); setOpenMedicalRecordModal(true); }}>
                            View
                          </Button>
                        )}
                        <IconButton onClick={() => handleOpenEditDialog(record)} disabled={!canEditRecords}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteRecord(record.id)} disabled={!canEditRecords}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create Clinical Record' : 'Edit Clinical Record'}
        </DialogTitle>
        <DialogContent dividers>
          {currentRecord && (
            <Grid container spacing={2}>
              {dialogMode === 'create' && (
                <Grid item xs={12}>
                  <Autocomplete
                    options={patients}
                    getOptionLabel={(option) => {
                      const name = `${option.first_name} ${option.last_name}`;
                      const id = option.usc_id || option.id_number || option.student_id;
                      return `${name}${id ? ` (${id})` : ''}`;
                    }}
                    value={patients.find(p => p.id === currentRecord.patient) || null}
                    onChange={handlePatientChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Patient"
                        required
                        margin="normal"
                        helperText="Search by name or USC ID"
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                          {option.first_name?.[0]}{option.last_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {option.first_name} {option.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            USC ID: {option.usc_id || option.id_number || option.student_id || 'Not Available'}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option => {
                        const name = `${option.first_name || ''} ${option.last_name || ''}`.toLowerCase();
                        const email = (option.email || '').toLowerCase();
                        const uscId = (option.usc_id || option.id_number || option.student_id || '').toLowerCase();
                        const search = inputValue.toLowerCase();
                        return name.includes(search) || email.includes(search) || uscId.includes(search);
                      });
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                  />
                </Grid>
              )}
              {dialogMode === 'edit' && currentRecord.patient && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Patient"
                    value={`${currentRecord.patient.first_name || ''} ${currentRecord.patient.last_name || ''} ${(currentRecord.patient.usc_id || currentRecord.patient.id_number || currentRecord.patient.student_id) ? `(${currentRecord.patient.usc_id || currentRecord.patient.id_number || currentRecord.patient.student_id})` : ''}`}
                    disabled
                    margin="normal"
                    helperText="Patient cannot be changed when editing records"
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Visit Date"
                    value={dayjs(currentRecord.visit_date)}
                    onChange={(date) => setCurrentRecord({
                      ...currentRecord,
                      visit_date: dayjs(date).format('YYYY-MM-DD')
                    })}
                    slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Record Type</InputLabel>
                  <Select
                    name="record_type"
                    value={currentRecord.record_type}
                    onChange={handleInputChange}
                    label="Record Type"
                  >
                    <MenuItem value="MEDICAL">Medical</MenuItem>
                    <MenuItem value="DENTAL">Dental</MenuItem>
                  </Select>
                  <FormHelperText>
                    Choose Medical for general clinical visits; Dental for dental procedures.
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chief Complaint"
                  name="chief_complaint"
                  value={currentRecord.chief_complaint}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Diagnosis"
                  name="diagnosis"
                  value={currentRecord.diagnosis}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Treatment"
                  name="treatment"
                  value={currentRecord.treatment}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Vital Signs
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Temperature (°C)"
                  name="temperature"
                  value={currentRecord.vital_signs?.temperature || ''}
                  onChange={handleVitalSignChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Blood Pressure (mmHg)"
                  name="blood_pressure"
                  value={currentRecord.vital_signs?.blood_pressure || ''}
                  onChange={handleVitalSignChange}
                  margin="normal"
                  placeholder="e.g. 120/80"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Heart Rate (bpm)"
                  name="heart_rate"
                  value={currentRecord.vital_signs?.heart_rate || ''}
                  onChange={handleVitalSignChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Respiratory Rate (breaths/min)"
                  name="respiratory_rate"
                  value={currentRecord.vital_signs?.respiratory_rate || ''}
                  onChange={handleVitalSignChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Oxygen Saturation (%)"
                  name="oxygen_saturation"
                  value={currentRecord.vital_signs?.oxygen_saturation || ''}
                  onChange={handleVitalSignChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={currentRecord.notes}
                  onChange={handleInputChange}
                  margin="normal"
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveRecord} 
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Medical Record View Modal */}
      <Dialog open={openMedicalRecordModal} onClose={() => setOpenMedicalRecordModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Medical Record</DialogTitle>
        <DialogContent dividers>
          <MedicalRecord medicalRecordId={selectedMedicalRecordId} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMedicalRecordModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Clinical Templates Dialog */}
      <Dialog open={openTemplateDialog} onClose={handleCloseTemplateDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TemplateIcon sx={{ color: '#667eea' }} />
            Clinical Record Templates
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a template to quickly create a clinical record with pre-filled information.
          </Typography>
          <Grid container spacing={2}>
            {clinicalTemplates.map((template, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.3s ease',
                    border: `2px solid ${template.category === 'DENTAL' ? '#f093fb20' : '#667eea20'}`,
                    '&:hover': { 
                      boxShadow: 6, 
                      transform: 'translateY(-2px)',
                      borderColor: template.category === 'DENTAL' ? '#f093fb' : '#667eea'
                    } 
                  }}
                  onClick={() => handleUseTemplate(template)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {template.name}
                      </Typography>
                      <Chip 
                        label={template.category} 
                        color={template.category === 'DENTAL' ? 'secondary' : 'primary'} 
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Chief Complaint:</strong> {template.chief_complaint}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Diagnosis:</strong> {template.diagnosis}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Treatment:</strong> {template.treatment.substring(0, 60)}...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HealthRecords; 
