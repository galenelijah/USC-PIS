import * as React from 'react';
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
  CircularProgress
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import { Add, Remove, Check } from '@mui/icons-material';
import { Avatar } from '@mui/material';
import MyTextField from './forms/MyTextField';
import MyDatePicker from './forms/MyDatePicker';
import MySelector from './forms/MySelector';
import {CivilStatusChoices} from './static/choices';
import {SexChoices} from './static/choices';
import {ProgramsChoices} from './static/choices';
import dayjs from 'dayjs';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';
import * as Yup from 'yup';
import { authService } from '../services/api';
import { Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, selectAuthToken } from '../features/authentication/authSlice';

// Styled StepConnector for the Stepper component
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

// Styled StepIcon for the Stepper component
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
  personal_first_name: Yup.string().required('First Name is required'),
  personal_last_name: Yup.string().required('Last Name is required'),
  academic_id_number: Yup.string().required('ID Number is required'),
  academic_course: Yup.string().required('Course is required'),
  academic_year_level: Yup.string().required('Year Level is required'),
  // Add nullable/optional validations for fields that might cause submission issues
  personal_sex: Yup.string().nullable().notRequired(),
  personal_civil_status: Yup.string().nullable().notRequired(),
  // Birthday can be a Date, null, or a string - make it very flexible
  personal_birthday: Yup.mixed()
    .nullable()
    .notRequired()
    .transform((value, originalValue) => {
      // If empty or invalid, return null
      if (!originalValue || originalValue === '') return null;
      
      // If already a Date object and valid, return it
      if (originalValue instanceof Date && !isNaN(originalValue.getTime())) {
        return originalValue;
      }
      
      // If string, try to parse it
      if (typeof originalValue === 'string') {
        const date = new Date(originalValue);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // If we couldn't parse it, return null
      return null;
    }),
  personal_nationality: Yup.string().nullable().notRequired(),
  personal_religion: Yup.string().nullable().notRequired(),
  contact_address_permanent: Yup.string().nullable().notRequired(),
  contact_address_present: Yup.string().nullable().notRequired(),
  contact_phone: Yup.string().nullable().notRequired(),
  academic_weight: Yup.string().nullable().notRequired(),
  academic_height: Yup.string().nullable().notRequired(),
  contact_father_name: Yup.string().nullable().notRequired(),
  contact_mother_name: Yup.string().nullable().notRequired(),
  contact_emergency_name: Yup.string().nullable().notRequired(),
  contact_emergency_number: Yup.string().nullable().notRequired()
});

