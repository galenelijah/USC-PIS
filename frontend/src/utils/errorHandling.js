import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Comprehensive error handling utilities for the frontend
 */

// Error types and codes
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'PERMISSION_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

export const ERROR_CODES = {
  // Network errors
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  
  // Authentication errors
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED'
};

// Error categories for better handling
const ERROR_CATEGORIES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  SERVER: 'server',
  UNKNOWN: 'unknown'
};

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Enhanced error parser that extracts meaningful information from different error formats
 */
export class ErrorParser {
  static parse(error) {
    const errorInfo = {
      type: ERROR_TYPES.UNKNOWN,
      code: null,
      message: 'An unexpected error occurred',
      details: null,
      field: null,
      retryable: false,
      statusCode: null,
      timestamp: new Date().toISOString()
    };

    try {
      // Handle network errors
      if (!error.response && error.request) {
        errorInfo.type = ERROR_TYPES.NETWORK;
        errorInfo.retryable = true;
        
        if (error.code === 'ECONNABORTED') {
          errorInfo.code = ERROR_CODES.CONNECTION_TIMEOUT;
          errorInfo.message = 'Request timeout. Please check your connection and try again.';
        } else if (error.code === 'ECONNREFUSED') {
          errorInfo.code = ERROR_CODES.CONNECTION_REFUSED;
          errorInfo.message = 'Unable to connect to server. Please try again later.';
        } else {
          errorInfo.code = ERROR_CODES.NETWORK_UNAVAILABLE;
          errorInfo.message = 'Network error. Please check your internet connection.';
        }
        
        return errorInfo;
      }

      // Handle response errors
      if (error.response) {
        errorInfo.statusCode = error.response.status;
        const responseData = error.response.data;

        switch (error.response.status) {
          case 400:
            errorInfo.type = ERROR_TYPES.VALIDATION;
            errorInfo.code = ERROR_CODES.VALIDATION_FAILED;
            errorInfo.message = this._extractValidationMessage(responseData);
            errorInfo.details = responseData.errors || responseData;
            errorInfo.field = responseData.field;
            break;

          case 401:
            errorInfo.type = ERROR_TYPES.AUTHENTICATION;
            errorInfo.code = ERROR_CODES.INVALID_CREDENTIALS;
            errorInfo.message = responseData.detail || 'Authentication failed';
            
            // Check for specific auth error types
            if (responseData.detail && responseData.detail.includes('expired')) {
              errorInfo.code = ERROR_CODES.TOKEN_EXPIRED;
              errorInfo.message = 'Your session has expired. Please log in again.';
            }
            break;

          case 403:
            errorInfo.type = ERROR_TYPES.AUTHORIZATION;
            errorInfo.message = responseData.detail || 'You do not have permission to perform this action';
            break;

          case 404:
            errorInfo.type = ERROR_TYPES.CLIENT;
            errorInfo.message = responseData.detail || 'The requested resource was not found';
            break;

          case 409:
            errorInfo.type = ERROR_TYPES.VALIDATION;
            errorInfo.message = responseData.detail || 'Conflict detected';
            errorInfo.details = responseData;
            break;

          case 429:
            errorInfo.type = ERROR_TYPES.CLIENT;
            errorInfo.code = ERROR_CODES.RATE_LIMITED;
            errorInfo.message = responseData.detail || 'Too many requests. Please wait and try again.';
            errorInfo.retryable = true;
            errorInfo.retryAfter = responseData.retry_after;
            break;

          case 500:
          case 502:
          case 503:
          case 504:
            errorInfo.type = ERROR_TYPES.SERVER;
            errorInfo.code = ERROR_CODES.INTERNAL_ERROR;
            errorInfo.message = 'Server error. Please try again later.';
            errorInfo.retryable = true;
            break;

          default:
            errorInfo.message = responseData.detail || `HTTP ${error.response.status} error`;
            break;
        }

        // Extract additional error information
        if (responseData.error_code) {
          errorInfo.code = responseData.error_code;
        }

        return errorInfo;
      }

      // Handle other error types
      if (error.message) {
        errorInfo.message = error.message;
        
        // Check for specific error patterns
        if (error.message.includes('timeout')) {
          errorInfo.type = ERROR_TYPES.TIMEOUT;
          errorInfo.code = ERROR_CODES.CONNECTION_TIMEOUT;
          errorInfo.retryable = true;
        } else if (error.message.includes('Network Error')) {
          errorInfo.type = ERROR_TYPES.NETWORK;
          errorInfo.code = ERROR_CODES.NETWORK_UNAVAILABLE;
          errorInfo.retryable = true;
        }
      }

    } catch (parseError) {
      // Always log parsing errors since these are system errors
      console.error('Error parsing failed:', parseError);
      errorInfo.message = 'An error occurred while processing the request';
    }

    return errorInfo;
  }

