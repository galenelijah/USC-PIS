import React, { useEffect, useState } from "react";
import { Typography, Box, TextField, Grid, Paper, Button, CircularProgress, Alert, Autocomplete, Divider, InputAdornment, Avatar, Chip } from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon, Person as PersonIcon } from "@mui/icons-material";
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

const MedicalRecord = ({ medicalRecordId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const user = useSelector(state => state.auth.user);
    const isStaffOrMedical = user?.role && ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(user.role);
    
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [filteredPatients, setFilteredPatients] = useState([]);

    const { handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm({
        resolver: yupResolver(medicalRecordSchema),
        defaultValues: {
            patient: '',
            visit_date: new Date().toISOString().split('T')[0],
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
            visit_date: new Date().toISOString().split('T')[0],
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
        setError(null);
        try {
            const response = await healthRecordsService.getById(medicalRecordId);
            const data = response.data;
            
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
            if (data.patient && patients.length > 0) {
                const patient = patients.find(p => p.id === data.patient);
                setSelectedPatient(patient);
            }
        } catch (err) {
            setError('Failed to load medical record.');
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
        if (!isStaffOrMedical) return;

        setLoading(true);
        setError(null);
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
            } else {
                await healthRecordsService.create(payload);
                setSuccess('Medical record created successfully!');
                resetForm(); // Reset form after successful creation
            }
        } catch (err) {
            setError('Failed to save medical record. Please check all required fields.');
            console.error('Error saving record:', err);
        } finally {
            setLoading(false);
        }
    };

    // Function to determine BMI category and corresponding image
    const getBMIInfo = (bmi, sex) => {
        if (!bmi || isNaN(bmi)) return { category: "Not specified", image: null };
        const numericBMI = parseFloat(bmi);
        const isMale = sex?.toLowerCase() === "male";
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

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1200, mx: 'auto' }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Grid container spacing={3}>
                {/* Patient Selection Section */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 2 }}>
                        <Typography variant="h6" gutterBottom color="primary">
                            Patient Information
                        </Typography>
                        <Grid container spacing={2}>
                            {isStaffOrMedical && !medicalRecordId && (
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
                                        
                                        {/* Selected Patient Display */}
                                        {selectedPatient && (
                                            <Box sx={{ 
                                                mt: 2, 
                                                p: 2, 
                                                backgroundColor: 'rgba(25, 118, 210, 0.08)', 
                                                borderRadius: 1,
                                                border: '1px solid rgba(25, 118, 210, 0.2)'
                                            }}>
                                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                                    Selected Patient:
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{ bgcolor: '#1976d2' }}>
                                                        <PersonIcon />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body1" fontWeight="medium">
                                                            {selectedPatient.first_name} {selectedPatient.last_name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {selectedPatient.email}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                            {selectedPatient.usc_id && (
                                                                <Chip 
                                                                    label={`USC ID: ${selectedPatient.usc_id}`} 
                                                                    size="small" 
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                            {selectedPatient.id_number && (
                                                                <Chip 
                                                                    label={`ID: ${selectedPatient.id_number}`} 
                                                                    size="small" 
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                            )}
                            {medicalRecordId && (
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Patient"
                                        value={formData.patient_name || `Patient ID: ${formData.patient}`}
                                        InputProps={{ readOnly: true }}
                                        fullWidth
                                    />
                                </Grid>
                            )}
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
                    <Paper sx={{ p: 3, mb: 2 }}>
                        <Typography variant="h6" gutterBottom color="primary">
                            Vital Signs
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <Controller
                                    name="vital_signs.temperature"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Temperature (°C)"
                                            disabled={!isStaffOrMedical}
                                            placeholder="36.5"
                                            error={!!errors.vital_signs?.temperature}
                                            helperText={errors.vital_signs?.temperature?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Controller
                                    name="vital_signs.blood_pressure"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Blood Pressure (mmHg)"
                                            disabled={!isStaffOrMedical}
                                            placeholder="120/80"
                                            error={!!errors.vital_signs?.blood_pressure}
                                            helperText={errors.vital_signs?.blood_pressure?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Controller
                                    name="vital_signs.pulse_rate"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Pulse Rate (bpm)"
                                            disabled={!isStaffOrMedical}
                                            placeholder="72"
                                            error={!!errors.vital_signs?.pulse_rate}
                                            helperText={errors.vital_signs?.pulse_rate?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Controller
                                    name="vital_signs.respiratory_rate"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Respiratory Rate (/min)"
                                            disabled={!isStaffOrMedical}
                                            placeholder="16"
                                            error={!!errors.vital_signs?.respiratory_rate}
                                            helperText={errors.vital_signs?.respiratory_rate?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Controller
                                    name="vital_signs.height"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Height (cm)"
                                            disabled={!isStaffOrMedical}
                                            placeholder="170"
                                            error={!!errors.vital_signs?.height}
                                            helperText={errors.vital_signs?.height?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Controller
                                    name="vital_signs.weight"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Weight (kg)"
                                            disabled={!isStaffOrMedical}
                                            placeholder="70"
                                            error={!!errors.vital_signs?.weight}
                                            helperText={errors.vital_signs?.weight?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Controller
                                    name="vital_signs.bmi"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="BMI"
                                            disabled={!isStaffOrMedical}
                                            placeholder="24.2"
                                            error={!!errors.vital_signs?.bmi}
                                            helperText={errors.vital_signs?.bmi?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Physical Examination Section */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 2 }}>
                        <Typography variant="h6" gutterBottom color="primary">
                            Physical Examination
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Controller
                                    name="physical_examination.general_appearance"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="General Appearance"
                                            disabled={!isStaffOrMedical}
                                            placeholder="Patient appears alert and oriented..."
                                            error={!!errors.physical_examination?.general_appearance}
                                            helperText={errors.physical_examination?.general_appearance?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="physical_examination.heart"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label="Heart"
                                            disabled={!isStaffOrMedical}
                                            placeholder="Regular rate and rhythm..."
                                            error={!!errors.physical_examination?.heart}
                                            helperText={errors.physical_examination?.heart?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="physical_examination.lungs"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label="Lungs"
                                            disabled={!isStaffOrMedical}
                                            placeholder="Clear to auscultation..."
                                            error={!!errors.physical_examination?.lungs}
                                            helperText={errors.physical_examination?.lungs?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="physical_examination.abdomen"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label="Abdomen"
                                            disabled={!isStaffOrMedical}
                                            placeholder="Soft, non-tender..."
                                            error={!!errors.physical_examination?.abdomen}
                                            helperText={errors.physical_examination?.abdomen?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="physical_examination.extremities"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label="Extremities"
                                            disabled={!isStaffOrMedical}
                                            placeholder="No edema or deformities..."
                                            error={!!errors.physical_examination?.extremities}
                                            helperText={errors.physical_examination?.extremities?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Diagnosis and Treatment Section */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 2 }}>
                        <Typography variant="h6" gutterBottom color="primary">
                            Diagnosis and Treatment
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Controller
                                    name="diagnosis"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={4}
                                            label="Diagnosis"
                                            disabled={!isStaffOrMedical}
                                            required
                                            placeholder="Primary diagnosis and any secondary conditions..."
                                            error={!!errors.diagnosis}
                                            helperText={errors.diagnosis?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Controller
                                    name="treatment"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={4}
                                            label="Treatment Plan"
                                            disabled={!isStaffOrMedical}
                                            placeholder="Medications, procedures, follow-up instructions..."
                                            error={!!errors.treatment}
                                            helperText={errors.treatment?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Controller
                                    name="notes"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Additional Notes"
                                            disabled={!isStaffOrMedical}
                                            placeholder="Any additional observations or instructions..."
                                            error={!!errors.notes}
                                            helperText={errors.notes?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {isStaffOrMedical && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
                        sx={{ minWidth: 120 }}
                    >
                        {loading ? <CircularProgress size={20} /> : (medicalRecordId ? 'Update Record' : 'Create Record')}
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default MedicalRecord;