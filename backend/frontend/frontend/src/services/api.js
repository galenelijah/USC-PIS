import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Always use relative path!
  headers: {
    'Content-Type': 'application/json',
  },
  // Add withCredentials for CORS
  withCredentials: true
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  const token = localStorage.getItem('token');
  if (token) {
    request.headers.Authorization = `Token ${token}`;
    console.log('Using token:', token);
  } else {
    console.log('No token found in localStorage');
  }
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Error data:', error.response.data);
    console.error('Error status:', error.response.status);
    console.error('Error headers:', error.response.headers);
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
      return response;
    } catch (error) {
      console.error('Register API error:', error);
      // Enhanced error handling
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        // Return a structured error that can be handled by the thunk
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
      return await api.get('/dashboard/stats/');
    } catch (error) {
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
      return response.data;
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
      const token = localStorage.getItem('token');
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
      return await api.get('/patients/');
    } catch (error) {
      handleApiError(error);
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/patients/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  create: async (data) => {
    try {
      return await api.post('/patients/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/patients/${id}/`, data);
    } catch (error) {
      handleApiError(error);
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/patients/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },
  search: async (query) => {
    try {
      return await api.get(`/patients/?search=${query}`);
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

export default api; 