  static _extractValidationMessage(responseData) {
    if (typeof responseData.detail === 'string') {
      return responseData.detail;
    }

    if (responseData.errors) {
      if (Array.isArray(responseData.errors)) {
        return responseData.errors[0] || 'Validation failed';
      }
      
      if (typeof responseData.errors === 'object') {
        const firstError = Object.values(responseData.errors)[0];
        if (Array.isArray(firstError)) {
          return firstError[0];
        }
        return firstError || 'Validation failed';
      }
    }

    return 'Invalid input data';
  }
}

/**
 * Error notification manager
 */
export class ErrorNotificationManager {
  static show(errorInfo, options = {}) {
    const {
      autoClose = 5000,
      position = 'top-right',
      hideProgressBar = false,
      showRetryButton = false,
      onRetry = null
    } = options;

    const toastOptions = {
      position,
      autoClose: errorInfo.retryable ? 8000 : autoClose,
      hideProgressBar,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    };

    // Create message with retry button if applicable
    let message = errorInfo.message;
    
    if (showRetryButton && errorInfo.retryable && onRetry) {
      message = (
        <div>
          <div>{errorInfo.message}</div>
          <button 
            onClick={onRetry}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    // Show different toast types based on error type
    switch (errorInfo.type) {
      case ERROR_TYPES.NETWORK:
        toast.warn(message, toastOptions);
        break;
      case ERROR_TYPES.VALIDATION:
        toast.error(message, toastOptions);
        break;
      case ERROR_TYPES.AUTHENTICATION:
      case ERROR_TYPES.AUTHORIZATION:
        toast.error(message, { ...toastOptions, autoClose: false });
        break;
      case ERROR_TYPES.SERVER:
        toast.error(message, toastOptions);
        break;
      default:
        toast.error(message, toastOptions);
        break;
    }
  }

  static showSuccess(message, options = {}) {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  static showInfo(message, options = {}) {
    toast.info(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  static showValidationErrors(errors) {
    if (Array.isArray(errors)) {
      errors.forEach(error => {
        toast.error(error, {
          position: "top-right",
          autoClose: 4000,
        });
      });
    } else if (typeof errors === 'object') {
      Object.entries(errors).forEach(([field, fieldErrors]) => {
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach(error => {
            toast.error(`${field}: ${error}`, {
              position: "top-right",
              autoClose: 4000,
            });
          });
        } else {
          toast.error(`${field}: ${fieldErrors}`, {
            position: "top-right",
            autoClose: 4000,
          });
        }
      });
    }
  }
}

/**
 * Network recovery manager
 */
export class NetworkRecoveryManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.retryQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.eventListeners = new Map(); // Track event listeners for cleanup
    
    this._setupEventListeners();
  }

  _setupEventListeners() {
    // Create bound event handlers for cleanup
    this.onlineHandler = () => {
      this.isOnline = true;
      this._processRetryQueue();
      ErrorNotificationManager.showSuccess('Connection restored');
    };

    this.offlineHandler = () => {
      this.isOnline = false;
      ErrorNotificationManager.show({
        type: ERROR_TYPES.NETWORK,
        message: 'You are currently offline. Some features may not work.',
        retryable: false
      }, { autoClose: false });
    };

    // Add event listeners and track them
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    
    // Store references for cleanup
    this.eventListeners.set('online', this.onlineHandler);
    this.eventListeners.set('offline', this.offlineHandler);
  }

  // Add cleanup method
  destroy() {
    // Remove all event listeners
    this.eventListeners.forEach((handler, event) => {
      window.removeEventListener(event, handler);
    });
    this.eventListeners.clear();
    
    // Clear retry queue
    this.retryQueue = [];
  }

  addToRetryQueue(requestFunction, context = {}) {
    if (this.retryQueue.length >= 10) {
      // Limit queue size
      this.retryQueue.shift();
    }

    this.retryQueue.push({
      requestFunction,
      context,
      retries: 0,
      id: Date.now() + Math.random()
    });
  }

  async _processRetryQueue() {
    if (!this.isOnline || this.retryQueue.length === 0) {
      return;
    }

    const item = this.retryQueue.shift();
    
    try {
      await item.requestFunction(item.context);
      // Success - continue with next item
      this._processRetryQueue();
    } catch (error) {
      item.retries++;
      
      if (item.retries < this.maxRetries) {
        // Re-add to queue for retry
        setTimeout(() => {
          this.retryQueue.unshift(item);
          this._processRetryQueue();
        }, this.retryDelay * Math.pow(2, item.retries)); // Exponential backoff
      } else {
        // Max retries reached
        // Always log max retry errors since these are system errors
        console.error('Max retries reached for queued request:', error);
      }
    }
  }

  async executeWithRetry(requestFunction, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await requestFunction();
      } catch (error) {
        lastError = error;
        const errorInfo = ErrorParser.parse(error);
        
        if (!errorInfo.retryable || attempt === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = this.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

/**
 * Form validation error handler
 */
export class FormErrorHandler {
  constructor() {
    this.errors = {};
    this.touched = {};
  }

  setErrors(errors) {
    this.errors = { ...errors };
  }

  setFieldError(field, error) {
    this.errors[field] = error;
  }

  clearFieldError(field) {
    delete this.errors[field];
  }

  clearAllErrors() {
    this.errors = {};
  }

  setFieldTouched(field, touched = true) {
    this.touched[field] = touched;
  }

  getFieldError(field) {
    return this.touched[field] ? this.errors[field] : null;
  }

  hasFieldError(field) {
    return this.touched[field] && !!this.errors[field];
  }

  hasAnyErrors() {
    return Object.keys(this.errors).length > 0;
  }

  getFirstError() {
    const errorFields = Object.keys(this.errors);
    return errorFields.length > 0 ? this.errors[errorFields[0]] : null;
  }

  // Handle server validation errors
  handleServerErrors(errorInfo) {
    if (errorInfo.details && typeof errorInfo.details === 'object') {
      Object.entries(errorInfo.details).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          this.setFieldError(field, messages[0]);
        } else {
          this.setFieldError(field, messages);
        }
      });
    } else if (errorInfo.field && errorInfo.message) {
      this.setFieldError(errorInfo.field, errorInfo.message);
    }
  }
}

/**
 * Global error boundary handler
 */
export class GlobalErrorHandler {
  static handleError(error, errorInfo = {}) {
    const parsedError = ErrorParser.parse(error);
    
    // Always log global errors since these are critical system errors
    console.error('Global error caught:', {
      error,
      errorInfo,
      parsed: parsedError,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Send to error reporting service (if configured)
    this._reportError(parsedError, errorInfo);

    // Show user notification
    ErrorNotificationManager.show(parsedError);

    // Handle specific error types
    if (parsedError.type === ERROR_TYPES.AUTHENTICATION) {
      this._handleAuthError(parsedError);
    }

    return parsedError;
  }

  static _reportError(parsedError, errorInfo) {
    // Implement error reporting to external service
    // e.g., Sentry, LogRocket, etc.
    try {
      // Example implementation
      if (window.Sentry) {
        window.Sentry.captureException(parsedError, {
          extra: errorInfo,
          tags: {
            errorType: parsedError.type,
            errorCode: parsedError.code
          }
        });
      }
    } catch (reportingError) {
      // Always log reporting failures since these are system errors
      console.error('Error reporting failed:', reportingError);
    }
  }

  static _handleAuthError(parsedError) {
    // Handle authentication errors
    if (parsedError.code === ERROR_CODES.TOKEN_EXPIRED) {
      // Clear stored auth data
      localStorage.removeItem('Token');
      localStorage.removeItem('user');
      
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  }
}

// Create global instances
export const networkRecovery = new NetworkRecoveryManager();
export const globalErrorHandler = GlobalErrorHandler;

// Utility functions
export const handleApiError = (error, options = {}) => {
  const errorInfo = ErrorParser.parse(error);
  
  if (options.showNotification !== false) {
    ErrorNotificationManager.show(errorInfo, options);
  }
  
  return errorInfo;
};

export const withErrorHandling = (asyncFunction) => {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      const errorInfo = GlobalErrorHandler.handleError(error);
      throw errorInfo;
    }
  };
};

// React hook for error handling
export const useErrorHandler = () => {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleError = useCallback((error, options = {}) => {
    const errorInfo = ErrorParser.parse(error);
    
    if (options.field) {
      setErrors(prev => ({
        ...prev,
        [options.field]: errorInfo.message
      }));
    } else {
      setErrors({ general: errorInfo.message });
    }

    if (options.showNotification !== false) {
      ErrorNotificationManager.show(errorInfo);
    }

    return errorInfo;
  }, []);

  const clearErrors = useCallback((field = null) => {
    if (field) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  const executeAsync = useCallback(async (asyncFunction, options = {}) => {
    try {
      setLoading(true);
      clearErrors();
      const result = await asyncFunction();
      return result;
    } catch (error) {
      handleError(error, options);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearErrors]);

  return {
    errors,
    loading,
    handleError,
    clearErrors,
    executeAsync,
    hasErrors: Object.keys(errors).length > 0
  };
};

// Network recovery queue
class NetworkRecoveryQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
  }

  addToRetryQueue(requestFunction, context, retryCount = 0) {
    this.queue.push({
      requestFunction,
      context,
      retryCount,
      timestamp: Date.now()
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        await this.executeWithRetry(item);
      } catch (error) {
        // Always log retry failures since these are system errors
        console.error('Retry queue execution failed:', error);
        
        // If still has retries left, add back to queue
        if (item.retryCount < this.maxRetries) {
          item.retryCount++;
          this.queue.push(item);
        } else {
          // Max retries reached, show error
          this.showRetryError(item.context);
        }
      }
    }

    this.isProcessing = false;
  }

  async executeWithRetry(item) {
    const delay = this.calculateDelay(item.retryCount);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Execute the request
    await item.requestFunction();
  }

  calculateDelay(retryCount) {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return exponentialDelay + jitter;
  }

  showRetryError(context) {
    toast.error(`Failed to ${context} after multiple attempts. Please try again later.`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }

  clear() {
    this.queue = [];
    this.isProcessing = false;
  }
}

// Global network recovery instance
export const networkRecoveryQueue = new NetworkRecoveryQueue();

// Error parser utility
export const parseError = (error) => {
  if (!error) {
    return {
      message: 'An unknown error occurred',
      category: ERROR_CATEGORIES.UNKNOWN,
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: false
    };
  }

  // Handle different error types
  if (error.response) {
    // Server response error
    const status = error.response.status;
    const data = error.response.data;

    let category = ERROR_CATEGORIES.SERVER;
    let severity = ERROR_SEVERITY.MEDIUM;
    let retryable = false;

    // Categorize by status code
    if (status >= 500) {
      category = ERROR_CATEGORIES.SERVER;
      severity = ERROR_SEVERITY.HIGH;
      retryable = true;
    } else if (status === 401) {
      category = ERROR_CATEGORIES.AUTHENTICATION;
      severity = ERROR_SEVERITY.HIGH;
      retryable = false;
    } else if (status === 403) {
      category = ERROR_CATEGORIES.AUTHORIZATION;
      severity = ERROR_SEVERITY.HIGH;
      retryable = false;
    } else if (status === 422) {
      category = ERROR_CATEGORIES.VALIDATION;
      severity = ERROR_SEVERITY.MEDIUM;
      retryable = false;
    } else if (status >= 400) {
      category = ERROR_CATEGORIES.VALIDATION;
      severity = ERROR_SEVERITY.MEDIUM;
      retryable = false;
    }

    return {
      message: data?.detail || data?.message || `Server error (${status})`,
      category,
      severity,
      retryable,
      status,
      data,
      errors: data?.errors || null
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error - please check your connection',
      category: ERROR_CATEGORIES.NETWORK,
      severity: ERROR_SEVERITY.HIGH,
      retryable: true,
      originalError: error
    };
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      category: ERROR_CATEGORIES.UNKNOWN,
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: false,
      originalError: error
    };
  }
};

// Global error boundary component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Always log error boundary errors since these are critical system errors
    console.error('Error boundary caught an error:', error, errorInfo);

    // Show notification
    ErrorNotificationManager.show({
      message: 'Something went wrong. Please refresh the page.',
      category: ERROR_CATEGORIES.UNKNOWN,
      severity: ERROR_SEVERITY.CRITICAL,
      retryable: false
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          margin: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5'
        }}>
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#8B0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export constants
export { ERROR_CATEGORIES, ERROR_SEVERITY }; 