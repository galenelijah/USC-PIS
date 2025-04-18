import axios from 'axios';

// Use production URL when deployed, localhost for development
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://usc-pis-5f030223f7a8.herokuapp.com'
  : 'http://127.0.0.1:8000';

console.log('Current API URL:', API_URL); // Debug log

const api = axios.create({
  baseURL: `${API_URL}/api`,
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
    const response = await api.post('/auth/complete-profile/', profileData);
    return response.data;
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

export default api; 