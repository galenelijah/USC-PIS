// Field mapping utilities to convert database IDs to human-readable labels
import { CivilStatusChoices, SexChoices, ProgramsChoices, YearLevelChoices } from '../components/static/choices.jsx';

/**
 * Get label for sex/gender field
 */
export const getSexLabel = (sexId) => {
  if (!sexId) return 'Not specified';
  const sex = SexChoices.find(s => s.id.toString() === sexId.toString());
  return sex ? sex.label : (isNaN(sexId) ? sexId : 'Unspecified');
};

/**
 * Get label for civil status field
 */
export const getCivilStatusLabel = (statusId) => {
  if (!statusId) return 'Not specified';
  const status = CivilStatusChoices.find(s => s.id.toString() === statusId.toString());
  return status ? status.label : (isNaN(statusId) ? statusId : 'Unspecified');
};

/**
 * Get label for course/program field
 */
export const getCourseLabel = (courseId) => {
  if (!courseId) return 'Not specified';
  const course = ProgramsChoices.find(c => c.id.toString() === courseId.toString());
  return course ? course.label : (isNaN(courseId) ? courseId : 'Unspecified');
};

/**
 * Get label for year level field
 */
export const getYearLevelLabel = (yearId) => {
  if (!yearId) return 'Not specified';
  const year = YearLevelChoices.find(y => y.id.toString() === yearId.toString());
  return year ? year.label : (isNaN(yearId) ? yearId : 'Unspecified');
};

/**
 * Convert comma-separated string to array for display
 */
export const convertStringToArray = (str) => {
  if (!str || str.trim() === '') return [];
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

/**
 * Calculate age from birthday
 */
export const calculateAge = (birthday) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return 'Not provided';
  // Add formatting for Philippine mobile numbers if needed
  return phone;
};

/**
 * Get department by course ID
 */
export const getDepartmentByCourse = (courseId) => {
  if (!courseId) return 'Not specified';
  const course = ProgramsChoices.find(c => c.id.toString() === courseId.toString());
  return course ? course.department : 'Unknown';
};

/**
 * Get BMI category and color
 */
export const getBMICategory = (bmi) => {
  if (!bmi || bmi <= 0) return { category: 'Unknown', color: '#9e9e9e' };
  
  if (bmi < 18.5) return { category: 'Underweight', color: '#3ba1d9' };
  if (bmi < 25) return { category: 'Healthy Weight', color: '#18a951' };
  if (bmi < 30) return { category: 'Overweight', color: '#f8d64c' };
  if (bmi < 35) return { category: 'Obesity', color: '#e69d68' };
  return { category: 'Severe Obesity', color: '#f0432e' };
};

/**
 * Format medical information arrays for display
 */
export const formatMedicalInfo = (medicalData) => {
  const fields = [
    { key: 'illness', label: 'Current Illnesses', color: 'default' },
    { key: 'allergies', label: 'Allergies', color: 'warning' },
    { key: 'medications', label: 'Current Medications', color: 'primary' },
    { key: 'childhood_diseases', label: 'Childhood Diseases', color: 'info' },
    { key: 'special_needs', label: 'Special Needs', color: 'secondary' },
    { key: 'existing_medical_condition', label: 'Medical Conditions', color: 'error' },
  ];

  return fields.map(field => ({
    ...field,
    items: convertStringToArray(medicalData[field.key])
  })).filter(field => field.items.length > 0);
};