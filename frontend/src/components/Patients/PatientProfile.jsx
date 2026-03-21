import React, { useEffect, useState, useMemo } from "react";
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from "@mui/material";
import { 
  Person, 
  LocalHospital, 
  Favorite, 
  Warning, 
  Phone, 
  Email, 
  Home,
  ArrowBack,
  History,
  Description,
  Close as CloseIcon
} from "@mui/icons-material";
import { 
  getSexLabel, 
  getCourseLabel, 
  getYearLevelLabel,
  calculateAge,
  convertStringToArray 
} from '../../utils/fieldMappers';
import { healthRecordsService, consultationService, dentalRecordService, patientService } from '../../services/api';

// Visual assets (reusing from dashboard)
// ... (imports remain the same)
import BMI_male_1 from "../../assets/images/BMI_Visual/BMI_male_1.png";
import BMI_male_2 from "../../assets/images/BMI_Visual/BMI_male_2.png";
import BMI_male_3 from "../../assets/images/BMI_Visual/BMI_male_3.png";
import BMI_male_4 from "../../assets/images/BMI_Visual/BMI_male_4.png";
import BMI_male_5 from "../../assets/images/BMI_Visual/BMI_male_5.png";
import BMI_female_1 from "../../assets/images/BMI_Visual/BMI_female_1.png";
import BMI_female_2 from "../../assets/images/BMI_Visual/BMI_female_2.png";
import BMI_female_3 from "../../assets/images/BMI_Visual/BMI_female_3.png";
import BMI_female_4 from "../../assets/images/BMI_Visual/BMI_female_4.png";
import BMI_female_5 from "../../assets/images/BMI_Visual/BMI_female_5.png";
import InfoTooltip from '../utils/InfoTooltip';