const ProfileSetup = () => {
  const dispatch = useDispatch();
  const currentToken = useSelector(selectAuthToken);
  const { control, handleSubmit, formState: { errors }, setValue, getValues, watch } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      personal_first_name: '',
      personal_last_name: '',
      personal_middle_name: '',
      personal_sex: '',
      personal_civil_status: '',
      personal_birthday: '',
      personal_nationality: '',
      personal_religion: '',
      contact_address_permanent: '',
      contact_address_present: '',
      contact_phone: '',
      contact_father_name: '',
      contact_mother_name: '',
      contact_emergency_name: '',
      contact_emergency_number: '',
      academic_id_number: '',
      academic_course: '',
      academic_year_level: '',
      academic_school: '',
      academic_weight: '',
      academic_height: '',
    }
  });
  const navigate = useNavigate();
  const [selectedIllnesses, setSelectedIllnesses] = React.useState([]);
  const [otherIllness, setOtherIllness] = React.useState('');
  const [selectedChildhoodDiseases, setSelectedChildhoodDiseases] = React.useState([]);
  const [selectedSpecialNeeds, setSelectedSpecialNeeds] = React.useState([]);
  const [existingMedicalConditions, setExistingMedicalConditions] = React.useState([]);
  const [medications, setMedications] = React.useState([]);
  const [allergies, setAllergies] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  
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
  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Compile all form data for submission
  const compileFormData = () => {
    const data = getValues();
    // Map the prefixed fields back to their original names
    const mappedData = {
      first_name: data.personal_first_name,
      last_name: data.personal_last_name,
      middle_name: data.personal_middle_name,
      sex: data.personal_sex,
      civil_status: data.personal_civil_status,
      nationality: data.personal_nationality,
      religion: data.personal_religion,
      address_permanent: data.contact_address_permanent,
      address_present: data.contact_address_present,
      phone: data.contact_phone,
      father_name: data.contact_father_name,
      mother_name: data.contact_mother_name,
      emergency_contact: data.contact_emergency_name,
      emergency_contact_number: data.contact_emergency_number,
      id_number: data.academic_id_number,
      course: data.academic_course,
      year_level: data.academic_year_level,
      school: data.academic_school,
      weight: data.academic_weight,
      height: data.academic_height
    };
    // Format the birthday to ISO format if it exists
    let formattedBirthday = '';
    if (data.personal_birthday) {
      try {
        const dateObj = new Date(data.personal_birthday);
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
  const onSubmit = async () => {
    setLoading(true);
    try {
      const formData = compileFormData();
      console.log('Submitting profile data:', formData);
      const response = await authService.completeProfileSetup(formData);
      
      // Update user state in Redux after successful submission
      if (response && response.user && currentToken) {
        dispatch(setCredentials({ user: response.user, token: currentToken })); 
        console.log('Dispatched setCredentials with:', response.user, 'and token:', currentToken);
      } else {
        console.warn('Could not update Redux state. Missing user data in response or token.');
        // Optionally refetch profile and token here if needed
      }

      alert('Profile setup completed successfully!');
      navigate('/home');
    } catch (error) {
      console.error('Profile setup error:', error);
      if (error.response) {
        if (error.response.data.errors) {
          const errorMessages = Object.entries(error.response.data.errors)
            .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
            .join('\n');
          alert(`Failed to complete profile setup. Validation errors:\n${errorMessages}`);
        } else {
          alert(error.response.data.detail || 'Failed to complete profile setup. Please check the console for details.');
        }
      } else if (error.request) {
        alert('Failed to receive response from server. Please check your connection.');
      } else {
        alert(`Failed to complete profile setup: ${error.message}`);
      }
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
                name="personal_first_name"
                control={control}
                error={!!errors.personal_first_name}
                helperText={errors.personal_first_name?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Last Name"
                name="personal_last_name"
                control={control}
                error={!!errors.personal_last_name}
                helperText={errors.personal_last_name?.message}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="Middle Name"
                name="personal_middle_name"
                control={control}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Sex
              </Typography>
              <Controller
                name="personal_sex"
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
                name="personal_civil_status"
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
                name="personal_birthday"
                control={control}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Nationality"
                name="personal_nationality"
                control={control}
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="Religion"
                name="personal_religion"
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
                name="contact_address_permanent"
                control={control}
                error={!!errors.contact_address_permanent}
                helperText={errors.contact_address_permanent?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="Present Address"
                name="contact_address_present"
                control={control}
                error={!!errors.contact_address_present}
                helperText={errors.contact_address_present?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Phone Number"
                name="contact_phone"
                control={control}
                error={!!errors.contact_phone}
                helperText={errors.contact_phone?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Emergency Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Father's Name"
                name="contact_father_name"
                control={control}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Mother's Name"
                name="contact_mother_name"
                control={control}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Emergency Contact Name"
                name="contact_emergency_name"
                control={control}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Emergency Contact Number"
                name="contact_emergency_number"
                control={control}
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
                name="academic_id_number"
                control={control}
                error={!!errors.academic_id_number}
                helperText={errors.academic_id_number?.message}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <MySelector
                options={ProgramsChoices}
                label="Course/Program"
                name="academic_course"
                control={control}
                error={!!errors.academic_course}
                helperText={errors.academic_course?.message}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="Year Level"
                name="academic_year_level"
                control={control}
                error={!!errors.academic_year_level}
                helperText={errors.academic_year_level?.message}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="School"
                name="academic_school"
                control={control}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Weight (kg)"
                name="academic_weight"
                control={control}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                label="Height (cm)"
                name="academic_height"
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
              onClick={onSubmit}
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