import * as yup from 'yup';

// Common validation patterns with uniform error messages
export const commonValidation = {
  // Email validation
  email: yup
    .string()
    .required('Email address is required')
    .email('Please enter a valid email address')
    .matches(
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      'Please enter a valid email address'
    ),

  // Password validation
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>#^])[A-Za-z\d!@#$%^&*(),.?":{}|<>#^]/,
      'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    ),

  // Simple password (for login)
  simplePassword: yup
    .string()
    .required('Password is required'),

  // Required text field
  requiredText: (fieldName) => yup
    .string()
    .required(`${fieldName} is required`)
    .trim()
    .min(1, `${fieldName} cannot be empty`),

  // Optional text field
  optionalText: yup
    .string()
    .trim(),

  // Required select/dropdown
  requiredSelect: (fieldName, options = []) => yup
    .string()
    .required(`Please select a ${fieldName.toLowerCase()}`)
    .oneOf(options.length > 0 ? options : undefined, `Please select a valid ${fieldName.toLowerCase()}`),

  // Date validation
  requiredDate: (fieldName) => yup
    .date()
    .required(`${fieldName} is required`)
    .nullable(),

  // Past date validation (cannot be in the future)
  pastDate: (fieldName) => yup
    .date()
    .required(`${fieldName} is required`)
    .nullable()
    .max(new Date(), `${fieldName} cannot be in the future`),

  // Birthdate validation (reasonable age limits)
  birthdate: yup
    .date()
    .required('Date of birth is required')
    .nullable()
    .max(new Date(), 'Date of birth cannot be in the future')
    .min(new Date(new Date().getFullYear() - 120, 0, 1), 'Please enter a valid date of birth')
    .test('minimum-age', 'Must be at least 10 years old', function(value) {
      if (!value) return false;
      const today = new Date();
      const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      return value <= tenYearsAgo;
    }),

  // Visit/appointment date validation (cannot be more than 1 year in the future)
  visitDate: (fieldName) => yup
    .date()
    .required(`${fieldName} is required`)
    .nullable()
    .max(new Date(new Date().getFullYear() + 1, 11, 31), `${fieldName} cannot be more than 1 year in the future`),

  // Date range validation
  dateAfter: (fieldName, afterField) => yup
    .date()
    .required(`${fieldName} is required`)
    .nullable()
    .min(yup.ref(afterField), `${fieldName} must be after ${afterField.replace('_', ' ')}`),

  // Number validation
  positiveNumber: (fieldName) => yup
    .number()
    .typeError(`${fieldName} must be a number`)
    .positive(`${fieldName} must be a positive number`)
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),

  // Integer validation
  positiveInteger: (fieldName) => yup
    .number()
    .typeError(`${fieldName} must be a number`)
    .positive(`${fieldName} must be a positive number`)
    .integer(`${fieldName} must be a whole number`)
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),

  // Rating validation
  rating: yup
    .number()
    .required('Please provide a rating')
    .min(1, 'Please select at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),

  // Yes/No radio validation
  yesNoRadio: (fieldName) => yup
    .string()
    .required(`Please select an option for ${fieldName}`)
    .oneOf(['yes', 'no'], 'Please select yes or no'),

  // Phone number validation (digits only, 7-15 chars)
  phone: (fieldName = 'Phone number') => yup
    .string()
    .required(`${fieldName} is required`)
    .matches(/^[0-9]{7,15}$/, `${fieldName} must be 7-15 digits (numbers only)`),

  // Optional phone number validation (digits only, 7-15 chars, if provided)
  phoneOptional: (fieldName = 'Phone number') => yup
    .string()
    .nullable()
    .transform((value) => (value === '' ? null : value))
    .test('is-phone', `${fieldName} must be 7-15 digits (numbers only)`, (value) => {
      if (!value) return true; // Allow null or undefined
      return /^[0-9]{7,15}$/.test(value);
    }),

  // ID number validation (at least 5 digits)
  idNumber: (fieldName = 'ID Number') => yup
    .string()
    .required(`${fieldName} is required`)
    .matches(/^\d{5,}$/, `${fieldName} must contain at least 5 digits`),

  // Medical note/description validation
  medicalNote: yup
    .string()
    .nullable()
    .notRequired()
    .transform((value) => (value === '' ? null : value))
    .test('has-text', 'Description must contain at least one letter', (value) => {
      if (!value) return true; // Allow null/empty
      return /[a-zA-Z]/.test(value);
    })
    .test('valid-chars', 'Please use only alphanumeric characters and standard medical symbols (., - / + : ? #)', (value) => {
      if (!value) return true; // Allow null/empty
      return /^[a-zA-Z0-9\s\.,\-\(\)\/\+\:\?#;]*$/.test(value);
    })
    .test('min-len', 'Description is too short (min 2 characters)', (value) => {
      if (!value) return true; // Allow null/empty
      return value.length >= 2;
    })
    .max(1000, 'Description is too long (max 1000 characters)'),
};

// Authentication schemas
export const loginSchema = yup.object().shape({
  email: commonValidation.email,
  password: commonValidation.simplePassword,
});

export const registerSchema = yup.object().shape({
  email: commonValidation.email,
  password: commonValidation.password,
  password2: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
  role: yup.string().nullable().notRequired(),
});

// Medical Record schema
export const medicalRecordSchema = yup.object().shape({
patient: commonValidation.requiredText('Patient selection'),
visit_date: yup.date().required('Visit date is required').nullable().typeError('Invalid date format'),
concern: commonValidation.requiredText("Student's concern"),
diagnosis: commonValidation.requiredText('Diagnosis'),
treatment: yup.string().nullable(),
notes: yup.string().nullable(),
  vital_signs: yup.object().shape({
    temperature: yup.number()
      .typeError('Temperature must be a number')
      .min(32, 'Temperature is too low (min 32°C)')
      .max(42, 'Temperature is too high (max 42°C)')
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),
    blood_pressure: yup.string()
      .nullable()
      .notRequired()
      .test('bp-format', 'Blood pressure must be in format like 120/80', function(value) {
        if (!value) return true;
        return /^\d{2,3}\/\d{2,3}$/.test(value);
      })
      .test('bp-range', 'Systolic must be 60-260 and Diastolic must be 30-150', function(value) {
        if (!value || !/^\d{2,3}\/\d{2,3}$/.test(value)) return true;
        const [sys, dia] = value.split('/').map(Number);
        return sys >= 60 && sys <= 260 && dia >= 30 && dia <= 150;
      }),
    heart_rate: yup.number()
      .typeError('Heart rate must be a number')
      .min(30, 'Heart rate is too low (min 30)')
      .max(220, 'Heart rate is too high (max 220)')
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),
    respiratory_rate: yup.number()
      .typeError('Respiratory rate must be a number')
      .min(6, 'Respiratory rate is too low (min 6)')
      .max(50, 'Respiratory rate is too high (max 50)')
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),
    height: yup.number()    .typeError('Height must be a number')
    .min(50, 'Height is too short (min 50cm)')
    .max(250, 'Height is too tall (max 250cm)')
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),
  weight: yup.number()
    .typeError('Weight must be a number')
    .min(10, 'Weight is too light (min 10kg)')
    .max(500, 'Weight is too heavy (max 500kg)')
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),
  bmi: yup.number()
    .typeError('BMI must be a number')
    .positive('BMI must be a positive number')
    .max(100, 'BMI is too high')
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),
  }),  physical_examination: yup.object().shape({
    general_appearance: commonValidation.medicalNote,
    skin: commonValidation.medicalNote,
    heent: commonValidation.medicalNote,
    heart: commonValidation.medicalNote,
    lungs: commonValidation.medicalNote,
    abdomen: commonValidation.medicalNote,
    extremities: commonValidation.medicalNote,
    neurological: commonValidation.medicalNote,
  }),
});

