import React, { useEffect, useState } from "react";
import { Typography, Box, TextField, Grid, Paper, Button, CircularProgress, Alert, Autocomplete, Divider, InputAdornment, Avatar, Chip, Stack } from "@mui/material";
import { 
    Search as SearchIcon, 
    Clear as ClearIcon, 
    Person as PersonIcon,
    Favorite as FavoriteIcon,
    MedicalServices as MedicalServicesIcon,
    Assignment as AssignmentIcon,
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
import ReadOnlyTextField from "./forms/ReadOnlyTextField";
import { healthRecordsService, patientService } from '../services/api';
import { useSelector } from 'react-redux';
import { extractErrorMessage, extractFieldErrors } from '../utils/errorUtils';
import { formatDateForInput } from '../utils/dateUtils';

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
            visit_date: formatDateForInput(new Date()),
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
        } else {
            resetForm();
        }
    }, [medicalRecordId]);

    const resetForm = () => {
        reset({
            patient: '',
            visit_date: formatDateForInput(new Date()),
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
            
            // Format visit_date for input field (YYYY-MM-DD)
            if (data.visit_date) {
                data.visit_date = formatDateForInput(data.visit_date);
            }
            
            // Ensure vital_signs and physical_examination exist with defensive checks
            const safeData = {
                ...data,
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

    // Function removed - using react-hook-form Controllers instead

    const handlePatientChange = (event, value) => {
        setSelectedPatient(value);
        setValue('patient', value ? value.id : '', { shouldValidate: true });
        setPatientSearchTerm(''); // Clear search when patient is selected
    };

    const clearPatientSearch = () => {
        setPatientSearchTerm('');
        setFilteredPatients(patients);
    };

    // Validation is now handled by Yup schema

    const onSubmit = async (data) => {
        if (!canEdit) return;

        setLoading(true);
        setGlobalError(null);
        setSuccess(false);

        try {
            const payload = { 
                ...data,
                vital_signs: data.vital_signs || {},
                physical_examination: data.physical_examination || {}
            };
            
            if (medicalRecordId) {
                await healthRecordsService.update(medicalRecordId, payload);
                setSuccess('Medical record updated successfully!');
                if (onSuccess) {
                    setTimeout(() => onSuccess(), 1500);
                }
            } else {
                await healthRecordsService.create(payload);
                setSuccess('Medical record created successfully!');
                if (onSuccess) {
                    setTimeout(() => onSuccess(), 1500);
                } else {
                    resetForm(); // Reset form after successful creation
                }
            }
        } catch (err) {
            console.error('Error saving record:', err);
            const message = extractErrorMessage(err);
            setGlobalError(message);
            
            // Map field errors to the form
            const fieldErrors = extractFieldErrors(err);
            Object.keys(fieldErrors).forEach(field => {
                setFieldError(field, { type: 'server', message: fieldErrors[field] });
            });
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
                                        
                                        {/* Search Input */}
                                        <TextField
                                            fullWidth
                                            placeholder="Search by name, email, or USC ID..."
                                            value={patientSearchTerm}
                                            onChange={(e) => setPatientSearchTerm(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: patientSearchTerm && (
                                                    <InputAdornment position="end">
                                                        <Button
                                                            size="small"
                                                            onClick={clearPatientSearch}
                                                            sx={{ minWidth: 'auto', p: 0.5 }}
                                                        >
                                                            <ClearIcon fontSize="small" />
                                                        </Button>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{
                                                mb: 2,
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                },
                                            }}
                                        />
                                        
                                        {/* Patient Selection */}
                                        <Autocomplete
                                            options={filteredPatients}
                                            getOptionLabel={option => `${option.last_name}, ${option.first_name}${option.usc_id ? ` (USC ID: ${option.usc_id})` : option.id_number ? ` (ID: ${option.id_number})` : ''}`}
                                            value={selectedPatient}
                                            onChange={handlePatientChange}
                                            filterOptions={(options) => options} // Disable built-in filtering since we handle it ourselves
                                            renderOption={(props, option) => (
                                                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                                                    <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                                                        <PersonIcon fontSize="small" />
                                                    </Avatar>
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {option.first_name} {option.last_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {option.email}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                            {option.usc_id && (
                                                                <Chip 
                                                                    label={`USC ID: ${option.usc_id}`} 
                                                                    size="small" 
                                                                    variant="outlined"
                                                                    sx={{ fontSize: '0.7rem', height: 18 }}
                                                                />
                                                            )}
                                                            {option.id_number && (
                                                                <Chip 
                                                                    label={`ID: ${option.id_number}`} 
                                                                    size="small" 
                                                                    variant="outlined"
                                                                    sx={{ fontSize: '0.7rem', height: 18 }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            )}
                                            renderInput={params => (
                                                <TextField 
                                                    {...params} 
                                                    label="Select Patient" 
                                                    required 
                                                    error={!!errors.patient}
                                                    helperText={errors.patient?.message || `${filteredPatients.length} patient${filteredPatients.length !== 1 ? 's' : ''} found`}
                                                    placeholder="Choose a patient from the list..."
                                                />
                                            )}
                                            noOptionsText={patientSearchTerm ? "No patients match your search" : "Start typing to search patients"}
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
                                    <DisplayField label="Visit Date" value={watch('visit_date')} />
                                ) : (
                                    <Controller
                                        name="visit_date"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="Visit Date"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                disabled={!canEdit}
                                                required
                                                error={!!errors.visit_date}
                                                helperText={errors.visit_date?.message}
                                            />
                                        )}
                                    />
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="visit_date"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Visit Date"
                                            type="date"
                                            InputLabelProps={{ shrink: true }}
                                            disabled={!isStaffOrMedical}
                                            required
                                            error={!!errors.visit_date}
                                            helperText={errors.visit_date?.message}
                                        />
                                    )}
                                />
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
                                { name: 'diagnosis', label: 'Diagnosis', rows: 4, required: true },
                                { name: 'treatment', label: 'Treatment Plan', rows: 4, required: false },
                                { name: 'notes', label: 'Additional Notes', rows: 3, required: false }
                            ].map((f) => (
                                <Grid item xs={12} key={f.name}>
                                    {readOnly ? (
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
        </Box>
    );
};

export default MedicalRecord;
