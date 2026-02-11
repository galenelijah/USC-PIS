/**
 * Standardized error extraction utility for API responses.
 * Handles Django Rest Framework error formats (detail, message, non_field_errors, field_errors).
 * 
 * @param {any} error - The error object from a try/catch block (usually an Axios error)
 * @returns {string} - A user-friendly error message string
 */
export const extractErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred.';

    // Case 1: Error has a response (Server responded with 4xx/5xx)
    if (error.response) {
        const { data, status } = error.response;

        // Handle specific HTTP status codes
        if (status === 401) return 'Authentication failed. Please log in again.';
        if (status === 403) return 'You do not have permission to perform this action.';
        if (status === 404) return 'The requested resource was not found.';
        if (status === 429) return 'Too many requests. Please wait a moment and try again.';
        if (status >= 500) return 'A server error occurred. Please try again later.';

        if (data) {
            // If there's a nested 'errors' object, flatten it for processing
            const effectiveData = data.errors && typeof data.errors === 'object' 
                ? { ...data, ...data.errors } 
                : data;

            // Priority 1: 'non_field_errors' (DRF global validation)
            if (effectiveData.non_field_errors) {
                return Array.isArray(effectiveData.non_field_errors) 
                    ? effectiveData.non_field_errors[0] 
                    : effectiveData.non_field_errors;
            }

            // Priority 2: 'detail' or 'message' keys (Standard DRF/Custom)
            // Skip "Validation failed" if it's just a generic wrapper
            if (effectiveData.detail && effectiveData.detail !== 'Validation failed') return effectiveData.detail;
            if (effectiveData.message) return effectiveData.message;

            // Priority 3: Flatten specific field errors into a summary string
            if (typeof effectiveData === 'object') {
                const fieldErrors = Object.entries(effectiveData)
                    .map(([field, msgs]) => {
                        // Skip system/metadata keys
                        if (['detail', 'message', 'non_field_errors', 'errors', 'error_code'].includes(field)) return null;
                        
                        const msg = Array.isArray(msgs) ? msgs[0] : msgs;
                        // Skip if the message is actually an object (nested error)
                        if (typeof msg === 'object') return null; 
                        return `${field}: ${msg}`;
                    })
                    .filter(Boolean); // Remove nulls

                if (fieldErrors.length > 0) {
                    // Return the first error, or a summary if short
                    return fieldErrors.length === 1 
                        ? fieldErrors[0].split(': ')[1] // Just return the message for single errors
                        : 'Please correct the errors in the form.';
                }
            }

            // Fallback to generic detail if nothing else found
            if (effectiveData.detail) return effectiveData.detail;
        }
    }

    // Case 2: No response (Network Error)
    if (error.request) {
        return 'Network error. Please check your internet connection.';
    }

    // Case 3: Error setting up request or other JS error
    return error.message || 'An unexpected error occurred.';
};

/**
 * Extracts field-specific errors to populate a form's error state.
 * 
 * @param {any} error - The error object
 * @returns {object} - A map of field names to error messages
 */
export const extractFieldErrors = (error) => {
    if (!error?.response?.data) return {};
    
    const data = error.response.data;
    const errors = {};

    // Handle nested 'errors' object if present
    const sourceData = data.errors && typeof data.errors === 'object' ? data.errors : data;

    if (typeof sourceData === 'object') {
        Object.entries(sourceData).forEach(([key, value]) => {
            // Skip non-field keys
            if (['detail', 'message', 'non_field_errors', 'error_code', 'errors'].includes(key)) return;
            
            // Extract first message if array
            errors[key] = Array.isArray(value) ? value[0] : value;
        });
    }
    
    return errors;
};