// Medical Certificate schema
// Base medical certificate schema (common fields)
const baseMedicalCertificateSchema = {
  patient: commonValidation.requiredText('Patient selection'),
  template: commonValidation.requiredText('Template selection'),
  diagnosis: commonValidation.optionalText,
  recommendations: commonValidation.optionalText,
  valid_from: commonValidation.pastDate('Valid from date'),
  valid_until: yup
    .date()
    .required('Valid until date is required')
    .nullable()
    .min(yup.ref('valid_from'), 'Valid until date must be after valid from date')
    .max(new Date(new Date().getFullYear() + 1, 11, 31), 'Valid until date cannot be more than 1 year in the future'),
  additional_notes: commonValidation.optionalText,
};

// Doctor-specific fields
const doctorMedicalCertificateFields = {
  fitness_status: yup
    .string()
    .required('Fitness status is required')
    .oneOf(['fit', 'not_fit'], 'Please select a valid fitness status'),
  fitness_reason: yup
    .string()
    .when('fitness_status', {
      is: 'not_fit',
      then: (schema) => schema.required('Reason is required for "Not Fit" status'),
      otherwise: (schema) => schema.notRequired()
    }),
  approval_status: yup
    .string()
    .required('Approval status is required')
    .oneOf(['approved', 'rejected'], 'Please select a valid approval status'),
};

