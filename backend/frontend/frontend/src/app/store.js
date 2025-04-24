import { configureStore } from '@reduxjs/toolkit';
// Import slice reducers here later, e.g.:
import authReducer from '../features/authentication/authSlice';
import healthInfoReducer from '../features/healthInfoSlice';
// import patientsReducer from '../features/patients/patientsSlice';

export const store = configureStore({
  reducer: {
    // Add slice reducers here:
    auth: authReducer,
    healthInfo: healthInfoReducer,
    // patients: patientsReducer,
  },
  // Middleware can be added here if needed (e.g., RTK Query middleware)
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(someApi.middleware),
  // Enable Redux DevTools extension support
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
// (TypeScript types commented out as project seems to be JS for now) 