const PatientProfile = ({ patient: partialPatient, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(partialPatient);
  const [history, setHistory] = useState([]);
  const [latestVitalSigns, setLatestVitalSigns] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPatientFullData = async () => {
      if (!partialPatient?.id) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch full patient details first
        const patientResp = await patientService.getById(partialPatient.id);
        if (patientResp?.data) {
          setPatient(patientResp.data);
        }

        // Fetch all related history
        const [medicalResp, consultationResp, dentalResp] = await Promise.all([
          healthRecordsService.getByPatient(partialPatient.id).catch(() => ({ data: [] })),
          consultationService.getAll().catch(() => ({ data: [] })),
          dentalRecordService.getAll({ patient: partialPatient.id }).catch(() => ({ data: [] }))
        ]);
        
        // Merge and tag records
        const medical = (medicalResp?.data || []).map(r => ({ ...r, type: 'Medical', date: r.visit_date }));
        
        // Filter consultations for this patient
        const consultations = (consultationResp?.data || [])
          .filter(r => r.patient === partialPatient.id)
          .map(r => ({ ...r, type: 'Consultation', date: r.date_time }));
          
        const dental = (dentalResp?.data || [])
          .map(r => ({ ...r, type: 'Dental', date: r.visit_date }));

        const allHistory = [...medical, ...consultations, ...dental].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        setHistory(allHistory);
        
        // Find latest vitals from medical records
        const recordsWithVitalSigns = medical
          .filter(r => r.vital_signs && Object.keys(r.vital_signs).length > 0)
          .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
        
        if (recordsWithVitalSigns.length > 0) {
          setLatestVitalSigns(recordsWithVitalSigns[0].vital_signs);
        }
      } catch (err) {
        console.error('Error fetching patient profile data:', err);
        const errorMsg = err.response?.data?.detail || err.message || 'Failed to load full patient profile';
        setError(`${errorMsg} (Status: ${err.response?.status || 'Unknown'})`);
        // If we have partial data, don't block the UI entirely
      } finally {
        setLoading(false);
      }
    };

    fetchPatientFullData();
  }, [partialPatient.id]);

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedRecord(null);
  };

  const getRecordSummary = (record) => {
    if (record.type === 'Medical') return record.diagnosis || record.reason_for_visit || 'N/A';
    if (record.type === 'Consultation') return record.chief_complaints || 'N/A';
    if (record.type === 'Dental') return record.procedure_performed_display || record.diagnosis || 'N/A';
    return 'N/A';
  };

  if (loading && !patient) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !patient) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={onBack} sx={{ mb: 2 }}>Back to List</Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const userAge = calculateAge(patient?.date_of_birth || patient?.birthday);
  const userBMI = calculateBMI(patient?.weight, patient?.height);
  const bmiInfo = getBMIInfo(userBMI, patient?.gender || patient?.sex);

  const illnesses = convertStringToArray(patient?.illness);
  const allergies = convertStringToArray(patient?.allergies);
  const medications = convertStringToArray(patient?.medications);
  const childhoodDiseases = convertStringToArray(patient?.childhood_diseases);
  const specialNeeds = convertStringToArray(patient?.special_needs);
  const existingConditions = convertStringToArray(patient?.existing_medical_condition);

  return (
    <Box sx={{ py: 2 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header with Back Button */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Tooltip title="Back to Patient List">
          <IconButton onClick={onBack} sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocalHospital sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Patient Medical Profile
            </Typography>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
              {patient.first_name} {patient.last_name} | {patient.usc_id || 'No ID'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person color="primary" />
                Patient Details
              </Typography>
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Avatar
                  src={patient.profile_picture}
                  sx={{ width: 100, height: 100, mx: 'auto', border: '3px solid #e0e0e0' }}
                >
                  {patient.first_name?.[0]}
                </Avatar>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {patient.first_name} {patient.last_name}
                </Typography>
                <Chip label={getSexLabel(patient.gender || patient.sex)} size="small" sx={{ mt: 1 }} />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Age:</Typography>
                  <Typography variant="body2">{userAge || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Course:</Typography>
                  <Typography variant="body2">{getCourseLabel(patient.course)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Email:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{patient.email || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Phone:</Typography>
                  <Typography variant="body2">{patient.phone_number || 'N/A'}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Favorite color="primary" />
                BMI & Vitals
              </Typography>
              {bmiInfo.image && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <img src={bmiInfo.image} alt={bmiInfo.category} style={{ height: "120px" }} />
                </Box>
              )}
              <Chip
                label={bmiInfo.category}
                sx={{ width: '100%', backgroundColor: bmiInfo.color, color: 'white', fontWeight: 'bold', mb: 2 }}
              />
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">BP</Typography>
                  <Typography variant="body2">{formatVitalSign(latestVitalSigns.blood_pressure, 'mmHg')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Temp</Typography>
                  <Typography variant="body2">{formatVitalSign(latestVitalSigns.temperature, '°C')}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History color="primary" />
                Unified Medical History
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Summary</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.length > 0 ? (
                      history.map((record, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={record.type} 
                              size="small" 
                              color={record.type === 'Medical' ? 'primary' : record.type === 'Dental' ? 'secondary' : 'info'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {getRecordSummary(record)}
                          </TableCell>
                          <TableCell align="right">
                            <Button 
                              size="small" 
                              variant="text"
                              startIcon={<Description />}
                              onClick={() => handleViewRecord(record)}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>No medical history found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="primary" />
                Medical Alerts
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="error" fontWeight="bold">Allergies</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {allergies.length > 0 ? allergies.map((a, i) => <Chip key={i} label={a} size="small" color="error" variant="outlined" />) : <Typography variant="body2" color="text.secondary">None recorded</Typography>}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="warning.main" fontWeight="bold">Medications</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {medications.length > 0 ? medications.map((m, i) => <Chip key={i} label={m} size="small" color="warning" variant="outlined" />) : <Typography variant="body2" color="text.secondary">None recorded</Typography>}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Record Detail Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        {selectedRecord && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedRecord.type} Record Detail</Typography>
              <IconButton onClick={closeDialog} size="small" sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Visit Date</Typography>
                  <Typography variant="body1">{new Date(selectedRecord.date).toLocaleString()}</Typography>
                </Box>
                
                {selectedRecord.type === 'Medical' && (
                  <>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Diagnosis</Typography>
                      <Typography variant="body1">{selectedRecord.diagnosis || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Treatment</Typography>
                      <Typography variant="body1">{selectedRecord.treatment || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Notes</Typography>
                      <Typography variant="body1">{selectedRecord.notes || 'N/A'}</Typography>
                    </Box>
                  </>
                )}

                {selectedRecord.type === 'Consultation' && (
                  <>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Chief Complaints</Typography>
                      <Typography variant="body1">{selectedRecord.chief_complaints || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Treatment Plan</Typography>
                      <Typography variant="body1">{selectedRecord.treatment_plan || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Remarks</Typography>
                      <Typography variant="body1">{selectedRecord.remarks || 'N/A'}</Typography>
                    </Box>
                  </>
                )}

                {selectedRecord.type === 'Dental' && (
                  <>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Procedure</Typography>
                      <Typography variant="body1">{selectedRecord.procedure_performed_display || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Diagnosis</Typography>
                      <Typography variant="body1">{selectedRecord.diagnosis || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Treatment Performed</Typography>
                      <Typography variant="body1">{selectedRecord.treatment_performed || 'N/A'}</Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PatientProfile;
