import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import { Add, Remove, Check } from '@mui/icons-material';
import { Avatar } from '@mui/material';
import MyTextField from './forms/MyTextField';
import MyDatePicker from './forms/MyDatePicker';
import MySelector from './forms/MySelector';
import { CivilStatusChoices, SexChoices } from './static/choices';
import { ProgramsChoices } from './static/choices';
import dayjs from 'dayjs';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { completeProfileSetup, selectAuthToken, selectAuthStatus } from '../features/authentication/authSlice';

// Styled components for the stepper
const ColorlibStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(95deg, rgb(104, 138, 124) 0%, rgb(104, 138, 124) 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(95deg, rgb(104, 138, 124) 0%, rgb(104, 138, 124) 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#eaeaf0',
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: ownerState.active || ownerState.completed ? 'rgb(104, 138, 124)' : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 32,
  height: 32,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
}));

function ColorlibStepIcon(props) {
  const { active, completed, className } = props;
  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check /> : props.icon}
    </ColorlibStepIconRoot>
  );
}

// Steps for the multi-step form
const steps = ['Personal Info', 'Contact Info', 'Academic Info', 'Medical Info'];

// Options for checkboxes
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

// Basic validation schema
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
  contact_father_name: Yup.string().nullable().notRequired(),
  contact_mother_name: Yup.string().nullable().notRequired(),
  contact_emergency_name: Yup.string().nullable().notRequired(),
  contact_emergency_number: Yup.string().nullable().notRequired()
});

const stepFields = [
  ['first_name', 'last_name', 'sex', 'civil_status', 'birthday', 'nationality', 'religion'],
  ['address_permanent', 'address_present', 'phone', 'email'],
  ['id_number', 'course', 'year_level', 'school', 'weight', 'height'],
  ['contact_father_name', 'contact_mother_name', 'contact_emergency_name', 'contact_emergency_number']
];

