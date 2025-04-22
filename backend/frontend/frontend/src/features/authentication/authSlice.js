import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/api';

// --- Async Thunk for Login ---
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return { 
        token: response.data.token, 
        user: {
            id: response.data.user_id,
            email: response.data.email,
            role: response.data.role,
            completeSetup: response.data.completeSetup
        }
      };
    } catch (error) {
      const errorData = error.response?.data?.detail || error.message || 'Login failed';
      return rejectWithValue(errorData);
    }
  }
);

// Attempt to load initial state from localStorage
const loadInitialState = () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user')); // Basic user info
    if (token && user) {
      return {
        user: user,
        token: token,
        isAuthenticated: true,
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
      };
    }
  } catch (e) {
    console.error("Could not load auth state from localStorage", e);
    // Fall through to default initial state
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    status: 'idle',
    error: null,
  };
};

const initialState = loadInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.status = 'succeeded';
      state.error = null;
      // Persist basic info to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // Store basic user info
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      // Clear from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    // Reducer for pending state (can be used by async thunks)
    setLoading(state) {
      state.status = 'loading';
    },
    // Reducer for error state (can be used by async thunks)
    setError(state, action) {
      state.status = 'failed';
      state.error = action.payload;
    },
    resetAuthStatus(state) {
        state.status = 'idle';
        state.error = null;
    }
  },
  // Handle actions dispatched by the async thunk
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { user, token } = action.payload;
        state.user = user;
        state.token = token;
        state.isAuthenticated = true;
        state.status = 'succeeded';
        state.error = null;
        // Persist to localStorage (could also be done in fulfilled action)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        // Clear localStorage on failed login attempt?
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  },
});

export const { setCredentials, logout, setLoading, setError, resetAuthStatus } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthToken = (state) => state.auth.token;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer; 