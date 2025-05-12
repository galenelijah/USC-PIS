import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/api';

// Consistent token key
const TOKEN_KEY = 'Token';
const USER_KEY = 'user';

// Helper functions for localStorage
const saveToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const saveUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

// Load initial state from localStorage
const loadInitialState = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    
    return {
      token: token || null,
      user: user || null,
      isAuthenticated: !!token,
      status: 'idle',
      error: null
    };
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
    return {
      token: null,
      user: null,
      isAuthenticated: false,
      status: 'idle',
      error: null
    };
  }
};

// Create async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      return rejectWithValue(
        error.response?.data?.detail || 
        error.response?.data?.non_field_errors?.[0] || 
        error.message || 
        'Registration failed'
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      return rejectWithValue(
        error.response?.data?.detail || 
        error.response?.data?.non_field_errors?.[0] || 
        error.message || 
        'Login failed'
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      return rejectWithValue(error.message || 'Failed to get profile');
    }
  }
);

// Create the auth slice
const authSlice = createSlice({
  name: 'authentication',
  initialState: loadInitialState(),
  reducers: {
    resetAuthStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      
      // Clear localStorage
      saveToken(null);
      saveUser(null);
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      saveUser(state.user);
    }
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        
        // Save to localStorage
        saveToken(action.payload.token);
        saveUser(action.payload.user);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Registration failed';
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        
        // Clear localStorage
        saveToken(null);
        saveUser(null);
      })
      
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        
        // Save to localStorage
        saveToken(action.payload.token);
        saveUser(action.payload.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        
        // Clear localStorage
        saveToken(null);
        saveUser(null);
      })
      
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        
        // Clear localStorage
        saveToken(null);
        saveUser(null);
      })
      
      // Get profile cases
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        saveUser(action.payload);
      });
  }
});

// Export actions and selectors
export const { resetAuthStatus, logout, updateUser: setCredentials } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthToken = (state) => state.auth.token;

export default authSlice.reducer; 