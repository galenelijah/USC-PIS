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
            // Priority 1: 'detail' or 'message' keys (Standard DRF/Custom)
            if (data.detail) return data.detail;
            if (data.message) return data.message;

            // Priority 2: 'non_field_errors' (DRF global validation)
            if (data.non_field_errors) {
                return Array.isArray(data.non_field_errors) 
                    ? data.non_field_errors[0] 
                    : data.non_field_errors;
            }

            // Priority 3: Flatten specific field errors into a summary string
            // We usually want to map these to inputs, but for a global alert/snackbar, we summarize.
            if (typeof data === 'object') {
                const fieldErrors = Object.entries(data)
                    .map(([field, msgs]) => {
                        const msg = Array.isArray(msgs) ? msgs[0] : msgs;
                        // Skip if the message is actually an object (nested error)
                        if (typeof msg === 'object') return null; 
                        return `${field}: ${msg}`;
                    })
                    .filter(Boolean); // Remove nulls

                if (fieldErrors.length > 0) {
                    // Return the first error, or a summary if short
                    return fieldErrors.length === 1 
                        ? fieldErrors[0] 
                        : 'Please correct the errors in the form.';
                }
            }
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

    if (typeof data === 'object') {
        Object.entries(data).forEach(([key, value]) => {
            // Skip non-field keys
            if (['detail', 'message', 'non_field_errors', 'error_code'].includes(key)) return;
            
            // Extract first message if array
            errors[key] = Array.isArray(value) ? value[0] : value;
        });
    }
    
    return errors;
};