// Dynamic schema generator
export const createMedicalCertificateSchema = (userRole) => {
  console.log('Creating schema for userRole:', userRole); // Debug log
  
  if (userRole === 'DOCTOR') {
    return yup.object().shape({
      ...baseMedicalCertificateSchema,
      ...doctorMedicalCertificateFields,
    });
  }
  
  // Non-doctors (including null/undefined) only need basic fields
  return yup.object().shape(baseMedicalCertificateSchema);
};

// Default schema for backward compatibility
export const medicalCertificateSchema = yup.object().shape({
  ...baseMedicalCertificateSchema,
  ...doctorMedicalCertificateFields,
});

// Feedback schema
export const feedbackSchema = yup.object().shape({
  rating: commonValidation.rating,
  courteous: commonValidation.yesNoRadio('staff courtesy'),
  recommend: commonValidation.yesNoRadio('service recommendation'),
  comments: commonValidation.optionalText,
  improvement: commonValidation.optionalText,
});

// Consultation schema
export const consultationSchema = yup.object().shape({
  patient: commonValidation.requiredText('Patient selection'),
  date_time: commonValidation.visitDate('Consultation date and time'),
  chief_complaints: commonValidation.requiredText('Chief complaints'),
  treatment_plan: commonValidation.requiredText('Treatment plan'),
  remarks: commonValidation.optionalText,
});

// Health Info schema
export const healthInfoSchema = yup.object().shape({
  title: commonValidation.requiredText('Title'),
  category: commonValidation.requiredText('Category'),
  content: commonValidation.requiredText('Content'),
});

// Dental Record schema
export const dentalRecordSchema = yup.object().shape({
  patient: commonValidation.requiredText('Patient selection'),
  visit_date: commonValidation.pastDate('Visit date'),
  procedure_performed: commonValidation.requiredText('Procedure performed'),
  tooth_numbers: commonValidation.optionalText,
  diagnosis: commonValidation.requiredText('Diagnosis'),
  treatment_performed: commonValidation.requiredText('Treatment performed'),
  treatment_plan: commonValidation.optionalText,
  oral_hygiene_status: commonValidation.requiredSelect('Oral hygiene status', ['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  gum_condition: commonValidation.requiredSelect('Gum condition', ['HEALTHY', 'GINGIVITIS', 'PERIODONTITIS', 'OTHER']),
  pain_level: yup
    .number()
    .required('Pain level is required')
    .min(1, 'Pain level must be between 1 and 10')
    .max(10, 'Pain level must be between 1 and 10')
    .integer('Pain level must be a whole number'),
  clinical_notes: commonValidation.optionalText,
  anesthesia_used: yup
    .boolean()
    .required('Please indicate if anesthesia was used'),
  anesthesia_type: yup
    .string()
    .when('anesthesia_used', {
      is: true,
      then: (schema) => schema.required('Please specify the type of anesthesia used'),
      otherwise: (schema) => schema.notRequired(),
    }),
  materials_used: commonValidation.optionalText,
  cost: commonValidation.positiveNumber('Cost'),
  insurance_covered: yup
    .boolean()
    .required('Please indicate if insurance covers this treatment'),
});
