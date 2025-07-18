import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  alpha,
  Fade,
  Collapse
} from '@mui/material';
import {
  Person,
  ContactPhone,
  School,
  LocalHospital,
  NavigateNext,
  NavigateBefore,
  Check,
  Add,
  Remove,
  AccountCircle,
  Home,
  Badge,
  Health,
  Save,
  Edit
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import MyTextField from './forms/MyTextField';
import MyDatePicker from './forms/MyDatePicker';
import MySelector from './forms/MySelector';
import { CivilStatusChoices, SexChoices, ProgramsChoices } from './static/choices.jsx';

// Defensive fallbacks for imported arrays
const safeCivilStatusChoices = CivilStatusChoices || [];
const safeSexChoices = SexChoices || [];
const safeProgramsChoices = ProgramsChoices || [];
import dayjs from 'dayjs';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';
import * as Yup from 'yup';
import { authService } from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, selectAuthToken, selectCurrentUser } from '../features/authentication/authSlice';

// Custom styled components (reusing from ProfileSetup)
const ModernStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 4,
    border: 0,
    backgroundColor: alpha('#000', 0.1),
    borderRadius: 2,
  },
}));

const ModernStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  background: ownerState.active || ownerState.completed 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : alpha('#000', 0.1),
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: ownerState.active || ownerState.completed 
    ? '0 4px 20px rgba(102, 126, 234, 0.4)'
    : 'none',
  transition: 'all 0.3s ease',
  fontSize: '1.2rem',
}));

function ModernStepIcon(props) {
  const { active, completed, className, icon } = props;
  
  const icons = {
    1: <Person />,
    2: <ContactPhone />,
    3: <School />,
    4: <LocalHospital />,
  };

  return (
    <ModernStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check /> : icons[String(icon)]}
    </ModernStepIconRoot>
  );
}

// Steps configuration
const steps = [
  { label: 'Personal Information', icon: Person, color: '#667eea' },
  { label: 'Contact Details', icon: ContactPhone, color: '#764ba2' },
  { label: 'Academic Information', icon: School, color: '#f093fb' },
  { label: 'Medical Information', icon: LocalHospital, color: '#f5576c' }
];

// Medical options
const childhoodDiseasesOptions = [
  'Measles (Rubella)',
  'Mumps (Parotitis)',
  'Chicken Pox (Varicella)',
  'Hepatitis A',
  'Hepatitis B',
];

const specialNeedsOptions = [
  'Hearing Impairment (Partial)',
  'Hearing Impairment (Full)',
  'Visual Impairment or Blindness (Partial)',
  'Visual Impairment or Blindness (Full)',
  'Physical Disability',
  'Mental Health Condition',
];

const illnessesOptions = [
  'Asthma',
  'Diabetes',
  'Cardiovascular/Heart Disease',
  'Hypertension',
  'Cancer',
  'Others (please specify)',
];

