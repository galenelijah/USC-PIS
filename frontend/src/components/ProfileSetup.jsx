import React, { useState } from 'react';
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
  Badge
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import MyTextField from './forms/MyTextField';
import MyDatePicker from './forms/MyDatePicker';
import MySelector from './forms/MySelector';
import { CivilStatusChoices, SexChoices, ProgramsChoices, YearLevelChoices, CampusChoices } from './static/choices';
import logger from '../utils/logger';

// Defensive fallbacks for imported arrays
const safeCivilStatusChoices = CivilStatusChoices || [];
const safeSexChoices = SexChoices || [];
const safeProgramsChoices = ProgramsChoices || [];
const safeYearLevelChoices = YearLevelChoices || [];
const safeCampusChoices = CampusChoices || [];
import dayjs from 'dayjs';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';
import * as Yup from 'yup';
import { commonValidation } from '../utils/validationSchemas';
import { authService } from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, selectAuthToken, selectCurrentUser } from '../features/authentication/authSlice';

// Custom styled components
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

// Steps configuration - will be determined by user role
const getStepsForRole = (role) => {
  const baseSteps = [
    { label: 'Personal Information', icon: Person, color: '#667eea' },
    { label: 'Contact Details', icon: ContactPhone, color: '#764ba2' }
  ];
  
  switch (role) {
    case 'STUDENT':
      return [
        ...baseSteps,
        { label: 'Academic Information', icon: School, color: '#f093fb' },
        { label: 'Medical Information', icon: LocalHospital, color: '#f5576c' }
      ];
    case 'DOCTOR':
    case 'NURSE':
      return [
        ...baseSteps,
        { label: 'Professional Information', icon: Badge, color: '#f093fb' }
      ];
    case 'ADMIN':
    case 'STAFF':
      return [
        ...baseSteps,
        { label: 'Additional Information', icon: Badge, color: '#f093fb' }
      ];
    default:
      return baseSteps;
  }
};

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

// Role-based validation schema
const createValidationSchema = (role) => {
  // Base validation for all roles
  const baseValidation = {
    first_name: commonValidation.requiredText('First name'),
    last_name: commonValidation.requiredText('Last name'),
    middle_name: commonValidation.optionalText,
    sex: commonValidation.requiredText('Sex'),
    civil_status: commonValidation.requiredText('Civil status'),
    birthday: commonValidation.birthdate,
    address_permanent: commonValidation.requiredText('Permanent address'),
    phone: commonValidation.phone('Phone number'),
    email: commonValidation.email,
    contact_emergency_name: commonValidation.optionalText,
    contact_emergency_number: commonValidation.optionalText,
  };

  // Role-specific validation
  switch (role) {
    case 'STUDENT':
      return Yup.object().shape({
        ...baseValidation,
        nationality: commonValidation.requiredText('Nationality'),
        religion: commonValidation.optionalText,
        address_present: commonValidation.requiredText('Present address'),
        id_number: commonValidation.idNumber('ID Number'),
        course: commonValidation.requiredText('Course'),
        year_level: commonValidation.requiredText('Year Level'),
        school: commonValidation.optionalText,
        weight: commonValidation.positiveNumber('Weight'),
        height: commonValidation.positiveNumber('Height'),
        contact_father_name: commonValidation.optionalText,
        contact_mother_name: commonValidation.optionalText,
      });

    case 'DOCTOR':
    case 'NURSE':
      return Yup.object().shape({
        ...baseValidation,
        department: commonValidation.requiredText('Department')
      });

    case 'ADMIN':
    case 'STAFF':
      return Yup.object().shape({
        ...baseValidation,
        department: commonValidation.requiredText('Department')
      });

    default:
      return Yup.object().shape(baseValidation);
  }
};

// Validation step fields - role-based
const getStepFieldsForRole = (role) => {
  const baseFields = [
    ['first_name', 'last_name', 'middle_name', 'sex', 'civil_status', 'birthday'],
    ['address_permanent', 'phone', 'email', 'contact_emergency_name', 'contact_emergency_number']
  ];
  
  switch (role) {
    case 'STUDENT':
      return [
        ['first_name', 'last_name', 'middle_name', 'sex', 'civil_status', 'birthday', 'nationality', 'religion'],
        ['address_permanent', 'address_present', 'phone', 'email', 'contact_father_name', 'contact_mother_name', 'contact_emergency_name', 'contact_emergency_number'],
        ['id_number', 'course', 'year_level', 'school', 'weight', 'height'],
        [] // Medical information step
      ];
    case 'DOCTOR':
    case 'NURSE':
      return [
        ...baseFields,
        ['department'] // Department field only
      ];
    case 'ADMIN':
    case 'STAFF':
      return [
        ...baseFields,
        ['department'] // Administrative fields
      ];
    default:
      return baseFields;
  }
};

