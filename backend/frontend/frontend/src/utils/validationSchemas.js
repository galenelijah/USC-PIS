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
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
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

  // Date range validation
  dateAfter: (fieldName, afterField) => yup
    .date()
    .required(`${fieldName} is required`)
    .nullable()
    .min(yup.ref(afterField), `${fieldName} must be after ${afterField.replace('_', ' ')}`),

  // Number validation
  positiveNumber: (fieldName) => yup
    .number()
    .positive(`${fieldName} must be a positive number`)
    .nullable()
    .transform(value => isNaN(value) ? null : value),

  // Integer validation
  positiveInteger: (fieldName) => yup
    .number()
    .positive(`${fieldName} must be a positive number`)
    .integer(`${fieldName} must be a whole number`)
    .nullable()
    .transform(value => isNaN(value) ? null : value),

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
  role: commonValidation.requiredSelect('Role', ['STUDENT', 'DOCTOR', 'NURSE', 'STAFF']),
});

// Medical Record schema
export const medicalRecordSchema = yup.object().shape({
  patient: commonValidation.requiredText('Patient selection'),
  visit_date: commonValidation.requiredDate('Visit date'),
  diagnosis: commonValidation.requiredText('Diagnosis'),
  treatment: commonValidation.optionalText,
  notes: commonValidation.optionalText,
  vital_signs: yup.object().shape({
    temperature: commonValidation.positiveNumber('Temperature'),
    blood_pressure: commonValidation.optionalText,
    pulse_rate: commonValidation.positiveInteger('Pulse rate'),
    respiratory_rate: commonValidation.positiveInteger('Respiratory rate'),
    height: commonValidation.positiveNumber('Height'),
    weight: commonValidation.positiveNumber('Weight'),
    bmi: commonValidation.positiveNumber('BMI'),
  }),
  physical_examination: yup.object().shape({
    general_appearance: commonValidation.optionalText,
    skin: commonValidation.optionalText,
    heent: commonValidation.optionalText,
    heart: commonValidation.optionalText,
    lungs: commonValidation.optionalText,
    abdomen: commonValidation.optionalText,
    extremities: commonValidation.optionalText,
    neurological: commonValidation.optionalText,
  }),
});

// Medical Certificate schema
export const medicalCertificateSchema = yup.object().shape({
  patient: commonValidation.requiredText('Patient selection'),
  template: commonValidation.requiredText('Template selection'),
  diagnosis: commonValidation.requiredText('Diagnosis'),
  recommendations: commonValidation.requiredText('Recommendations'),
  valid_from: commonValidation.requiredDate('Valid from date'),
  valid_until: yup
    .date()
    .required('Valid until date is required')
    .nullable()
    .min(yup.ref('valid_from'), 'Valid until date must be after valid from date'),
  additional_notes: commonValidation.optionalText,
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
    .oneOf(['draft', 'pending', 'approved', 'rejected'], 'Please select a valid approval status'),
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
  date_time: commonValidation.requiredDate('Consultation date and time'),
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
  visit_date: commonValidation.requiredDate('Visit date'),
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
  priority: commonValidation.requiredSelect('Priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  cost: commonValidation.positiveNumber('Cost'),
  insurance_covered: yup
    .boolean()
    .required('Please indicate if insurance covers this treatment'),
});