// Validation schema
const validationSchema = Yup.object().shape({
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  middle_name: Yup.string().nullable(),
  sex: Yup.string().required('Sex is required'),
  civil_status: Yup.string().required('Civil status is required'),
  birthday: Yup.date().required('Birthday is required').nullable(),
  nationality: Yup.string().required('Nationality is required'),
  religion: Yup.string().nullable(),
  address_permanent: Yup.string().required('Permanent address is required'),
  address_present: Yup.string().required('Present address is required'),
  phone: Yup.string().required('Phone number is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  id_number: Yup.string().required('ID Number is required'),
  course: Yup.string().required('Course is required'),
  year_level: Yup.string().required('Year Level is required'),
  school: Yup.string().nullable().notRequired(),
  weight: Yup.string().nullable().notRequired(),
  height: Yup.string().nullable().notRequired(),
  father_name: Yup.string().nullable().notRequired(),
  mother_name: Yup.string().nullable().notRequired(),
  emergency_contact: Yup.string().nullable().notRequired(),
  emergency_contact_number: Yup.string().nullable().notRequired()
});

const stepFields = [
  ['first_name', 'last_name', 'middle_name', 'sex', 'civil_status', 'birthday', 'nationality', 'religion'],
  ['address_permanent', 'address_present', 'phone', 'email'],
  ['id_number', 'course', 'year_level', 'school', 'weight', 'height'],
  [] // Step 3 (Medical) has no required form fields, only state-based selections
];

const EditProfile = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const currentToken = useSelector(selectAuthToken);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  
  const { control, handleSubmit, formState: { errors }, setValue, getValues, watch, trigger, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      middle_name: '',
      sex: '',
      civil_status: '',
      birthday: '',
      nationality: '',
      religion: '',
      address_permanent: '',
      address_present: '',
      phone: '',
      email: '',
      id_number: '',
      course: '',
      year_level: '',
      school: '',
      weight: '',
      height: '',
      father_name: '',
      mother_name: '',
      emergency_contact: '',
      emergency_contact_number: '',
    }
  });

  // Medical information state
  const [selectedIllnesses, setSelectedIllnesses] = useState([]);
  const [otherIllness, setOtherIllness] = useState('');
  const [selectedChildhoodDiseases, setSelectedChildhoodDiseases] = useState([]);
  const [selectedSpecialNeeds, setSelectedSpecialNeeds] = useState([]);
  const [existingMedicalConditions, setExistingMedicalConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);

  // Load user data when component mounts
  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser);
    }
  }, [currentUser]);

  const loadUserData = (userData) => {
    // Reset form with user data
    reset({
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      middle_name: userData.middle_name || '',
      sex: userData.sex || '',
      civil_status: userData.civil_status || '',
      birthday: userData.birthday ? dayjs(userData.birthday) : '',
      nationality: userData.nationality || '',
      religion: userData.religion || '',
      address_permanent: userData.address_permanent || '',
      address_present: userData.address_present || '',
      phone: userData.phone || '',
      email: userData.email || '',
      id_number: userData.id_number || '',
      course: userData.course || '',
      year_level: userData.year_level || '',
      school: userData.school || '',
      weight: userData.weight || '',
      height: userData.height || '',
      father_name: userData.father_name || '',
      mother_name: userData.mother_name || '',
      emergency_contact: userData.emergency_contact || '',
      emergency_contact_number: userData.emergency_contact_number || '',
    });

    // Load medical data
    const parseCommaSeparated = (value) => {
      if (!value) return [];
      return value.split(', ').filter(item => item.trim() !== '');
    };

    setSelectedChildhoodDiseases(parseCommaSeparated(userData.childhood_diseases));
    setSelectedSpecialNeeds(parseCommaSeparated(userData.special_needs));
    setSelectedIllnesses(parseCommaSeparated(userData.illness));
    setExistingMedicalConditions(parseCommaSeparated(userData.existing_medical_condition));
    setMedications(parseCommaSeparated(userData.medications));
    setAllergies(parseCommaSeparated(userData.allergies));
  };

  // Helper functions
  const toggleSelection = (option, selectedList, setter) => {
    setter((prev) =>
      (prev || []).includes(option) ? (prev || []).filter((item) => item !== option) : [...(prev || []), option]
    );
  };

  const handleAddItem = (setter) => setter((prev) => [...(prev || []), ""]);
  const handleRemoveItem = (index, setter) =>
    setter((prev) => (prev || []).filter((_, i) => i !== index));
  const handleItemChange = (index, value, setter) =>
    setter((prev) => (prev || []).map((item, i) => (i === index ? value : item)));

  const handleNext = async () => {
    const currentStepFields = stepFields[activeStep];
    
    // For steps with form fields, validate them
    if (currentStepFields && currentStepFields.length > 0) {
      const isValid = await trigger(currentStepFields);
      if (!isValid) {
        return; // Don't proceed if validation fails
      }
    }
    
    // Move to next step
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare illnesses array with custom input if specified
      const illnessesArray = selectedIllnesses.includes('Others (please specify)') 
        ? [...selectedIllnesses.filter(illness => illness !== 'Others (please specify)'), otherIllness].filter(Boolean)
        : selectedIllnesses;

      const profileData = {
        ...data,
        birthday: data.birthday ? dayjs(data.birthday).format('YYYY-MM-DD') : null,
        // Convert arrays to comma-separated strings for Django CharField compatibility
        childhood_diseases: selectedChildhoodDiseases.join(', '),
        special_needs: selectedSpecialNeeds.join(', '),
        illness: illnessesArray.join(', '),
        existing_medical_condition: existingMedicalConditions.filter(condition => condition.trim() !== '').join(', '),
        medications: medications.filter(medication => medication.trim() !== '').join(', '),
        allergies: allergies.filter(allergy => allergy.trim() !== '').join(', '),
      };

      console.log('Updating profile data:', profileData);
      
      const response = await authService.updateProfile(profileData);
      
      console.log('Profile update successful');
      
      // Update Redux store with new user data
      if (response.data) {
        dispatch(setCredentials({ user: response.data, token: currentToken }));
        setSuccess('Profile updated successfully!');
        
        // Redirect back to profile view after a delay
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setError('Profile updated but no data received. Please refresh the page.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.response) {
        const { status, data } = error.response;
        console.error('Server error response:', status, data);
        
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.errors) {
          errorMessage = Array.isArray(data.errors) ? data.errors.join(', ') : 'Validation errors occurred.';
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 429) {
          errorMessage = 'Too many attempts. Please wait before trying again.';
        } else if (status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render step content (reusing from ProfileSetup with updated keys)
  const renderStepContent = (step) => {
    const stepKey = `edit-step-${step}`;
    
    switch (step) {
      case 0:
        return (
          <Box key={stepKey}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: alpha('#667eea', 0.2), borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Person sx={{ color: '#667eea', fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    Personal Information
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-first_name`}
                      label="First Name"
                      name="first_name"
                      control={control}
                      required
                      error={!!errors?.first_name}
                      helperText={errors?.first_name?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-last_name`}
                      label="Last Name"
                      name="last_name"
                      control={control}
                      required
                      error={!!errors?.last_name}
                      helperText={errors?.last_name?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-middle_name`}
                      label="Middle Name"
                      name="middle_name"
                      control={control}
                      error={!!errors?.middle_name}
                      helperText={errors?.middle_name?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MySelector
                      key={`${stepKey}-sex`}
                      label="Sex"
                      name="sex"
                      control={control}
                      options={safeSexChoices}
                      required
                      error={!!errors?.sex}
                      helperText={errors?.sex?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MySelector
                      key={`${stepKey}-civil_status`}
                      label="Civil Status"
                      name="civil_status"
                      control={control}
                      options={safeCivilStatusChoices}
                      required
                      error={!!errors?.civil_status}
                      helperText={errors?.civil_status?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyDatePicker
                      key={`${stepKey}-birthday`}
                      label="Birthday"
                      name="birthday"
                      control={control}
                      required
                      error={!!errors?.birthday}
                      helperText={errors?.birthday?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-nationality`}
                      label="Nationality"
                      name="nationality"
                      control={control}
                      required
                      error={!!errors?.nationality}
                      helperText={errors?.nationality?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-religion`}
                      label="Religion"
                      name="religion"
                      control={control}
                      error={!!errors?.religion}
                      helperText={errors?.religion?.message}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );
      
      case 1:
        return (
          <Box key={stepKey}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: alpha('#764ba2', 0.2), borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <ContactPhone sx={{ color: '#764ba2', fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#764ba2' }}>
                    Contact Details
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <MyTextField
                      key={`${stepKey}-address_permanent`}
                      label="Permanent Address"
                      name="address_permanent"
                      control={control}
                      required
                      multiline
                      rows={2}
                      error={!!errors?.address_permanent}
                      helperText={errors?.address_permanent?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <MyTextField
                      key={`${stepKey}-address_present`}
                      label="Present Address"
                      name="address_present"
                      control={control}
                      required
                      multiline
                      rows={2}
                      error={!!errors?.address_present}
                      helperText={errors?.address_present?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-phone`}
                      label="Phone Number"
                      name="phone"
                      control={control}
                      required
                      error={!!errors?.phone}
                      helperText={errors?.phone?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-email`}
                      label="Email Address"
                      name="email"
                      control={control}
                      required
                      error={!!errors?.email}
                      helperText={errors?.email?.message}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );
      
      case 2:
        return (
          <Box key={stepKey}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: alpha('#f093fb', 0.2), borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <School sx={{ color: '#f093fb', fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#f093fb' }}>
                    Academic Information
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-id_number`}
                      label="Student ID Number"
                      name="id_number"
                      control={control}
                      required
                      error={!!errors?.id_number}
                      helperText={errors?.id_number?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MySelector
                      key={`${stepKey}-course`}
                      label="Course"
                      name="course"
                      control={control}
                      options={safeProgramsChoices}
                      required
                      error={!!errors?.course}
                      helperText={errors?.course?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-year_level`}
                      label="Year Level"
                      name="year_level"
                      control={control}
                      required
                      error={!!errors?.year_level}
                      helperText={errors?.year_level?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-school`}
                      label="School/Campus"
                      name="school"
                      control={control}
                      error={!!errors?.school}
                      helperText={errors?.school?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-weight`}
                      label="Weight (kg)"
                      name="weight"
                      control={control}
                      type="number"
                      error={!!errors?.weight}
                      helperText={errors?.weight?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MyTextField
                      key={`${stepKey}-height`}
                      label="Height (cm)"
                      name="height"
                      control={control}
                      type="number"
                      error={!!errors?.height}
                      helperText={errors?.height?.message}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );
      
      case 3:
        return (
          <Box key={stepKey}>
            <Stack spacing={3}>
              {/* Emergency Contacts */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: alpha('#f5576c', 0.2), borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <ContactPhone sx={{ color: '#f5576c', fontSize: 28 }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#f5576c' }}>
                      Emergency Contacts
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <MyTextField
                        key={`${stepKey}-father_name`}
                        label="Father's Name"
                        name="father_name"
                        control={control}
                        error={!!errors?.father_name}
                        helperText={errors?.father_name?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <MyTextField
                        key={`${stepKey}-mother_name`}
                        label="Mother's Name"
                        name="mother_name"
                        control={control}
                        error={!!errors?.mother_name}
                        helperText={errors?.mother_name?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <MyTextField
                        key={`${stepKey}-emergency_contact`}
                        label="Emergency Contact Name"
                        name="emergency_contact"
                        control={control}
                        error={!!errors?.emergency_contact}
                        helperText={errors?.emergency_contact?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <MyTextField
                        key={`${stepKey}-emergency_contact_number`}
                        label="Emergency Contact Number"
                        name="emergency_contact_number"
                        control={control}
                        error={!!errors?.emergency_contact_number}
                        helperText={errors?.emergency_contact_number?.message}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Medical Information */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: alpha('#f5576c', 0.2), borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <LocalHospital sx={{ color: '#f5576c', fontSize: 28 }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#f5576c' }}>
                      Medical Information
                    </Typography>
                  </Box>

                  {/* Childhood Diseases */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom fontWeight="medium">
                      Childhood Diseases (Check all that apply)
                    </Typography>
                    <Grid container spacing={1}>
                      {(childhoodDiseasesOptions || []).map((disease) => (
                        <Grid item xs={12} sm={6} key={`${stepKey}-disease-${disease}`}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedChildhoodDiseases.includes(disease)}
                                onChange={() => toggleSelection(disease, selectedChildhoodDiseases, setSelectedChildhoodDiseases)}
                                size="small"
                              />
                            }
                            label={<Typography variant="body2">{disease}</Typography>}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {/* Special Needs */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom fontWeight="medium">
                      Special Needs (Check all that apply)
                    </Typography>
                    <Grid container spacing={1}>
                      {(specialNeedsOptions || []).map((need) => (
                        <Grid item xs={12} sm={6} key={`${stepKey}-need-${need}`}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedSpecialNeeds.includes(need)}
                                onChange={() => toggleSelection(need, selectedSpecialNeeds, setSelectedSpecialNeeds)}
                                size="small"
                              />
                            }
                            label={<Typography variant="body2">{need}</Typography>}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {/* Current Illnesses */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom fontWeight="medium">
                      Current Illnesses (Check all that apply)
                    </Typography>
                    <Grid container spacing={1}>
                      {(illnessesOptions || []).map((illness) => (
                        <Grid item xs={12} sm={6} key={`${stepKey}-illness-${illness}`}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedIllnesses.includes(illness)}
                                onChange={() => toggleSelection(illness, selectedIllnesses, setSelectedIllnesses)}
                                size="small"
                              />
                            }
                            label={<Typography variant="body2">{illness}</Typography>}
                          />
                        </Grid>
                      ))}
                    </Grid>
                    <Collapse in={selectedIllnesses.includes('Others (please specify)')}>
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          key={`${stepKey}-other-illness`}
                          fullWidth
                          size="small"
                          placeholder="Please specify other illness"
                          value={otherIllness}
                          onChange={(e) => setOtherIllness(e.target.value)}
                        />
                      </Box>
                    </Collapse>
                  </Box>

                  {/* Dynamic Lists */}
                  {[
                    { title: 'Existing Medical Conditions', state: existingMedicalConditions || [], setter: setExistingMedicalConditions },
                    { title: 'Current Medications', state: medications || [], setter: setMedications },
                    { title: 'Known Allergies', state: allergies || [], setter: setAllergies }
                  ].map(({ title, state, setter }) => (
                    <Box key={`${stepKey}-${title}`} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight="medium">{title}</Typography>
                        <Button
                          startIcon={<Add />}
                          onClick={() => handleAddItem(setter)}
                          size="small"
                          variant="outlined"
                        >
                          Add
                        </Button>
                      </Box>
                      {(state || []).map((item, index) => (
                        <Box key={`${stepKey}-${title}-${index}`} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={item}
                            onChange={(e) => handleItemChange(index, e.target.value, setter)}
                            placeholder={`Enter ${title.toLowerCase().slice(0, -1)}`}
                          />
                          <IconButton
                            onClick={() => handleRemoveItem(index, setter)}
                            size="small"
                            color="error"
                          >
                            <Remove />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Stack>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'white'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 4,
              textAlign: 'center'
            }}
          >
            <Edit sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Edit Your Profile
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Update your information in the USC-PIS system
            </Typography>
            
            {/* Progress */}
            <Box sx={{ mt: 3, px: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Step {activeStep + 1} of {(steps || []).length || 4}
                </Typography>
                <Typography variant="body2">
                  {Math.round(((activeStep + 1) / ((steps || []).length || 4)) * 100)}% Complete
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={((activeStep + 1) / ((steps || []).length || 4)) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha('#fff', 0.3),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#fff',
                    borderRadius: 4,
                  }
                }}
              />
            </Box>
          </Box>

          {/* Stepper */}
          <Box sx={{ p: 4, pb: 2 }}>
            <Stepper 
              activeStep={activeStep} 
              connector={<ModernStepConnector />}
              alternativeLabel
            >
              {(steps || []).map((step, index) => (
                <Step key={step?.label || index}>
                  <StepLabel
                    StepIconComponent={ModernStepIcon}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontWeight: activeStep === index ? 'bold' : 'medium',
                        color: activeStep === index ? 'primary.main' : 'text.secondary'
                      }
                    }}
                  >
                    {step?.label || `Step ${index + 1}`}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Content */}
          <Box sx={{ p: 4, pt: 2 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert 
                severity="success" 
                sx={{ mb: 3, borderRadius: 2 }}
                onClose={() => setSuccess(null)}
              >
                {success}
              </Alert>
            )}

            <Box>
              {renderStepContent(activeStep)}

              {/* Navigation */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  startIcon={<NavigateBefore />}
                  variant="outlined"
                  size="large"
                  sx={{ borderRadius: 2 }}
                >
                  Back
                </Button>
                
                {activeStep === ((steps || []).length - 1) ? (
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      px: 4,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                      }
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    variant="contained"
                    size="large"
                    endIcon={<NavigateNext />}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      px: 4,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                      }
                    }}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default EditProfile;