const ProfileSetup = () => {
  const dispatch = useDispatch();
  const currentToken = useSelector(selectAuthToken);
  const authStatus = useSelector(selectAuthStatus);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { control, handleSubmit, formState: { errors }, setValue, getValues, watch, trigger } = useForm({
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
      contact_father_name: '',
      contact_mother_name: '',
      contact_emergency_name: '',
      contact_emergency_number: '',
    }
  });
  const [selectedIllnesses, setSelectedIllnesses] = React.useState([]);
  const [otherIllness, setOtherIllness] = React.useState('');
  const [selectedChildhoodDiseases, setSelectedChildhoodDiseases] = React.useState([]);
  const [selectedSpecialNeeds, setSelectedSpecialNeeds] = React.useState([]);
  const [existingMedicalConditions, setExistingMedicalConditions] = React.useState([]);
  const [medications, setMedications] = React.useState([]);
  const [allergies, setAllergies] = React.useState([]);

  // Functions to handle arrays
  const toggleSelection = (option, selectedList, setter) => {
    setter((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  const handleAddItem = (setter) => setter((prev) => [...prev, ""]);
  const handleRemoveItem = (index, setter) =>
    setter((prev) => prev.filter((_, i) => i !== index));
  const handleItemChange = (index, value, setter) =>
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));

  // Handle illness checkbox changes
  const handleIllnessChange = (illness) => {
    setSelectedIllnesses((prev) =>
      prev.includes(illness) ? prev.filter((item) => item !== illness) : [...prev, illness]
    );
  };

  // Step navigation
  const handleNext = async () => {
    const fields = stepFields[activeStep];
    const valid = await trigger(fields);
    if (valid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Compile all form data for submission
  const compileFormData = () => {
    const data = getValues();
    // Map the prefixed fields back to their original names
    const mappedData = {
      first_name: data.first_name,
      last_name: data.last_name,
      middle_name: data.middle_name,
      sex: data.sex,
      civil_status: data.civil_status,
      birthday: data.birthday,
      date_of_birth: data.birthday,
      nationality: data.nationality,
      religion: data.religion,
      address_permanent: data.address_permanent,
      address_present: data.address_present,
      phone: data.phone,
      email: data.email,
      father_name: data.contact_father_name,
      mother_name: data.contact_mother_name,
      emergency_contact: data.contact_emergency_name,
      emergency_contact_number: data.contact_emergency_number,
      id_number: data.id_number,
      course: data.course,
      year_level: data.year_level,
      school: data.school,
      weight: data.weight,
      height: data.height
    };
    // Format the birthday to ISO format if it exists
    let formattedBirthday = '';
    if (data.birthday) {
      try {
        const dateObj = new Date(data.birthday);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          formattedBirthday = `${year}-${month}-${day}`;
        }
      } catch (e) {
        console.error('Error formatting date:', e);
      }
    }
    return {
      ...mappedData,
      birthday: formattedBirthday,
      date_of_birth: formattedBirthday,
      illness: selectedIllnesses.length > 0 
        ? selectedIllnesses.join(', ') + (otherIllness && selectedIllnesses.includes('Others (please specify)') ? `: ${otherIllness}` : '') 
        : '',
      childhood_diseases: selectedChildhoodDiseases.length > 0 
        ? selectedChildhoodDiseases.join(', ') 
        : '',
      special_needs: selectedSpecialNeeds.length > 0 
        ? selectedSpecialNeeds.join(', ') 
        : '',
      existing_medical_condition: existingMedicalConditions.filter(condition => condition && condition.trim() !== '').join(', '),
      medications: medications.filter(med => med && med.trim() !== '').join(', '),
      allergies: allergies.filter(allergy => allergy && allergy.trim() !== '').join(', '),
      completeSetup: true
    };
  };

  // Handle form submission
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const formData = compileFormData();
      console.log('Submitting profile setup data:', formData);
      
      const resultAction = await dispatch(completeProfileSetup(formData));
      
      if (completeProfileSetup.fulfilled.match(resultAction)) {
        console.log('Profile setup successful:', resultAction.payload);
        navigate('/home');
      } else if (completeProfileSetup.rejected.match(resultAction)) {
        console.error('Profile setup failed:', resultAction.error);
        setError(resultAction.payload || 'Failed to complete profile setup. Please try again.');
      }
    } catch (err) {
      console.error('Profile setup error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Define step content for each step - use the same control/errors for all fields
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Personal Info
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="First Name"
                name="first_name"
                control={control}
                error={!!errors.first_name}
                helperText={errors.first_name?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Last Name"
                name="last_name"
                control={control}
                error={!!errors.last_name}
                helperText={errors.last_name?.message}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="Middle Name"
                name="middle_name"
                control={control}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Sex
              </Typography>
              <Controller
                name="sex"
                control={control}
                render={({ field }) => (
                  <>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value === 'Male'}
                          onChange={() => field.onChange('Male')}
                        />
                      }
                      label="Male"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value === 'Female'}
                          onChange={() => field.onChange('Female')}
                        />
                      }
                      label="Female"
                    />
                  </>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Civil Status
              </Typography>
              <Controller
                name="civil_status"
                control={control}
                render={({ field }) => (
                  <>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value === 'Single'}
                          onChange={() => field.onChange('Single')}
                        />
                      }
                      label="Single"
                    />
                  </>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyDatePicker
                label="Birthday"
                name="birthday"
                control={control}
                error={!!errors.birthday}
                helperText={errors.birthday?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Nationality"
                name="nationality"
                control={control}
                error={!!errors.nationality}
                helperText={errors.nationality?.message}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="Religion"
                name="religion"
                control={control}
              />
            </Grid>
          </Grid>
        );
      case 1: // Contact Info
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <MyTextField
                label="Permanent Address"
                name="address_permanent"
                control={control}
                error={!!errors.address_permanent}
                helperText={errors.address_permanent?.message}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="Present Address"
                name="address_present"
                control={control}
                error={!!errors.address_present}
                helperText={errors.address_present?.message}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Phone Number"
                name="phone"
                control={control}
                error={!!errors.phone}
                helperText={errors.phone?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Email"
                name="email"
                control={control}
                error={!!errors.email}
                helperText={errors.email?.message}
                required
              />
            </Grid>
          </Grid>
        );
      case 2: // Academic Info
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <MyTextField
                label="Student ID"
                name="id_number"
                control={control}
                error={!!errors.id_number}
                helperText={errors.id_number?.message}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <MySelector
                options={ProgramsChoices}
                label="Course/Program"
                name="course"
                control={control}
                error={!!errors.course}
                helperText={errors.course?.message}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="Year Level"
                name="year_level"
                control={control}
                error={!!errors.year_level}
                helperText={errors.year_level?.message}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="School"
                name="school"
                control={control}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Weight (kg)"
                name="weight"
                control={control}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Height (cm)"
                name="height"
                control={control}
                type="number"
              />
            </Grid>
          </Grid>
        );
      case 3: // Medical Info
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Illnesses (Select all that apply)
              </Typography>
              {illnessesOptions.map((illness) => (
                <FormControlLabel
                  key={illness}
                  control={
                    <Checkbox
                      checked={selectedIllnesses.includes(illness)}
                      onChange={() => handleIllnessChange(illness)}
                    />
                  }
                  label={illness}
                />
              ))}
              {selectedIllnesses.includes('Others (please specify)') && (
                <TextField
                  fullWidth
                  label="Specify Other Illness"
                  value={otherIllness}
                  onChange={(e) => setOtherIllness(e.target.value)}
                  margin="normal"
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Childhood Diseases
              </Typography>
              {childhoodDiseasesOptions.map((disease) => (
                <FormControlLabel
                  key={disease}
                  control={
                    <Checkbox
                      checked={selectedChildhoodDiseases.includes(disease)}
                      onChange={() => toggleSelection(disease, selectedChildhoodDiseases, setSelectedChildhoodDiseases)}
                    />
                  }
                  label={disease}
                />
              ))}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Special Needs
              </Typography>
              {specialNeedsOptions.map((need) => (
                <FormControlLabel
                  key={need}
                  control={
                    <Checkbox
                      checked={selectedSpecialNeeds.includes(need)}
                      onChange={() => toggleSelection(need, selectedSpecialNeeds, setSelectedSpecialNeeds)}
                    />
                  }
                  label={need}
                />
              ))}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Existing Medical Conditions
              </Typography>
              {existingMedicalConditions.map((condition, index) => (
                <Box key={index} display="flex" alignItems="center" mb={1}>
                  <TextField
                    fullWidth
                    value={condition}
                    onChange={(e) => handleItemChange(index, e.target.value, setExistingMedicalConditions)}
                    label={`Condition ${index + 1}`}
                  />
                  <IconButton onClick={() => handleRemoveItem(index, setExistingMedicalConditions)}>
                    <Remove />
                  </IconButton>
                </Box>
              ))}
              <Button 
                startIcon={<Add />} 
                onClick={() => handleAddItem(setExistingMedicalConditions)}
                variant="outlined"
                size="small"
              >
                Add Condition
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Medications
              </Typography>
              {medications.map((medication, index) => (
                <Box key={index} display="flex" alignItems="center" mb={1}>
                  <TextField
                    fullWidth
                    value={medication}
                    onChange={(e) => handleItemChange(index, e.target.value, setMedications)}
                    label={`Medication ${index + 1}`}
                  />
                  <IconButton onClick={() => handleRemoveItem(index, setMedications)}>
                    <Remove />
                  </IconButton>
                </Box>
              ))}
              <Button 
                startIcon={<Add />} 
                onClick={() => handleAddItem(setMedications)}
                variant="outlined"
                size="small"
              >
                Add Medication
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Allergies
              </Typography>
              {allergies.map((allergy, index) => (
                <Box key={index} display="flex" alignItems="center" mb={1}>
                  <TextField
                    fullWidth
                    value={allergy}
                    onChange={(e) => handleItemChange(index, e.target.value, setAllergies)}
                    label={`Allergy ${index + 1}`}
                  />
                  <IconButton onClick={() => handleRemoveItem(index, setAllergies)}>
                    <Remove />
                  </IconButton>
                </Box>
              ))}
              <Button 
                startIcon={<Add />} 
                onClick={() => handleAddItem(setAllergies)}
                variant="outlined"
                size="small"
              >
                Add Allergy
              </Button>
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <div className="myBackground">
      <Box className="loginBox" sx={{ maxWidth: '800px' }}>
        <Box className="itemBox">
          <Typography variant="h5" className="title">Complete Your Profile</Typography>
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel 
            connector={<ColorlibStepConnector />} 
            sx={{ width: '100%', marginBottom: 3 }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        {/* Current step content - Add a key based on the active step */}
        <Box className="itemBox" sx={{ minHeight: '50vh' }} key={`step-content-${activeStep}`}>
          {getStepContent(activeStep)}
        </Box>

        {/* Navigation buttons */}
        <Box className="itemBox" sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            onClick={handleBack} 
            disabled={activeStep === 0 || loading}
            variant="outlined"
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button 
              onClick={handleSubmit(onSubmit)}
              variant="contained" 
              disabled={loading}
              sx={{ bgcolor: 'rgb(104, 138, 124)', '&:hover': { bgcolor: 'rgb(84, 118, 104)' } }}
            >
              {loading ? <CircularProgress size={24} /> : 'Complete Setup'}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: 'rgb(104, 138, 124)', '&:hover': { bgcolor: 'rgb(84, 118, 104)' } }}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </div>
  );
};

export default ProfileSetup; 