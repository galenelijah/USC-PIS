import axios from 'axios';

// Use production URL when deployed, localhost for development
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://usc-pis.herokuapp.com/api'
  : 'http://localhost:8000/api';

console.log('API URL:', API_URL); // Debug log

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add withCredentials for CORS
  withCredentials: true
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
      console.log('Using token:', token);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('Response from:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    console.error('Server error:', error.response.data);
    throw error;
  } else if (error.request) {
    // Request made but no response
    console.error('Network error:', error.message);
    throw new Error('Network error. Please check your connection.');
  } else {
    // Error in request setup
    console.error('Request setup error:', error.message);
    throw error;
  }
};

export const authService = {
  register: async (data) => {
    try {
      return await api.post('/auth/register/', data);
    } catch (error) {
      handleApiError(error);
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
      return await api.get('/auth/profile/');
    } catch (error) {
      handleApiError(error);
    }
  },
  updateProfile: async (data) => {
    try {
      return await api.put('/auth/profile/', data);
    } catch (error) {
      handleApiError(error);
    }
  },
  partialUpdateProfile: async (data) => {
    try {
      return await api.patch('/auth/profile/', data);
    } catch (error) {
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

export default api; 