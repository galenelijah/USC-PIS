import axios from 'axios';

// Consistent token key
const TOKEN_KEY = 'Token';
const USER_KEY = 'user';

// Helper functions for token handling
const getToken = () => localStorage.getItem(TOKEN_KEY);
const saveToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const api = axios.create({
  baseURL: '/api', // Always use relative path!
  headers: {
    'Content-Type': 'application/json',
  },
  // Add withCredentials for CORS
  withCredentials: true
});

// Add request interceptor for authentication
api.interceptors.request.use(request => {
  // Use consistent token name - 'Token' instead of 'token'
  const token = getToken();
  if (token) {
    request.headers.Authorization = `Token ${token}`;
  }
  return request;
}, error => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor for handling HTML responses and authentication
api.interceptors.response.use(
  response => {
    // Check if response contains a token and save it
    if (response.data && response.data.token) {
      saveToken(response.data.token);
    }
    
    // Check if the response is HTML instead of JSON
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('text/html') && !response.config.url.includes('download')) {
      const error = new Error('Received HTML response from server. You may need to log in again.');
      error.response = response;
      return Promise.reject(error);
    }
    
    return response;
  },
  error => {
    // Check for HTML responses in error cases
    if (error.response?.headers?.['content-type']?.includes('text/html')) {
      if (error.response.status === 401 || error.response.status === 403) {
        // Clear token and redirect to login only if not trying to login/register
        if (!error.config.url.includes('/auth/login/') && !error.config.url.includes('/auth/register/')) {
          saveToken(null);
          localStorage.removeItem(USER_KEY);
          window.location.href = '/';
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Error data:', error.response.data);
    console.error('Error status:', error.response.status);
    console.error('Error headers:', error.response.headers);
    
    // Check for HTML responses
    const contentType = error.response.headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML error response');
      // This likely means the session expired or there's a server error
      if (error.response.status === 401 || error.response.status === 403) {
        // Clear token and redirect to login
        saveToken(null);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/';
        return; // Stop execution
      }
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Error request:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error message:', error.message);
  }
  throw error;
};

export const authService = {
  register: async (data) => {
    try {
      console.log('Register API call with data:', data);
      const response = await api.post('/auth/register/', data);
      console.log('Register API response:', response);
      
      // If registration returns a token, save it
      if (response.data && response.data.token) {
        saveToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Register API error:', error);
      // Enhanced error handling
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        throw error;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', error.message);
        throw error;
      }
    }
  },
  login: async (data) => {
    try {
      return await api.post('/auth/login/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  logout: async () => {
    try {
      return await api.post('/auth/logout/');
    } catch (error) {
      handleApiError(error);
    }
  },
  checkEmail: async (email) => {
    try {
      return await api.post('/auth/check-email/', { email });
    } catch (error) {
      handleApiError(error);
    }
  },
  changePassword: async (data) => {
    try {
      return await api.post('/auth/change-password/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  getProfile: async () => {
    try {
      return await api.get('/auth/profile/me/');
    } catch (error) {
      handleApiError(error);
    }
  },
  updateProfile: async (data) => {
    try {
      return await api.patch('/auth/profile/me/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  partialUpdateProfile: async (data) => {
    try {
      return await api.patch('/auth/profile/me/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  getDashboardStats: async () => {
    try {
      console.log('Fetching dashboard stats...');
      // Use the correct endpoint path
      const response = await api.get('/patients/dashboard-stats/', {
        // Explicitly include token in request
        headers: {
          'Authorization': `Token ${getToken()}`
        }
      });
      console.log('Dashboard stats response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      handleApiError(error);
    }
  },
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/password-reset-request/', { email });
    return response.data;
  },
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/password-reset/', { token, password });
    return response.data;
  },
  completeProfileSetup: async (profileData) => {
    try {
      console.log('Calling completeProfileSetup with data:', profileData);
      const response = await api.post('/auth/complete-profile/', profileData);
      console.log('Complete profile API response:', response);
      return response;
    } catch (error) {
      console.error('Complete profile API error:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },
  getDatabaseHealth: async () => {
    try {
      console.log('Fetching database health...');
      const token = localStorage.getItem('Token');
      console.log('Current token:', token);
      
      const response = await api.get('/auth/database-health/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      console.log('Database health response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching database health:', error);
      handleApiError(error);
    }
  },
};

export const patientService = {
  getAll: async () => {
    try {
      return await api.get('/patients/patients/');
    } catch (error) {
      handleApiError(error);
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/patients/patients/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  create: async (data) => {
    try {
      return await api.post('/patients/patients/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/patients/patients/${id}/`, data);
    } catch (error) {
      handleApiError(error);
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/patients/patients/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  search: async (query) => {
    try {
      return await api.get(`/patients/patients/?search=${query}`);
    } catch (error) {
      handleApiError(error);
    }
  },
  getMyMedicalRecords: async () => {
    try {
      return await api.get('/patients/medical-records/');
    } catch (error) {
      handleApiError(error);
    }
  },
};

export const healthInfoService = {
  getAll: async () => {
    try {
      return await api.get('/health-info/health-information/');
    } catch (error) {
      handleApiError(error);
    }
  },
  create: async (data) => {
    try {
      return await api.post('/health-info/health-information/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/health-info/health-information/${id}/`, data);
    } catch (error) {
      handleApiError(error);
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/health-info/health-information/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
};

export const healthRecordsService = {
  getAll: async () => {
    try {
      return await api.get('/patients/medical-records/');
    } catch (error) {
      handleApiError(error);
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/patients/medical-records/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  getByPatient: async (patientId) => {
    try {
      return await api.get(`/patients/${patientId}/medical-records/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  create: async (data) => {
    try {
      return await api.post('/patients/medical-records/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/patients/medical-records/${id}/`, data);
    } catch (error) {
      handleApiError(error);
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/patients/medical-records/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  searchByDate: async (date) => {
    try {
      return await api.get(`/patients/medical-records/?visit_date=${date}`);
    } catch (error) {
      handleApiError(error);
    }
  },
  searchByPatient: async (query) => {
    try {
      return await api.get(`/patients/medical-records/?search=${query}`);
    } catch (error) {
      handleApiError(error);
    }
  },
  searchByType: async (recordType) => {
    try {
      return await api.get(`/patients/medical-records/?record_type=${recordType}`);
    } catch (error) {
      handleApiError(error);
    }
  },
  getDashboardStats: async () => {
    try {
      return await api.get('/patients/medical-records/stats/');
    } catch (error) {
      handleApiError(error);
    }
  },
};

export const feedbackService = {
  submitFeedback: async ({ medical_record, rating, comments, courteous, recommend, improvement }) => {
    try {
      return await api.post('/feedback/', { medical_record, rating, comments, courteous, recommend, improvement });
    } catch (error) {
      handleApiError(error);
    }
  },
  getAll: async () => {
    try {
      return await api.get('/feedback/');
    } catch (error) {
      handleApiError(error);
    }
  },
  getAnalytics: async () => {
    try {
      // Use the configured api instance which includes auth
      return await api.get('/feedback/analytics/');
    } catch (error) {
      handleApiError(error);
    }
  },
  create: async (data) => {
    try {
      return await api.post('/feedback/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
};

// Add fileUploadService
export const fileUploadService = {
  getAll: async () => {
    try {
      return await api.get('/files/uploads/');
    } catch (error) {
      handleApiError(error);
    }
  },
  upload: async (file, description = '') => {
    try {
      const formData = new FormData();
      formData.append('file', file); // The backend expects the file under the key 'file'
      if (description) {
        formData.append('description', description);
      }
      // Make sure headers indicate multipart/form-data
      // Axios usually does this automatically with FormData, but specify if needed
      return await api.post('/files/uploads/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add onUploadProgress listener if needed for progress bars
        /*
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
          // Update progress state here
        }
        */
      });
    } catch (error) {
      handleApiError(error);
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/files/uploads/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
};

export const consultationService = {
  getAll: async () => {
    try {
      return await api.get('/patients/consultations/');
    } catch (error) {
      handleApiError(error);
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/patients/consultations/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  create: async (data) => {
    try {
      return await api.post('/patients/consultations/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/patients/consultations/${id}/`, data);
    } catch (error) {
      handleApiError(error);
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/patients/consultations/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  }
};

export const medicalCertificateService = {
  getAll: async () => {
    try {
      return await api.get('/medical-certificates/certificates/');
    } catch (error) {
      handleApiError(error);
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/medical-certificates/certificates/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  create: async (data) => {
    try {
      return await api.post('/medical-certificates/certificates/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/medical-certificates/certificates/${id}/`, data);
    } catch (error) {
      handleApiError(error);
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/medical-certificates/certificates/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  // Workflow actions
  submit: async (id) => {
    try {
      return await api.post(`/medical-certificates/certificates/${id}/submit/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  approve: async (id) => {
    try {
      return await api.post(`/medical-certificates/certificates/${id}/approve/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  reject: async (id) => {
    try {
      return await api.post(`/medical-certificates/certificates/${id}/reject/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  // Template operations
  getAllTemplates: async () => {
    try {
      return await api.get('/medical-certificates/templates/');
    } catch (error) {
      handleApiError(error);
    }
  },
  getTemplateById: async (id) => {
    try {
      return await api.get(`/medical-certificates/templates/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  createTemplate: async (data) => {
    try {
      return await api.post('/medical-certificates/templates/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  updateTemplate: async (id, data) => {
    try {
      return await api.put(`/medical-certificates/templates/${id}/`, data);
    } catch (error) {
      handleApiError(error);
    }
  },
  deleteTemplate: async (id) => {
    try {
      return await api.delete(`/medical-certificates/templates/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  // Additional helper methods
  getByPatient: async (patientId) => {
    try {
      return await api.get(`/medical-certificates/certificates/?patient=${patientId}`);
    } catch (error) {
      handleApiError(error);
    }
  },
  getByStatus: async (status) => {
    try {
      return await api.get(`/medical-certificates/certificates/?status=${status}`);
    } catch (error) {
      handleApiError(error);
    }
  },
  // Certificate rendering
  renderCertificate: async (id) => {
    try {
      return await api.get(`/medical-certificates/certificates/${id}/render/`);
    } catch (error) {
      handleApiError(error);
    }
  }
};

// Notification Service
export const notificationService = {
  // Get all notifications for current user
  getNotifications: async (params = {}) => {
    try {
      return await api.get('/notifications/notifications/', { params });
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get unread notifications
  getUnreadNotifications: async () => {
    try {
      return await api.get('/notifications/notifications/unread/');
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get notification statistics
  getStats: async () => {
    try {
      return await api.get('/notifications/notifications/stats/');
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get notification by ID
  getById: async (id) => {
    try {
      return await api.get(`/notifications/notifications/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      return await api.post(`/notifications/notifications/${id}/mark_as_read/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      return await api.post('/notifications/notifications/mark_all_as_read/');
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get notification preferences
  getPreferences: async () => {
    try {
      return await api.get('/notifications/preferences/me/');
    } catch (error) {
      handleApiError(error);
    }
  },

  // Update notification preferences
  updatePreferences: async (data) => {
    try {
      return await api.put('/notifications/preferences/me/', data);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Create notification (for medical staff)
  create: async (data) => {
    try {
      return await api.post('/notifications/notifications/', data);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Bulk create notifications
  bulkCreate: async (data) => {
    try {
      return await api.post('/notifications/notifications/bulk_create/', data);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Send test notification
  sendTest: async (data) => {
    try {
      return await api.post('/notifications/notifications/send_test/', data);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get notification templates
  getTemplates: async () => {
    try {
      return await api.get('/notifications/templates/');
    } catch (error) {
      handleApiError(error);
    }
  },

  // Test template rendering
  testTemplate: async (id, context) => {
    try {
      return await api.post(`/notifications/templates/${id}/test/`, { context });
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get campaigns (for medical staff)
  getCampaigns: async () => {
    try {
      return await api.get('/notifications/campaigns/');
    } catch (error) {
      handleApiError(error);
    }
  },

  // Create campaign
  createCampaign: async (data) => {
    try {
      return await api.post('/notifications/campaigns/', data);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Activate campaign
  activateCampaign: async (id) => {
    try {
      return await api.post(`/notifications/campaigns/${id}/activate/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Pause campaign
  pauseCampaign: async (id) => {
    try {
      return await api.post(`/notifications/campaigns/${id}/pause/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Resume campaign
  resumeCampaign: async (id) => {
    try {
      return await api.post(`/notifications/campaigns/${id}/resume/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get notification logs (for medical staff)
  getLogs: async (params = {}) => {
    try {
      return await api.get('/notifications/logs/', { params });
    } catch (error) {
      handleApiError(error);
    }
  }
};

// Dental Records Service
const dentalRecordService = {
  // Get all dental records
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/patients/dental-records/', { params });
      return response;
    } catch (error) {
      console.error('Error fetching dental records:', error);
      throw error;
    }
  },

  // Get dental record by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/patients/dental-records/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching dental record:', error);
      throw error;
    }
  },

  // Create new dental record
  create: async (data) => {
    try {
      const response = await api.post('/patients/dental-records/', data);
      return response;
    } catch (error) {
      console.error('Error creating dental record:', error);
      throw error;
    }
  },

  // Update dental record
  update: async (id, data) => {
    try {
      const response = await api.put(`/patients/dental-records/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating dental record:', error);
      throw error;
    }
  },

  // Partially update dental record
  partialUpdate: async (id, data) => {
    try {
      const response = await api.patch(`/patients/dental-records/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating dental record:', error);
      throw error;
    }
  },

  // Delete dental record
  delete: async (id) => {
    try {
      const response = await api.delete(`/patients/dental-records/${id}/`);
      return response;
    } catch (error) {
      console.error('Error deleting dental record:', error);
      throw error;
    }
  },

  // Get available dental procedures
  getProcedures: async () => {
    try {
      const response = await api.get('/patients/dental-records/procedures/');
      return response;
    } catch (error) {
      console.error('Error fetching dental procedures:', error);
      throw error;
    }
  },

  // Get available tooth conditions
  getToothConditions: async () => {
    try {
      const response = await api.get('/patients/dental-records/tooth_conditions/');
      return response;
    } catch (error) {
      console.error('Error fetching tooth conditions:', error);
      throw error;
    }
  },

  // Get treatment history for a patient
  getTreatmentHistory: async (recordId) => {
    try {
      const response = await api.get(`/patients/dental-records/${recordId}/treatment_history/`);
      return response;
    } catch (error) {
      console.error('Error fetching treatment history:', error);
      throw error;
    }
  },

  // Search dental records with advanced filters
  search: async (searchParams) => {
    try {
      const response = await api.get('/patients/dental-records/', { 
        params: searchParams 
      });
      return response;
    } catch (error) {
      console.error('Error searching dental records:', error);
      throw error;
    }
  }
};

export { dentalRecordService };

// Campaign Services
export const campaignService = {
  // Get all campaigns
  getCampaigns: (params = {}) => {
    return api.get('/health-info/campaigns/', { params });
  },

  // Get campaign by ID
  getCampaign: (id) => {
    return api.get(`/health-info/campaigns/${id}/`);
  },

  // Create campaign
  createCampaign: (data) => {
    return api.post('/health-info/campaigns/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Update campaign
  updateCampaign: (id, data) => {
    return api.put(`/health-info/campaigns/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Delete campaign
  deleteCampaign: (id) => {
    return api.delete(`/health-info/campaigns/${id}/`);
  },

  // Track engagement
  trackEngagement: (id) => {
    return api.post(`/health-info/campaigns/${id}/engage/`);
  },

  // Get campaign resources
  getCampaignResources: (id) => {
    return api.get(`/health-info/campaigns/${id}/resources/`);
  },

  // Upload campaign resource
  uploadCampaignResource: (id, data) => {
    return api.post(`/health-info/campaigns/${id}/upload_resource/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Get campaign feedback
  getCampaignFeedback: (id) => {
    return api.get(`/health-info/campaigns/${id}/feedback/`);
  },

  // Submit campaign feedback
  submitFeedback: (id, data) => {
    return api.post(`/health-info/campaigns/${id}/feedback/`, data);
  },

  // Get campaign analytics
  getAnalytics: () => {
    return api.get('/health-info/campaigns/analytics/');
  },

  // Get featured campaigns
  getFeaturedCampaigns: () => {
    return api.get('/health-info/campaigns/featured/');
  }
};

// Report Services
export const reportService = {
  // Get report templates
  getTemplates: (params = {}) => {
    return api.get('/reports/templates/', { params });
  },

  // Get template by ID
  getTemplate: (id) => {
    return api.get(`/reports/templates/${id}/`);
  },

  // Generate report from template
  generateReport: (templateId, data) => {
    return api.post(`/reports/templates/${templateId}/generate/`, data);
  },

  // Get generated reports
  getReports: (params = {}) => {
    return api.get('/reports/generated/', { params });
  },

  // Get report by ID
  getReport: (id) => {
    return api.get(`/reports/generated/${id}/`);
  },

  // Download report
  downloadReport: (id) => {
    return api.get(`/reports/generated/${id}/download/`, {
      responseType: 'blob'
    });
  },

  // Get report status
  getReportStatus: (id) => {
    return api.get(`/reports/generated/${id}/status/`);
  },

  // Get report dashboard
  getDashboard: () => {
    return api.get('/reports/generated/dashboard/');
  },

  // Report schedules
  getSchedules: (params = {}) => {
    return api.get('/reports/schedules/', { params });
  },

  // Create schedule
  createSchedule: (data) => {
    return api.post('/reports/schedules/', data);
  },

  // Update schedule
  updateSchedule: (id, data) => {
    return api.put(`/reports/schedules/${id}/`, data);
  },

  // Delete schedule
  deleteSchedule: (id) => {
    return api.delete(`/reports/schedules/${id}/`);
  },

  // Run schedule now
  runScheduleNow: (id) => {
    return api.post(`/reports/schedules/${id}/run_now/`);
  },

  // Report bookmarks
  getBookmarks: (params = {}) => {
    return api.get('/reports/bookmarks/', { params });
  },

  // Create bookmark
  createBookmark: (data) => {
    return api.post('/reports/bookmarks/', data);
  },

  // Update bookmark
  updateBookmark: (id, data) => {
    return api.put(`/reports/bookmarks/${id}/`, data);
  },

  // Delete bookmark
  deleteBookmark: (id) => {
    return api.delete(`/reports/bookmarks/${id}/`);
  },

  // Use bookmark
  useBookmark: (id) => {
    return api.post(`/reports/bookmarks/${id}/use/`);
  },

  // Get report analytics
  getReportAnalytics: (params = {}) => {
    return api.get('/reports/analytics/', { params });
  }
};

export default api; 