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

// --- Async Thunk for Registration ---
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    // userData contains all fields from the registration form
    try {
      const response = await authService.register(userData);
      // Assuming backend returns success message or created user data (without token)
      return response.data; 
    } catch (error) {
      // Handle validation errors (400) or other errors (500)
      const errorData = error.response?.data || { detail: error.message || 'Registration failed' };
      return rejectWithValue(errorData);
    }
  }
);

// --- Async Thunk for Logout ---
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    // No arguments needed, token is sent via interceptor
    try {
      await authService.logout();
      // No data needed on success, the reducer handles state clearing
      return; 
    } catch (error) {
      // Even if backend logout fails, we still clear frontend state.
      // Log the error, but don't necessarily block logout.
      console.error("Backend logout failed:", error);
      // Optionally return error if needed elsewhere
      const errorData = error.response?.data?.detail || error.message || 'Logout failed on server';
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
      })
      // Handle logout thunk lifecycle (optional, as main logic is sync)
      .addCase(logoutUser.pending, (state) => {
          // Optionally set status to loading during backend call
          // state.status = 'loading'; 
      })
      .addCase(logoutUser.fulfilled, (state) => {
          // Clear state using the existing logout reducer logic
          // Note: Calling reducers directly isn't standard, 
          // better to duplicate the logic or rely on component dispatching sync logout
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.status = 'idle';
          state.error = null;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          console.log("Logout fulfilled, state cleared.")
      })
      .addCase(logoutUser.rejected, (state, action) => {
          // Still log out frontend even if backend call fails
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.status = 'idle'; // Or 'failed' depending on desired UX
          state.error = action.payload; // Store backend error if needed
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          console.error("Logout rejected but frontend state cleared. Error:", action.payload)
      })
      // Registration cases
      .addCase(registerUser.pending, (state) => {
          state.status = 'loading';
          state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
          state.status = 'succeeded'; // Indicate success, but don't log in
          state.error = null;
          // Optionally store success message or data: state.registrationResult = action.payload;
          console.log("Registration successful:", action.payload)
      })
      .addCase(registerUser.rejected, (state, action) => {
          state.status = 'failed';
          // action.payload might contain specific field errors from backend validation
          state.error = action.payload; 
          console.error("Registration failed:", action.payload)
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