const ProfileSetup = () => {
  const dispatch = useDispatch();
  const currentToken = useSelector(selectAuthToken);
  const currentUser = useSelector(selectCurrentUser);
  const [activeStep, setActiveStep] = useState(0);
  
  // User role checks
  const userRole = currentUser?.role;
  const isStudent = currentUser && currentUser.role === 'STUDENT';
  const isStaffOrMedical = currentUser && ['ADMIN', 'STAFF', 'DOCTOR', 'DENTIST', 'NURSE'].includes(currentUser.role);
  
  // Get role-based configuration
  const steps = getStepsForRole(userRole);
  const stepFields = getStepFieldsForRole(userRole);
  
  console.log('🔧 DEBUG: User role:', userRole);
  console.log('🔧 DEBUG: Steps for role:', steps);
  console.log('🔧 DEBUG: Step fields for role:', stepFields);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Get default values based on role
  const getDefaultValues = (role) => {
    const baseDefaults = {
      first_name: '',
      last_name: '',
      middle_name: '',
      sex: '',
      civil_status: '',
      birthday: '',
      address_permanent: '',
      phone: '',
      email: '',
      contact_emergency_name: '',
      contact_emergency_number: '',
    };

    switch (role) {
      case 'STUDENT':
        return {
          ...baseDefaults,
          nationality: '',
          religion: '',
          address_present: '',
          id_number: '',
          course: '',
          year_level: '',
          school: '',
          weight: '',
          height: '',
          contact_father_name: '',
          contact_mother_name: '',
        };
      case 'DOCTOR':
      case 'NURSE':
        return {
          ...baseDefaults,
          department: '',
        };
      case 'ADMIN':
      case 'STAFF':
        return {
          ...baseDefaults,
          department: '',
        };
      default:
        return baseDefaults;
    }
  };

  const { control, handleSubmit, formState: { errors }, setValue, getValues, watch, trigger, reset } = useForm({
    resolver: yupResolver(createValidationSchema(userRole)),
    defaultValues: getDefaultValues(userRole)
  });

  // Medical information state
  const [selectedIllnesses, setSelectedIllnesses] = useState([]);
  const [otherIllness, setOtherIllness] = useState('');
  const [selectedChildhoodDiseases, setSelectedChildhoodDiseases] = useState([]);
  const [selectedSpecialNeeds, setSelectedSpecialNeeds] = useState([]);
  const [existingMedicalConditions, setExistingMedicalConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);

  // Helper functions
  const toggleSelection = (option, selectedList, setter) => {
    setter((prev) =>
      (prev || []).includes(option) ? (prev || []).filter((item) => item !== option) : [...(prev || []), option]
    );
  };

  // Simplified rendering for non-students
  const renderPersonalInfoSimplified = (stepKey) => (
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
                hint="Use your official name as on your ID"
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
                hint="Family name / surname"
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
                hint="Optional"
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
                hint="Select sex as indicated in records"
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
                hint="Single, Married, etc."
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
                hint="MM/DD/YYYY"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderContactInfoSimplified = (stepKey) => (
    <Box key={stepKey}>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: alpha('#764ba2', 0.2), borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <ContactPhone sx={{ color: '#764ba2', fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold" color="secondary">
              Contact Information
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MyTextField
                key={`${stepKey}-address_permanent`}
                label="Address"
                name="address_permanent"
                control={control}
                required
                multiline
                rows={2}
                error={!!errors?.address_permanent}
                helperText={errors?.address_permanent?.message}
                hint="Include house no., street, barangay, city"
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
                hint="7–15 digits, numbers only"
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
                hint="Active contact email"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                key={`${stepKey}-contact_emergency_name`}
                label="Emergency Contact Name"
                name="contact_emergency_name"
                control={control}
                required
                error={!!errors?.contact_emergency_name}
                helperText={errors?.contact_emergency_name?.message}
                hint="Person to contact in emergencies"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MyTextField
                key={`${stepKey}-contact_emergency_number`}
                label="Emergency Contact Number"
                name="contact_emergency_number"
                control={control}
                required
                error={!!errors?.contact_emergency_number}
                helperText={errors?.contact_emergency_number?.message}
                hint="7–15 digits"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderProfessionalInfo = (stepKey) => (
    <Box key={stepKey}>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: alpha('#f093fb', 0.2), borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <LocalHospital sx={{ color: '#f093fb', fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#f093fb' }}>
              Department Information
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MyTextField
                key={`${stepKey}-department`}
                label="Department"
                name="department"
                control={control}
                required
                error={!!errors?.department}
                helperText={errors?.department?.message}
                placeholder="e.g., Emergency Department, Pediatrics, Internal Medicine"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderAdministrativeInfo = (stepKey) => (
    <Box key={stepKey}>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: alpha('#f093fb', 0.2), borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Badge sx={{ color: '#f093fb', fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#f093fb' }}>
              Department Information
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MyTextField
                key={`${stepKey}-department`}
                label="Department"
                name="department"
                control={control}
                required
                error={!!errors?.department}
                helperText={errors?.department?.message}
                placeholder="e.g., Administration, Human Resources, IT Department"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

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
    console.log('🔧 DEBUG: onSubmit called with data:', data);
    console.log('🔧 DEBUG: User role:', userRole);
    
    setLoading(true);
    setGlobalError(null);

    try {
      let profileData = {
        ...data,
        birthday: data.birthday ? dayjs(data.birthday).format('YYYY-MM-DD') : null,
        emergency_contact: data.contact_emergency_name,
        emergency_contact_number: data.contact_emergency_number,
      };

      // Add student-specific fields and medical information
      if (isStudent) {
        // Prepare illnesses array with custom input if specified
        const illnessesArray = selectedIllnesses.includes('Others (please specify)') 
          ? [...selectedIllnesses.filter(illness => illness !== 'Others (please specify)'), otherIllness].filter(Boolean)
          : selectedIllnesses;

        profileData = {
          ...profileData,
          // Convert arrays to comma-separated strings for Django CharField compatibility
          childhood_diseases: selectedChildhoodDiseases.join(', '),
          special_needs: selectedSpecialNeeds.join(', '),
          illness: illnessesArray.join(', '),
          existing_medical_condition: existingMedicalConditions.filter(condition => condition.trim() !== '').join(', '),
          medications: medications.filter(medication => medication.trim() !== '').join(', '),
          allergies: allergies.filter(allergy => allergy.trim() !== '').join(', '),
          // Fix field name mappings for emergency contacts
          father_name: data.contact_father_name,
          mother_name: data.contact_mother_name,
        };
      }

      // Remove the old field names to avoid duplication
      delete profileData.contact_father_name;
      delete profileData.contact_mother_name;
      delete profileData.contact_emergency_name;

      logger.apiCall('POST', '/auth/complete-profile-setup/', profileData);
      
      // Use the correct completeProfileSetup endpoint
      const response = await authService.completeProfileSetup(profileData);
      
      logger.info('Profile setup API response received');
      logger.debug('Response status:', response?.status);
      
      // The completeProfileSetup endpoint returns user data and new token
      if (response.data) {
        logger.info('Profile setup successful, updating Redux store');
        const userData = response.data.user || response.data;
        const newToken = response.data.token || currentToken;
        
        // Ensure completeSetup is set to true in the user data
        if (userData) {
          userData.completeSetup = true;
        }
        
        dispatch(setCredentials({ user: userData, token: newToken }));
        
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          logger.info('Navigating to home page');
          navigate('/home');
        }, 100);
      } else {
        logger.error('No data in response:', response);
        setError('Profile setup completed but no user data received. Please refresh the page.');
      }
    } catch (error) {
      console.log('🔧 DEBUG: Error in profile setup:', error);
      logger.error('Profile setup error:', error);
      
      let errorMessage = 'Failed to complete profile setup. Please try again.';
      
      if (error.response) {
        const { status, data } = error.response;
        console.error('Server error response:', status, data);
        
        // Handle field-specific errors
        if (data && typeof data === 'object') {
          // If "errors" key exists (standardized format), use that, otherwise use data directly
          const fieldErrors = data.errors || data;
          let hasFieldErrors = false;
          
          Object.keys(fieldErrors).forEach(field => {
            // Skip non-field error keys
            if (['detail', 'message', 'error_code', 'non_field_errors'].includes(field)) return;
            
            const message = Array.isArray(fieldErrors[field]) 
              ? fieldErrors[field][0] 
              : fieldErrors[field];
              
            if (message) {
              setError(field, { type: 'server', message: message });
              hasFieldErrors = true;
            }
          });
          
          // If we mapped field errors, we don't necessarily need a global alert unless there are other errors
          if (hasFieldErrors) {
             errorMessage = 'Please check the highlighted fields for errors.';
          }
          
          // Check for specific global error keys
          if (data.detail) errorMessage = data.detail;
          else if (data.message) errorMessage = data.message;
          else if (data.non_field_errors) {
            errorMessage = Array.isArray(data.non_field_errors) 
              ? data.non_field_errors.join(', ') 
              : data.non_field_errors;
          }
        }
        
        if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 429) {
          errorMessage = 'Too many attempts. Please wait before trying again.';
        } else if (status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    const stepKey = `step-${step}`;
    
    // Use simplified rendering for non-students
    if (!isStudent) {
      switch (step) {
        case 0:
          return renderPersonalInfoSimplified(stepKey);
        case 1:
          return renderContactInfoSimplified(stepKey);
        case 2:
          if (userRole === 'DOCTOR' || userRole === 'NURSE') {
            return renderProfessionalInfo(stepKey);
          } else if (userRole === 'ADMIN' || userRole === 'STAFF') {
            return renderAdministrativeInfo(stepKey);
          }
          return null;
        default:
          return null;
      }
    }
    
    // Original student rendering
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
                      hint="Use your official name as on your ID"
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
                      hint="Family name / surname"
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
                      hint="Optional"
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
                      hint="Select sex as indicated in records"
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
                      hint="Single, Married, etc."
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
                      hint="MM/DD/YYYY"
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
                      hint="e.g., Filipino"
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
                      hint="Optional"
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
                hint="If different from permanent address"
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
                hint="Your USC ID (digits only)"
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
                hint="Choose your program"
              />
                  </Grid>
                  <Grid item xs={12} sm={6}>
              <MySelector
                key={`${stepKey}-year_level`}
                label="Year Level"
                name="year_level"
                control={control}
                options={safeYearLevelChoices}
                required
                error={!!errors?.year_level}
                helperText={errors?.year_level?.message}
                hint="Current year level"
              />
                  </Grid>
                  <Grid item xs={12} sm={6}>
              <MySelector
                key={`${stepKey}-school`}
                label="School/Campus"
                name="school"
                control={control}
                options={safeCampusChoices}
                error={!!errors?.school}
                helperText={errors?.school?.message}
                hint="Main or satellite campus"
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
                hint="Optional; numeric"
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
                hint="Optional; numeric"
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
                        key={`${stepKey}-contact_father_name`}
                        label="Father's Name"
                        name="contact_father_name"
                        control={control}
                        error={!!errors?.contact_father_name}
                        helperText={errors?.contact_father_name?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <MyTextField
                        key={`${stepKey}-contact_mother_name`}
                        label="Mother's Name"
                        name="contact_mother_name"
                        control={control}
                        error={!!errors?.contact_mother_name}
                        helperText={errors?.contact_mother_name?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <MyTextField
                        key={`${stepKey}-contact_emergency_name`}
                        label="Emergency Contact Name"
                        name="contact_emergency_name"
                        control={control}
                        error={!!errors?.contact_emergency_name}
                        helperText={errors?.contact_emergency_name?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <MyTextField
                        key={`${stepKey}-contact_emergency_number`}
                        label="Emergency Contact Number"
                        name="contact_emergency_number"
                        control={control}
                        error={!!errors?.contact_emergency_number}
                        helperText={errors?.contact_emergency_number?.message}
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
            <AccountCircle sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Complete Your Profile
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {isStudent 
                ? "Please fill in your information to set up your USC-PIS student account"
                : `Please fill in your ${userRole?.toLowerCase()} profile information`
              }
            </Typography>
            {!isStudent && (
              <Chip 
                label={`${userRole} Profile Setup`} 
                color="primary" 
                variant="outlined"
                sx={{ mt: 1 }}
              />
            )}
            
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
            {globalError && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
                onClose={() => setGlobalError(null)}
              >
                {globalError}
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
                    onClick={async (e) => {
                      console.log('🔧 DEBUG: Complete Setup button clicked');
                      console.log('🔧 DEBUG: Active step:', activeStep);
                      console.log('🔧 DEBUG: Total steps:', steps.length);
                      console.log('🔧 DEBUG: Form errors:', errors);
                      console.log('🔧 DEBUG: Form values:', getValues());
                      
                      // Trigger validation before submit
                      const isValid = await trigger();
                      console.log('🔧 DEBUG: Form validation result:', isValid);
                      
                      if (!isValid) {
                        console.log('🔧 DEBUG: Form validation failed, errors:', errors);
                        return;
                      }
                      
                      handleSubmit(onSubmit)(e);
                    }}
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Check />}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      px: 4,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                      }
                    }}
                  >
                    {loading ? 'Setting up...' : 'Complete Setup'}
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

export default ProfileSetup;
