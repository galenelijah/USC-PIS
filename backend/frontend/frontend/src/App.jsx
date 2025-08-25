import React, { useEffect, useState, Suspense, lazy, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, logout } from './features/authentication/authSlice';
import { patientService } from './services/api';
import { useParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Eager loading for critical components
import Layout from './components/Layout/Layout';
import RequireAuth from './components/RequireAuth';
import RequireNoAuth from './components/RequireNoAuth';
import RequireProfileSetup from './components/RequireProfileSetup';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import Register from './components/Register';

// Lazy loading for non-critical components
const PatientsPage = lazy(() => import('./components/Patients/PatientsPage'));
const Profile = lazy(() => import('./components/Profile'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const StudentRecords = lazy(() => import('./components/StudentRecords'));
const Medical = lazy(() => import('./components/Medical'));
const Dental = lazy(() => import('./components/Dental'));
const PasswordResetRequest = lazy(() => import('./components/PasswordResetRequest'));
const PasswordReset = lazy(() => import('./components/PasswordReset'));
const ProfileSetup = lazy(() => import('./components/ProfileSetup'));
const DatabaseMonitor = lazy(() => import('./components/DatabaseMonitor'));
const EmailAdministration = lazy(() => import('./components/EmailAdministration'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const HealthInfo = lazy(() => import('./components/HealthInfo/HealthInfo'));
const HealthRecords = lazy(() => import('./components/HealthRecords'));
const StudentHealthRecords = lazy(() => import('./components/StudentHealthRecords'));
const ConsultationHistory = lazy(() => import('./components/ConsultationHistory'));
const Notifications = lazy(() => import('./components/Notifications'));
const Campaigns = lazy(() => import('./components/Campaigns'));
const Reports = lazy(() => import('./components/Reports'));
const FeedbackForm = lazy(() => import('./components/FeedbackForm'));
const FeedbackSelector = lazy(() => import('./components/FeedbackSelector'));
const AdminFeedbackList = lazy(() => import('./components/AdminFeedbackList'));
const FileUploadPage = lazy(() => import('./pages/FileUploadPage'));
const FileDownloadPage = lazy(() => import('./pages/FileDownloadPage'));
const MedicalCertificatesPage = lazy(() => import('./pages/MedicalCertificatesPage'));
const MedicalHistoryPage = lazy(() => import('./components/MedicalHistoryPage'));
const MedicalRecordsPage = lazy(() => import('./components/MedicalRecordsPage'));
const PatientMedicalDashboard = lazy(() => import('./components/PatientMedicalDashboard'));
const EditProfile = lazy(() => import('./components/EditProfile'));

// Loading component
const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
);

const App = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const [patients, setPatients] = useState([]);

  // Memoized user role checks
  const userRoles = useMemo(() => ({
    isAdminOrStaff: !!user && ['ADMIN', 'STAFF'].includes(user.role),
    isAdminOrStaffOrDoctor: !!user && ['ADMIN', 'STAFF', 'DOCTOR'].includes(user.role),
    isDoctor: !!user && user.role === 'DOCTOR',
    isNurse: !!user && user.role === 'NURSE',
    isStudent: !!user && user.role === 'STUDENT'
  }), [user]);

  const loadPatients = useCallback(async () => {
    try {
      const response = await patientService.getAll();
      if (response && response.data && Array.isArray(response.data)) {
        setPatients(response.data);
      } else {
        console.warn('PatientService.getAll() did not return an array in response.data. Response:', response);
        setPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]);
      if (error.response?.status === 401) {
        dispatch(logout());
      }
    }
  }, [dispatch]);


  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPatients();
    }
  }, [isAuthenticated, loadPatients]);

  function FeedbackFormWrapper() {
    const { medicalRecordId } = useParams();
    return <FeedbackForm medicalRecordId={medicalRecordId} />;
  }

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <RequireNoAuth isAuthenticated={isAuthenticated}>
                <Login />
              </RequireNoAuth>
            }
          />
          <Route
            path="/register"
            element={
              <RequireNoAuth isAuthenticated={isAuthenticated}>
                <Register />
              </RequireNoAuth>
            }
          />
          <Route 
            path="/password-reset-request" 
            element={
              <RequireNoAuth isAuthenticated={isAuthenticated}>
                <Suspense fallback={<PageLoader />}>
                  <PasswordResetRequest />
                </Suspense>
              </RequireNoAuth>
            } 
          />
          <Route 
            path="/password-reset/:token" 
            element={
              <RequireNoAuth isAuthenticated={isAuthenticated}>
                <Suspense fallback={<PageLoader />}>
                  <PasswordReset />
                </Suspense>
              </RequireNoAuth>
            } 
          />

          {/* Profile Setup Route - Only for users who need to complete profile */}
          <Route 
            path="/profile-setup" 
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <Suspense fallback={<PageLoader />}>
                  <ProfileSetup />
                </Suspense>
              </RequireAuth>
            } 
          />
          
          {/* Protected Routes - No profile setup enforcement */}
          <Route
            path="/home"
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard user={user} />
                  </Suspense>
                </Layout>
              </RequireAuth>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/database-monitor"
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                {userRoles.isAdminOrStaffOrDoctor ? (
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <DatabaseMonitor />
                    </Suspense>
                  </Layout>
                ) : (
                  <Navigate to="/home" replace />
                )}
              </RequireAuth>
            }
          />
          
          <Route
            path="/email-administration"
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                {userRoles.isAdminOrStaffOrDoctor ? (
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <EmailAdministration />
                    </Suspense>
                  </Layout>
                ) : (
                  <Navigate to="/home" replace />
                )}
              </RequireAuth>
            }
          />
          
          <Route
            path="/user-management"
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                {user?.role === 'ADMIN' ? (
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <UserManagement />
                    </Suspense>
                  </Layout>
                ) : (
                  <Navigate to="/home" replace />
                )}
              </RequireAuth>
            }
          />

          {/* Healthcare Staff Routes */}
          <Route
            path="/patients"
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <RequireProfileSetup>
                  {userRoles.isAdminOrStaff || userRoles.isDoctor || userRoles.isNurse ? (
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <PatientsPage initialPatients={patients} />
                      </Suspense>
                    </Layout>
                  ) : (
                    <Navigate to="/home" replace />
                  )}
                </RequireProfileSetup>
              </RequireAuth>
            }
          />
        
          <Route
            path="/health-info"
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <RequireProfileSetup>
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <HealthInfo />
                    </Suspense>
                  </Layout>
                </RequireProfileSetup>
              </RequireAuth>
            }
          />

          <Route
            path="/campaigns"
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <RequireProfileSetup>
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <Campaigns />
                    </Suspense>
                  </Layout>
                </RequireProfileSetup>
              </RequireAuth>
            }
          />

          <Route
            path="/students"
            element={
              <RequireAuth isAuthenticated={isAuthenticated}>
                <RequireProfileSetup>
                  {userRoles.isAdminOrStaff || userRoles.isDoctor || userRoles.isNurse ? (
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <StudentRecords />
                      </Suspense>
                    </Layout>
                  ) : (
                    <Navigate to="/home" replace />
                  )}
                </RequireProfileSetup>
              </RequireAuth>
            }
          />
        
        {/* Health Records Route - Role-based access */}
        <Route
          path="/health-records"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    {userRoles.isStudent ? (
                      <StudentHealthRecords />
                    ) : (
                      <HealthRecords />
                    )}
                  </Suspense>
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Dental Records Route */}
        <Route
          path="/dental-records"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <Dental />
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Consultations Route */}
        <Route
          path="/consultations"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <ConsultationHistory />
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Medical Record Routes */}
        <Route
          path="/medical/:id"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                {!userRoles.isStudent ? (
                  <Layout>
                    <Medical />
                  </Layout>
                ) : (
                  <Navigate to="/home" replace />
                )}
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        <Route
          path="/dental/:id"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                {!userRoles.isStudent ? (
                  <Layout>
                    <Dental />
                  </Layout>
                ) : (
                  <Navigate to="/home" replace />
                )}
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* User Profile Route - Available to all authenticated users */}
        <Route
          path="/profile"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <Profile />
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Edit Profile Route - Available to all authenticated users */}
        <Route
          path="/edit-profile"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Suspense fallback={<PageLoader />}>
                  <EditProfile />
                </Suspense>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Notifications Route - Available to all authenticated users */}
        <Route
          path="/notifications"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <ErrorBoundary>
                  <Layout>
                    <Notifications />
                  </Layout>
                </ErrorBoundary>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Feedback Selector Route - lists visits and general feedback option */}
        <Route
          path="/feedback"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <FeedbackSelector />
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        {/* General Feedback Form Route */}
        <Route
          path="/feedback/general"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <FeedbackForm medicalRecordId="general" />
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Specific Feedback Form Route */}
        <Route
          path="/feedback/:medicalRecordId"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <FeedbackFormWrapper />
                  </Suspense>
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Admin Feedback Route - only for admin/staff */}
        <Route
          path="/admin-feedback"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                {userRoles.isAdminOrStaffOrDoctor ? (
                  <Layout>
                    <AdminFeedbackList />
                  </Layout>
                ) : (
                  <Navigate to="/home" replace />
                )}
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* File Upload Route - Available to all authenticated users with completed profile */}
        <Route
          path="/uploads"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <FileUploadPage />
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* File Download Route - Available to all authenticated users with completed profile */}
        <Route
          path="/downloads"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <FileDownloadPage />
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Medical Certificates Route */}
        <Route
          path="/medical-certificates"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                {userRoles.isAdminOrStaff || userRoles.isDoctor || userRoles.isNurse || userRoles.isStudent ? (
                  <Layout>
                    <MedicalCertificatesPage />
                  </Layout>
                ) : (
                  <Navigate to="/home" replace />
                )}
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Medical Records Route - Enhanced Tabbed Interface */}
        <Route
          path="/medical-records"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <MedicalRecordsPage />
                  </Suspense>
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Medical History Route - Timeline View */}
        <Route
          path="/medical-history"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <MedicalHistoryPage />
                  </Suspense>
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Patient Medical Dashboard Route */}
        <Route
          path="/patient-dashboard"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <PatientMedicalDashboard />
                  </Suspense>
                </Layout>
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Reports */}
        <Route
          path="/reports"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                {userRoles.isAdminOrStaff || userRoles.isDoctor || userRoles.isNurse ? (
                  <Layout>
                    <Reports />
                  </Layout>
                ) : (
                  <Navigate to="/home" replace />
                )}
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
          {/* Fallback Route */}
          <Route 
            path="*" 
            element={
              isAuthenticated ? 
                <Navigate to="/home" replace /> : 
                <Navigate to="/" replace />
            } 
          />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
