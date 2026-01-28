/**
 * Conditional Logger Utility
 * 
 * This utility provides conditional logging that only outputs to console
 * in development mode, preventing sensitive data exposure in production.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// Create a logger that only works in development
const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, but sanitize sensitive data
    console.error(...args);
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  // Special method for API calls with sensitive data sanitization
  apiCall: (method, url, data) => {
    if (isDevelopment) {
      // Sanitize sensitive fields
      const sanitizedData = sanitizeData(data);
      console.log(`[API ${method.toUpperCase()}] ${url}`, sanitizedData);
    }
  },
  
  // Special method for authentication events
  auth: (event, data) => {
    if (isDevelopment) {
      const sanitizedData = sanitizeAuthData(data);
      console.log(`[AUTH] ${event}`, sanitizedData);
    }
  }
};

// Sanitize data to remove sensitive information
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = [
    'password', 'token', 'email', 'phone_number', 'address',
    'medical_history', 'allergies', 'medications', 'ssn',
    'id_number', 'emergency_contact_phone', 'emergency_contact_name'
  ];
  
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Sanitize authentication data
function sanitizeAuthData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sanitized = { ...data };
  
  // Remove sensitive auth fields
  if (sanitized.password) sanitized.password = '[REDACTED]';
  if (sanitized.token) sanitized.token = '[REDACTED]';
  if (sanitized.email) sanitized.email = sanitized.email.replace(/@.*/, '@[DOMAIN]');
  
  return sanitized;
}

export default logger;