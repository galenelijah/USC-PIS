import React, { useEffect, useState } from "react";
import { Typography, Box, TextField, Grid, Paper, Button, CircularProgress, Alert, Autocomplete, Divider, InputAdornment, Avatar, Chip, Stack } from "@mui/material";
import { 
    Search as SearchIcon, 
    Clear as ClearIcon, 
    Person as PersonIcon,
    Favorite as FavoriteIcon,
    MedicalServices as MedicalServicesIcon,
    Assignment as AssignmentIcon,
    GetApp as DownloadIcon,
} from "@mui/icons-material";
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { medicalRecordSchema } from '../utils/validationSchemas';
import BMI_male_1 from "../assets/images/BMI_Visual/BMI_male_1.png";
import BMI_male_2 from "../assets/images/BMI_Visual/BMI_male_2.png";
import BMI_male_3 from "../assets/images/BMI_Visual/BMI_male_3.png";
import BMI_male_4 from "../assets/images/BMI_Visual/BMI_male_4.png";
import BMI_male_5 from "../assets/images/BMI_Visual/BMI_male_5.png";
import BMI_female_1 from "../assets/images/BMI_Visual/BMI_female_1.png";
import BMI_female_2 from "../assets/images/BMI_Visual/BMI_female_2.png";
import BMI_female_3 from "../assets/images/BMI_Visual/BMI_female_3.png";
import BMI_female_4 from "../assets/images/BMI_Visual/BMI_female_4.png";
import BMI_female_5 from "../assets/images/BMI_Visual/BMI_female_5.png";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import ReadOnlyTextField from "./forms/ReadOnlyTextField";
import { healthRecordsService, patientService, patientDocumentService } from '../services/api';
import { useSelector } from 'react-redux';
import { extractErrorMessage, extractFieldErrors } from '../utils/errorUtils';
import { formatDateForInput } from '../utils/dateUtils';
import PatientDocumentUpload from './PatientDocumentUpload';
import { 
    Description as FileIcon, 
    CloudUpload as UploadIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

const defaultUserData = {
    height: "",
    weight: "",
    bmi: "",
    sex: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    profile_picture: "",
    age: "",
    address_permanent: "",
    address_present: "",
    contact_number: "",
    email: "",
    birthday: "",
    id_number: "",
    program: "",
    year_level: "",
    civil_status: "",
    religion: "",
    illnesses: [],
    allergies: [],
    existing_medical_condition: [],
    surgical_procedures: [],
    hospitalization_history: [],
    childhood_diseases: [],
    special_needs: [],
    medications: [],
};

// Schema imported from validationSchemas.js

const MedicalRecord = ({ medicalRecordId, readOnly = false, onSuccess = null }) => {
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    // Attachments state
    const [attachments, setAttachments] = useState([]);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);

    const handleDownloadDocument = async (doc) => {
        try {
            const response = await patientDocumentService.downloadDocument(doc.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = doc.original_filename || `document_${doc.id}`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Failed to download document. Please try again.');
        }
    };

    const handleDeleteAttachment = async (id) => {
        if (!window.confirm("Are you sure you want to delete this attachment? This action cannot be undone.")) {
            return;
        }

        try {
            setLoading(true);
            await patientDocumentService.deleteDocument(id);
            await fetchAttachments();
        } catch (err) {
            console.error("Error deleting attachment:", err);
            alert("Failed to delete attachment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const user = useSelector(state => state.auth.user);
    const isStaffOrMedical = user?.role && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'].includes(user.role);
    
    // Can edit if they are staff/medical AND NOT in readOnly mode
    const canEdit = isStaffOrMedical && !readOnly;
    
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [filteredPatients, setFilteredPatients] = useState([]);

    const { handleSubmit, control, formState: { errors }, setValue, watch, reset, setError: setFieldError } = useForm({
        resolver: yupResolver(medicalRecordSchema),
        defaultValues: {
            patient: '',
            visit_date: dayjs().format(),
            concern: '',
            diagnosis: '',
            treatment: '',
            notes: '',
            vital_signs: {
                temperature: '',
                blood_pressure: '',
                pulse_rate: '',
                respiratory_rate: '',
                height: '',
                weight: '',
                bmi: ''
            },
            physical_examination: {
                general_appearance: '',
                skin: '',
                heent: '',
                heart: '',
                lungs: '',
                abdomen: '',
                extremities: '',
                neurological: ''
            }
        }
    });

    const watchedVitalSigns = watch('vital_signs');

    // Fetch patients for staff/medical users
    useEffect(() => {
        if (isStaffOrMedical && !medicalRecordId) {
            patientService.getAll().then(res => {
                const patientsData = res.data || [];
                setPatients(patientsData);
                setFilteredPatients(patientsData);
            }).catch(err => {
                console.error('Error fetching patients:', err);
            });
        }
    }, [isStaffOrMedical, medicalRecordId]);

    // Filter patients based on search term
    useEffect(() => {
        if (!patientSearchTerm) {
            setFilteredPatients(patients);
        } else {
            const searchLower = patientSearchTerm.toLowerCase();
            const filtered = patients.filter(patient => 
                patient.first_name?.toLowerCase().includes(searchLower) ||
                patient.last_name?.toLowerCase().includes(searchLower) ||
                patient.email?.toLowerCase().includes(searchLower) ||
                patient.usc_id?.toLowerCase().includes(searchLower) ||
                patient.id_number?.toLowerCase().includes(searchLower) ||
                `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchLower)
            );
            setFilteredPatients(filtered);
        }
    }, [patientSearchTerm, patients]);

    useEffect(() => {
        if (medicalRecordId) {
            fetchRecord();
            fetchAttachments();
        } else {
            resetForm();
            setAttachments([]);
        }
    }, [medicalRecordId]);

    const fetchAttachments = async () => {
        if (!medicalRecordId) return;
        try {
            const res = await patientDocumentService.getAllDocuments({ medical_record: medicalRecordId });
            const data = res.data?.results || res.data || [];
            setAttachments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching attachments:', err);
            setAttachments([]);
        }
    };

    const resetForm = () => {
        reset({
            patient: '',
            visit_date: dayjs().format(),
            concern: '',
            diagnosis: '',
            treatment: '',
            notes: '',
            vital_signs: {
                temperature: '',
                blood_pressure: '',
                pulse_rate: '',
                respiratory_rate: '',
                height: '',
                weight: '',
                bmi: ''
            },
            physical_examination: {
                general_appearance: '',
                skin: '',
                heent: '',
                heart: '',
                lungs: '',
                abdomen: '',
                extremities: '',
                neurological: ''
            }
        });
        setSelectedPatient(null);
    };

    const fetchRecord = async () => {
        setLoading(true);
        setGlobalError(null);
        try {
            const response = await healthRecordsService.getById(medicalRecordId);
            const data = response.data;

            // Ensure vital_signs and physical_examination exist with defensive checks
            const safeData = {
                ...data,
                // visit_date will be handled as ISO string by DateTimePicker
                vital_signs: data.vital_signs || {
                    temperature: '',
                    blood_pressure: '',
                    pulse_rate: '',
                    respiratory_rate: '',
                    height: '',
                    weight: '',
                    bmi: ''
                },
                physical_examination: data.physical_examination || {
                    general_appearance: '',
                    skin: '',
                    heent: '',
                    heart: '',
                    lungs: '',
                    abdomen: '',
                    extremities: '',
                    neurological: ''
                }
            };

            // Reset form with fetched data
            reset(safeData);

            // Find and set the selected patient for display
            if (data.patient) {
                // If patient object is nested in data (some APIs do this)
                if (typeof data.patient === 'object') {
                    setSelectedPatient(data.patient);
                } else if (patients.length > 0) {
                    const patient = patients.find(p => p.id === data.patient);
                    setSelectedPatient(patient);
                } else {
                    // Fetch patient specifically if not in list
                    try {
                        const patientRes = await patientService.getById(data.patient);
                        setSelectedPatient(patientRes.data);
                    } catch (e) {
                        console.error("Could not fetch patient details", e);
                    }
                }
            }
        } catch (err) {
            setGlobalError('Failed to load medical record.');
            console.error('Error fetching record:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePatientChange = (event, value) => {
        setSelectedPatient(value);
        setValue('patient', value ? value.id : '', { shouldValidate: true });
        setPatientSearchTerm(''); // Clear search when patient is selected
    };

    const clearPatientSearch = () => {
        setPatientSearchTerm('');
        setFilteredPatients(patients);
    };

    const onSubmit = async (data) => {
        if (!canEdit) return;

        setLoading(true);
        setGlobalError(null);
        setSuccess(false);

        try {
            // Keep the local format with offset
            const payload = { 
                ...data,
                visit_date: dayjs(data.visit_date).format(),
                vital_signs: data.vital_signs || {},
                physical_examination: data.physical_examination || {}
            };

            if (medicalRecordId) {
                await healthRecordsService.update(medicalRecordId, payload);
                setSuccess('Medical record updated successfully!');
            } else {
                await healthRecordsService.create(payload);
                setSuccess('Medical record created successfully!');
            }

            if (onSuccess) {
                setTimeout(() => onSuccess(), 2000);
            } else if (!medicalRecordId) {
                setTimeout(() => {
                    resetForm();
                    setSuccess(false);
                }, 3000);
            } else {
                fetchAttachments();
            }
        } catch (err) {            console.error('Error saving record:', err);
            
            // Map field-specific errors if available for real-time form feedback
            const fieldErrors = extractFieldErrors(err);
            if (Object.keys(fieldErrors).length > 0) {
                Object.keys(fieldErrors).forEach(field => {
                    setFieldError(field, { type: 'server', message: fieldErrors[field] });
                });
            }

            // Always display the most descriptive exact error message at the top
            setGlobalError(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    // Function to determine BMI category and corresponding image
    const getBMIInfo = (bmi, sex) => {
        if (!bmi || isNaN(bmi)) return { category: "Not specified", image: null };
        const numericBMI = parseFloat(bmi);
        const isMale = sex?.toLowerCase() === "male" || sex?.toLowerCase() === "m";
        if (numericBMI < 18.5)
            return { category: "Underweight", image: isMale ? BMI_male_1 : BMI_female_1 };
        if (numericBMI >= 18.5 && numericBMI <= 24.9)
            return { category: "Healthy Weight", image: isMale ? BMI_male_2 : BMI_female_2 };
        if (numericBMI >= 25 && numericBMI <= 29.9)
            return { category: "Overweight", image: isMale ? BMI_male_3 : BMI_female_3 };
        if (numericBMI >= 30 && numericBMI <= 34.9)
            return { category: "Obesity", image: isMale ? BMI_male_4 : BMI_female_4 };
        if (numericBMI >= 35)
            return { category: "Severe Obesity", image: isMale ? BMI_male_5 : BMI_female_5 };
        return { category: "Not specified", image: null };
    };
    const bmiInfo = getBMIInfo(watchedVitalSigns?.bmi, watchedVitalSigns?.sex);

    if (loading && medicalRecordId) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
            </Box>
        );
    }

    const currentPatientId = watch('patient');

    // Helper to render field based on mode
    const DisplayField = ({ label, value, multiline = false, rows = 1 }) => {
        if (readOnly) {
            return (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {label}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                        whiteSpace: multiline ? 'pre-wrap' : 'normal',
                        bgcolor: 'rgba(0,0,0,0.02)',
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid rgba(0,0,0,0.05)',
                        minHeight: multiline ? (rows * 24) : 'auto'
                    }}>
                        {value || 'Not specified'}
                    </Typography>
                </Box>
            );
        }
        return null;
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1200, mx: 'auto' }}>
            {globalError && <Alert severity="error" sx={{ mb: 2 }}>{globalError}</Alert>}
            {Object.keys(errors).length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Please fix the following errors:</Typography>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {Object.entries(errors).map(([key, error]) => (
                            <li key={key}>
                                {error.message || (typeof error === 'object' && Object.values(error).map(e => e.message).join(', '))}
                            </li>
                        ))}
                    </ul>
                </Alert>
            )}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Grid container spacing={3}>
                {/* Patient Selection Section */}
                <Grid item xs={12}>
                    <Paper sx={{ 
                        p: 3, 
                        mb: 2, 
                        borderLeft: `5px solid #1976d2`,
                        boxShadow: 3
                    }}>
                        <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon /> Patient Information
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={2}>
                            {canEdit && !medicalRecordId && (
                                <Grid item xs={12}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                            Patient Search & Selection
                                        </Typography>
                                        
                                        <Autocomplete
                                            options={patients}
                                            getOptionLabel={(option) => {
                                                const name = `${option.first_name || ''} ${option.last_name || ''}`.trim();
                                                const id = option.usc_id || option.id_number || option.student_id;
                                                return `${name}${id ? ` (${id})` : ''}`;
                                            }}
                                            value={patients.find(p => p.id === watch('patient')) || null}
                                            onChange={(event, newValue) => handlePatientChange(event, newValue)}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Select Patient"
                                                    required
                                                    error={!!errors.patient}
                                                    helperText={errors.patient?.message || "Search by name or USC ID"}
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
                                                            {option.usc_id || option.id_number || option.student_id || 'No ID'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                                            filterOptions={(options, { inputValue }) => {
                                                return options.filter(option => {
                                                    const name = `${option.first_name || ''} ${option.last_name || ''}`.toLowerCase();
                                                    const email = (option.email || '').toLowerCase();
                                                    const uscId = (option.usc_id || option.id_number || option.student_id || '').toLowerCase();
                                                    const search = inputValue.toLowerCase();
                                                    return name.includes(search) || email.includes(search) || uscId.includes(search);
                                                });
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            )}
                            
                            {/* Selected Patient Display (Both Modes) */}
                            {selectedPatient && (
                                <Grid item xs={12} md={readOnly ? 8 : 6}>
                                    <Box sx={{ 
                                        p: 2, 
                                        backgroundColor: readOnly ? 'rgba(0,0,0,0.02)' : 'rgba(25, 118, 210, 0.08)', 
                                        borderRadius: 2,
                                        border: `1px solid ${readOnly ? 'rgba(0,0,0,0.1)' : 'rgba(25, 118, 210, 0.2)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                    }}>
                                        <Avatar sx={{ bgcolor: '#1976d2', width: 56, height: 56 }}>
                                            <PersonIcon fontSize="large" />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6">
                                                {selectedPatient.first_name} {selectedPatient.last_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedPatient.email}
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                {selectedPatient.usc_id && (
                                                    <Chip label={`USC ID: ${selectedPatient.usc_id}`} size="small" color="primary" />
                                                )}
                                                {selectedPatient.id_number && (
                                                    <Chip label={`ID: ${selectedPatient.id_number}`} size="small" variant="outlined" />
                                                )}
                                            </Stack>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}

                            <Grid item xs={12} md={readOnly && selectedPatient ? 4 : 6}>
                                {readOnly ? (
                                    <DisplayField label="Visit Date & Time" value={dayjs(watch('visit_date')).format('MMM DD, YYYY hh:mm A')} />
                                ) : (
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <Controller
                                            name="visit_date"
                                            control={control}
                                            render={({ field }) => (
                                                <DateTimePicker
                                                    {...field}
                                                    label="Visit Date & Time"
                                                    value={dayjs(field.value)}
                                                    onChange={(newValue) => field.onChange(newValue ? newValue.format() : null)}
                                                    slotProps={{ 
                                                        textField: { 
                                                            fullWidth: true,
                                                            required: true,
                                                            error: !!errors.visit_date,
                                                            helperText: errors.visit_date?.message
                                                        } 
                                                    }}
                                                    disabled={!canEdit}
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Vital Signs Section */}
                <Grid item xs={12}>
                    <Paper sx={{ 
                        p: 3, 
                        mb: 2,
                        borderLeft: `5px solid #2e7d32`,
                        boxShadow: 3
                    }}>
                        <Typography variant="h6" gutterBottom color="secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#2e7d32' }}>
                            <FavoriteIcon /> Vital Signs
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={3}>
                            {[
                                { name: 'temperature', label: 'Temperature (°C)', placeholder: '36.5' },
                                { name: 'blood_pressure', label: 'Blood Pressure (mmHg)', placeholder: '120/80' },
                                { name: 'pulse_rate', label: 'Pulse Rate (bpm)', placeholder: '72' },
                                { name: 'respiratory_rate', label: 'Respiratory Rate (/min)', placeholder: '16' },
                                { name: 'height', label: 'Height (cm)', placeholder: '170' },
                                { name: 'weight', label: 'Weight (kg)', placeholder: '70' },
                                { name: 'bmi', label: 'BMI', placeholder: '24.2' }
                            ].map((v) => (
                                <Grid item xs={12} sm={6} md={3} key={v.name}>
                                    {readOnly ? (
                                        <DisplayField label={v.label} value={watch(`vital_signs.${v.name}`)} />
                                    ) : (
                                        <Controller
                                            name={`vital_signs.${v.name}`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label={v.label}
                                                    disabled={!canEdit}
                                                    placeholder={v.placeholder}
                                                    error={!!errors.vital_signs?.[v.name]}
                                                    helperText={errors.vital_signs?.[v.name]?.message}
                                                />
                                            )}
                                        />
                                    )}
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                {/* Physical Examination Section */}
                <Grid item xs={12}>
                    <Paper sx={{ 
                        p: 3, 
                        mb: 2,
                        borderLeft: `5px solid #ed6c02`,
                        boxShadow: 3
                    }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#ed6c02', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MedicalServicesIcon /> Physical Examination
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={3}>
                            {[
                                { name: 'general_appearance', label: 'General Appearance', rows: 3 },
                                { name: 'skin', label: 'Skin', rows: 2 },
                                { name: 'heent', label: 'HEENT', rows: 2 },
                                { name: 'heart', label: 'Heart', rows: 2 },
                                { name: 'lungs', label: 'Lungs', rows: 2 },
                                { name: 'abdomen', label: 'Abdomen', rows: 2 },
                                { name: 'extremities', label: 'Extremities', rows: 2 },
                                { name: 'neurological', label: 'Neurological', rows: 2 }
                            ].map((p) => (
                                <Grid item xs={12} md={p.name === 'general_appearance' ? 12 : 6} key={p.name}>
                                    {readOnly ? (
                                        <DisplayField label={p.label} value={watch(`physical_examination.${p.name}`)} multiline rows={p.rows} />
                                    ) : (
                                        <Controller
                                            name={`physical_examination.${p.name}`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    multiline
                                                    rows={p.rows}
                                                    label={p.label}
                                                    disabled={!canEdit}
                                                    error={!!errors.physical_examination?.[p.name]}
                                                    helperText={errors.physical_examination?.[p.name]?.message}
                                                />
                                            )}
                                        />
                                    )}
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                {/* Attachments Section */}
                {(medicalRecordId || !readOnly) && (
                    <Grid item xs={12}>
                        <Paper sx={{ 
                            p: 3, 
                            mb: 2,
                            borderLeft: `5px solid #00acc1`,
                            boxShadow: 3
                        }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="h6" sx={{ color: '#00acc1', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FileIcon /> Supporting Documents
                                </Typography>
                                {medicalRecordId && canEdit && (
                                    <Button 
                                        size="small"
                                        startIcon={<UploadIcon />}
                                        onClick={() => setOpenUploadDialog(true)}
                                    >
                                        Add Files
                                    </Button>
                                )}
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            {!medicalRecordId ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Supporting documents (X-rays, Lab Results) can be added after you save this clinical record.
                                </Alert>
                            ) : (
                                <>
                                    {/* Existing Attachments List */}
                                    {(Array.isArray(attachments) ? attachments : []).length > 0 ? (
                                        <Grid container spacing={2}>
                                            {(Array.isArray(attachments) ? attachments : []).map((doc) => (
                                                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                                                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <FileIcon color="primary" />
                                                        <Box sx={{ overflow: 'hidden' }}>
                                                            <Typography variant="body2" noWrap fontWeight="medium">
                                                                {doc.original_filename}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" display="block">
                                                                {doc.document_type_display}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleDownloadDocument(doc)} 
                                                                title="Download"
                                                                color="primary"
                                                            >
                                                                <DownloadIcon fontSize="small" />
                                                            </IconButton>
                                                            {canEdit && (
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={() => handleDeleteAttachment(doc.id)} 
                                                                    title="Delete"
                                                                    color="error"
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                        </Box>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                            No documents attached to this visit. Use the Document Archive to add files.
                                        </Typography>
                                    )}
                                </>
                            )}
                        </Paper>
                    </Grid>
                )}

                {/* Diagnosis and Treatment Section */}
                <Grid item xs={12}>
                    <Paper sx={{ 
                        p: 3, 
                        mb: 2,
                        borderLeft: `5px solid #d32f2f`,
                        boxShadow: 3
                    }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon /> Assessment & Plan
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={3}>
                            {[
                                { name: 'concern', label: "Student's Concern / Reason for Visit", rows: 3, required: true },
                                { name: 'diagnosis', label: 'Diagnosis', rows: 4, required: true },
                                { name: 'treatment', label: 'Treatment Plan', rows: 4, required: false },
                                { name: 'notes', label: 'Additional Notes', rows: 3, required: false }
                            ].map((f) => (
                                <Grid item xs={12} key={f.name}>                                    {readOnly ? (
                                        <DisplayField label={f.label} value={watch(f.name)} multiline rows={f.rows} />
                                    ) : (
                                        <Controller
                                            name={f.name}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    multiline
                                                    rows={f.rows}
                                                    label={`${f.label}${f.required ? ' *' : ''}`}
                                                    disabled={!canEdit}
                                                    required={f.required}
                                                    error={!!errors[f.name]}
                                                    helperText={errors[f.name]?.message}
                                                />
                                            )}
                                        />
                                    )}
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {canEdit && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, pb: 4 }}>
                    {!medicalRecordId && (
                        <Button
                            variant="outlined"
                            onClick={resetForm}
                            disabled={loading}
                        >
                            Clear Form
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading || (!medicalRecordId && !selectedPatient)}
                        sx={{ minWidth: 150, py: 1.5, fontWeight: 'bold' }}
                    >
                        {loading ? <CircularProgress size={24} /> : (medicalRecordId ? 'Update Medical Record' : 'Create Medical Record')}
                    </Button>
                </Box>
            )}
            {/* Upload Dialog */}
            {selectedPatient && (
                <PatientDocumentUpload
                    open={openUploadDialog}
                    onClose={() => setOpenUploadDialog(false)}
                    patientId={selectedPatient.id}
                    patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                    medicalRecordId={medicalRecordId}
                    onUploadSuccess={fetchAttachments}
                />
            )}
        </Box>
    );
};

export default MedicalRecord;
