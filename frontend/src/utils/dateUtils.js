import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Philippines timezone identifier
const PHILIPPINES_TIMEZONE = 'Asia/Manila';

/**
 * Centralized date formatting utility for USC-PIS system
 * Ensures consistent timestamp handling across the application
 * All timestamps are assumed to come from Django in UTC and need conversion to Philippines time
 */

/**
 * Parse a date string or Date object safely
 * @param {string|Date} dateInput - Date input from API
 * @returns {Date|null} - Valid Date object or null
 */
export const parseDate = (dateInput) => {
  if (!dateInput) return null;
  
  try {
    // If it's already a Date object
    if (dateInput instanceof Date) {
      return isValid(dateInput) ? dateInput : null;
    }
    
    // If it's a string, parse it
    if (typeof dateInput === 'string') {
      const parsed = parseISO(dateInput);
      return isValid(parsed) ? parsed : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', dateInput, error);
    return null;
  }
};

/**
 * Format date for display in Philippines timezone
 * @param {string|Date} dateInput - Date input from API
 * @param {string} formatString - Format string for date-fns
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateInput, formatString = 'MMM dd, yyyy') => {
  const date = parseDate(dateInput);
  if (!date) return 'Invalid Date';
  
  try {
    return format(date, formatString, { locale: enUS });
  } catch (error) {
    console.error('Error formatting date:', dateInput, error);
    return 'Invalid Date';
  }
};

/**
 * Format datetime for display in Philippines timezone
 * @param {string|Date} dateInput - Date input from API
 * @param {string} formatString - Format string for date-fns
 * @returns {string} - Formatted datetime string
 */
export const formatDateTime = (dateInput, formatString = 'MMM dd, yyyy h:mm a') => {
  const date = parseDate(dateInput);
  if (!date) return 'Invalid Date';
  
  try {
    return format(date, formatString, { locale: enUS });
  } catch (error) {
    console.error('Error formatting datetime:', dateInput, error);
    return 'Invalid Date';
  }
};

/**
 * Format date for Philippines locale using browser's Intl API
 * This automatically handles timezone conversion
 * @param {string|Date} dateInput - Date input from API
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string in Philippines timezone
 */
export const formatDatePH = (dateInput, options = {}) => {
  const date = parseDate(dateInput);
  if (!date) return 'Invalid Date';
  
  // Clean up options to avoid conflicts
  const cleanOptions = { ...options };
  
  // If using dateStyle, remove conflicting individual components
  if (cleanOptions.dateStyle) {
    delete cleanOptions.year;
    delete cleanOptions.month;
    delete cleanOptions.day;
  }
  
  const defaultOptions = {
    timeZone: PHILIPPINES_TIMEZONE,
    ...(!cleanOptions.dateStyle && {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    ...cleanOptions
  };
  
  // Remove any undefined values that might cause issues
  Object.keys(defaultOptions).forEach(key => {
    if (defaultOptions[key] === undefined) {
      delete defaultOptions[key];
    }
  });
  
  try {
    return new Intl.DateTimeFormat('en-PH', defaultOptions).format(date);
  } catch (error) {
    console.error('Error formatting date with Intl:', dateInput, error);
    // Fallback to simple format if Intl fails
    try {
      return date.toLocaleDateString('en-PH', { timeZone: PHILIPPINES_TIMEZONE });
    } catch (fallbackError) {
      console.error('Fallback date formatting also failed:', fallbackError);
      return 'Invalid Date';
    }
  }
};

/**
 * Format datetime for Philippines locale using browser's Intl API
 * @param {string|Date} dateInput - Date input from API
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted datetime string in Philippines timezone
 */
export const formatDateTimePH = (dateInput, options = {}) => {
  const date = parseDate(dateInput);
  if (!date) return 'Invalid Date';
  
  // Clean up options to avoid conflicts between timeStyle/dateStyle and individual components
  const cleanOptions = { ...options };
  
  // If using timeStyle or dateStyle, remove conflicting individual components
  if (cleanOptions.timeStyle || cleanOptions.dateStyle) {
    // Remove individual components that conflict with style-based formatting
    delete cleanOptions.year;
    delete cleanOptions.month;
    delete cleanOptions.day;
    delete cleanOptions.hour;
    delete cleanOptions.minute;
    delete cleanOptions.second;
    delete cleanOptions.hour12;
  }
  
  // Set default options only if no style is specified
  const defaultOptions = {
    timeZone: PHILIPPINES_TIMEZONE,
    ...(!(cleanOptions.timeStyle || cleanOptions.dateStyle) && {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    ...cleanOptions
  };
  
  // Remove any undefined values that might cause issues
  Object.keys(defaultOptions).forEach(key => {
    if (defaultOptions[key] === undefined) {
      delete defaultOptions[key];
    }
  });
  
  try {
    return new Intl.DateTimeFormat('en-PH', defaultOptions).format(date);
  } catch (error) {
    console.error('Error formatting datetime with Intl:', dateInput, error);
    // Fallback to simple format if Intl fails
    try {
      return date.toLocaleString('en-PH', { timeZone: PHILIPPINES_TIMEZONE });
    } catch (fallbackError) {
      console.error('Fallback formatting also failed:', fallbackError);
      return 'Invalid Date';
    }
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} dateInput - Date input from API
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return 'Invalid Date';
  
  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: enUS });
  } catch (error) {
    console.error('Error formatting relative time:', dateInput, error);
    return 'Invalid Date';
  }
};

/**
 * Get current date in Philippines timezone
 * @returns {Date} - Current date in Philippines timezone
 */
export const getCurrentDatePH = () => {
  return new Date();
};

/**
 * Format date for form inputs (YYYY-MM-DD)
 * @param {string|Date} dateInput - Date input
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return '';
  
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for input:', dateInput, error);
    return '';
  }
};

/**
 * Format datetime for form inputs (YYYY-MM-DD HH:mm)
 * @param {string|Date} dateInput - Date input
 * @returns {string} - Datetime string in YYYY-MM-DD HH:mm format
 */
export const formatDateTimeForInput = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return '';
  
  try {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error('Error formatting datetime for input:', dateInput, error);
    return '';
  }
};

/**
 * Comprehensive date formatter with fallback options
 * Used for exports and reports
 * @param {string|Date} dateInput - Date input from API
 * @returns {Object} - Multiple formatted representations
 */
export const formatDateComprehensive = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) {
    return {
      formatted: 'Invalid Date',
      relative: 'Invalid Date',
      iso: null,
      timestamp: null
    };
  }
  
  try {
    return {
      formatted: formatDateTimePH(date),
      relative: formatRelativeTime(date),
      iso: date.toISOString(),
      timestamp: date.getTime(),
      date: formatDatePH(date),
      time: formatDateTimePH(date, { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: PHILIPPINES_TIMEZONE
      })
    };
  } catch (error) {
    console.error('Error in comprehensive date formatting:', dateInput, error);
    return {
      formatted: 'Invalid Date',
      relative: 'Invalid Date',
      iso: null,
      timestamp: null
    };
  }
};

/**
 * Validate if a date string is valid
 * @param {string|Date} dateInput - Date input
 * @returns {boolean} - True if valid date
 */
export const isValidDate = (dateInput) => {
  const date = parseDate(dateInput);
  return date !== null;
};

// Export default object for convenience
export default {
  parseDate,
  formatDate,
  formatDateTime,
  formatDatePH,
  formatDateTimePH,
  formatRelativeTime,
  getCurrentDatePH,
  formatDateForInput,
  formatDateTimeForInput,
  formatDateComprehensive,
  isValidDate,
  PHILIPPINES_TIMEZONE
};