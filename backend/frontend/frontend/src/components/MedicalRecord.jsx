import React, { useEffect, useState } from "react";
import { Typography, Box, TextField, Grid, Paper, Button, CircularProgress, Alert, Autocomplete, Divider } from "@mui/material";
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

const MedicalRecord = ({ medicalRecordId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const user = useSelector(state => state.auth.user);
    const isStaffOrMedical = user?.role && ['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(user.role);
    
    const [patients, setPatients] = useState([]);
    const [patientId, setPatientId] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [formData, setFormData] = useState({
        patient: '',
        visit_date: '',
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

    // Fetch patients for staff/medical users
    useEffect(() => {
        if (isStaffOrMedical && !medicalRecordId) {
            patientService.getAll().then(res => {
                setPatients(res.data || []);
            }).catch(err => {
                console.error('Error fetching patients:', err);
            });
        }
    }, [isStaffOrMedical, medicalRecordId]);

    useEffect(() => {
        if (medicalRecordId) {
            fetchRecord();
        } else {
            resetForm();
        }
    }, [medicalRecordId]);

    const resetForm = () => {
        setFormData({
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
        setPatientId(null);
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
            
            setFormData(safeData);
            setPatientId(data.patient);
            
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

    const handleInputChange = (section, field) => (event) => {
        const value = event.target.value;
        
        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handlePatientChange = (event, value) => {
        setPatientId(value ? value.id : null);
        setSelectedPatient(value);
        setFormData(prev => ({ ...prev, patient: value ? value.id : '' }));
    };

    const validateForm = () => {
        if (!patientId && !medicalRecordId) {
            setError('Please select a patient.');
            return false;
        }
        if (!formData.visit_date) {
            setError('Please enter a visit date.');
            return false;
        }
        if (!formData.diagnosis.trim()) {
            setError('Please enter a diagnosis.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isStaffOrMedical) return;

        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const payload = { 
                ...formData, 
                patient: patientId || formData.patient,
                vital_signs: formData.vital_signs || {},
                physical_examination: formData.physical_examination || {}
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
    const bmiInfo = getBMIInfo(formData.vital_signs.bmi, formData.vital_signs.sex);

    if (loading && medicalRecordId) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1200, mx: 'auto' }}>
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
                                <Grid item xs={12} md={6}>
                                    <Autocomplete
                                        options={patients}
                                        getOptionLabel={option => `${option.last_name}, ${option.first_name} (ID: ${option.id})`}
                                        value={selectedPatient}
                                        onChange={handlePatientChange}
                                        renderInput={params => (
                                            <TextField 
                                                {...params} 
                                                label="Select Patient" 
                                                required 
                                                error={!patientId && !medicalRecordId}
                                                helperText={!patientId && !medicalRecordId ? "Please select a patient" : ""}
                                            />
                                        )}
                                    />
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
                                <TextField
                                    fullWidth
                                    label="Visit Date"
                                    type="date"
                                    value={formData.visit_date}
                                    onChange={handleInputChange(null, 'visit_date')}
                                    InputLabelProps={{ shrink: true }}
                                    disabled={!isStaffOrMedical}
                                    required
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
                                <TextField
                                    fullWidth
                                    label="Temperature (°C)"
                                    value={formData.vital_signs?.temperature || ''}
                                    onChange={handleInputChange('vital_signs', 'temperature')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="36.5"
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Blood Pressure (mmHg)"
                                    value={formData.vital_signs?.blood_pressure || ''}
                                    onChange={handleInputChange('vital_signs', 'blood_pressure')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="120/80"
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Pulse Rate (bpm)"
                                    value={formData.vital_signs?.pulse_rate || ''}
                                    onChange={handleInputChange('vital_signs', 'pulse_rate')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="72"
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Respiratory Rate (/min)"
                                    value={formData.vital_signs?.respiratory_rate || ''}
                                    onChange={handleInputChange('vital_signs', 'respiratory_rate')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="16"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Height (cm)"
                                    value={formData.vital_signs?.height || ''}
                                    onChange={handleInputChange('vital_signs', 'height')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="170"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Weight (kg)"
                                    value={formData.vital_signs?.weight || ''}
                                    onChange={handleInputChange('vital_signs', 'weight')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="70"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="BMI"
                                    value={formData.vital_signs?.bmi || ''}
                                    onChange={handleInputChange('vital_signs', 'bmi')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="24.2"
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
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="General Appearance"
                                    value={formData.physical_examination?.general_appearance || ''}
                                    onChange={handleInputChange('physical_examination', 'general_appearance')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="Patient appears alert and oriented..."
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Heart"
                                    value={formData.physical_examination?.heart || ''}
                                    onChange={handleInputChange('physical_examination', 'heart')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="Regular rate and rhythm..."
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Lungs"
                                    value={formData.physical_examination?.lungs || ''}
                                    onChange={handleInputChange('physical_examination', 'lungs')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="Clear to auscultation..."
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Abdomen"
                                    value={formData.physical_examination?.abdomen || ''}
                                    onChange={handleInputChange('physical_examination', 'abdomen')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="Soft, non-tender..."
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Extremities"
                                    value={formData.physical_examination?.extremities || ''}
                                    onChange={handleInputChange('physical_examination', 'extremities')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="No edema or deformities..."
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
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Diagnosis"
                                    value={formData.diagnosis}
                                    onChange={handleInputChange(null, 'diagnosis')}
                                    disabled={!isStaffOrMedical}
                                    required
                                    placeholder="Primary diagnosis and any secondary conditions..."
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Treatment Plan"
                                    value={formData.treatment}
                                    onChange={handleInputChange(null, 'treatment')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="Medications, procedures, follow-up instructions..."
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Additional Notes"
                                    value={formData.notes}
                                    onChange={handleInputChange(null, 'notes')}
                                    disabled={!isStaffOrMedical}
                                    placeholder="Any additional observations or instructions..."
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
                        disabled={loading || (!medicalRecordId && !patientId)}
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