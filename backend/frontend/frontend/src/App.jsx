import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, logout } from './features/authentication/authSlice';
import Layout from './components/Layout/Layout';
import PatientList from './components/Patients/PatientList';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import RequireAuth from './components/RequireAuth';
import RequireNoAuth from './components/RequireNoAuth';
import RequireProfileSetup from './components/RequireProfileSetup';
import RequireIncompleteSetup from './components/RequireIncompleteSetup';
import Dashboard from './components/Dashboard';
import StudentRecords from './components/StudentRecords';
import Medical from './components/Medical';
import Dental from './components/Dental';
import PasswordResetRequest from './components/PasswordResetRequest';
import PasswordReset from './components/PasswordReset';
import ProfileSetup from './components/ProfileSetup';
import DatabaseMonitor from './components/DatabaseMonitor';
import HealthInfo from './components/HealthInfo/HealthInfo';
import HealthRecords from './components/HealthRecords';
import ConsultationHistory from './components/ConsultationHistory';
import { patientService } from './services/api';
import FeedbackForm from './components/FeedbackForm';
import { useParams } from 'react-router-dom';
import FeedbackSelector from './components/FeedbackSelector';
import AdminFeedbackList from './components/AdminFeedbackList';
import FileUploadPage from './pages/FileUploadPage';
import FileDownloadPage from './pages/FileDownloadPage';
import MedicalCertificatesPage from './pages/MedicalCertificatesPage';

const App = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadPatients();
    }
  }, [isAuthenticated]);

  const loadPatients = async () => {
    try {
      const response = await patientService.getAll();
      if (response && response.data && Array.isArray(response.data)) {
        setPatients(response.data);
      } else {
        console.warn('PatientService.getAll() did not return an array in response.data. Response:', response);
        setPatients([]); // Default to an empty array
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]); // Ensure patients is an array on error
      if (error.response?.status === 401) {
        dispatch(logout());
      }
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    try {
      const response = await patientService.search(query);
      if (response && response.data && Array.isArray(response.data)) {
        setPatients(response.data);
      } else {
        console.warn('PatientService.search() did not return an array in response.data. Response:', response);
        setPatients([]); // Default to an empty array
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatients([]); // Ensure patients is an array on error
    }
  };

  const handleEdit = (patient) => {
    // console.log('Edit patient:', patient); // Removed log
    // Implement actual edit logic, maybe navigate to an edit page?
    // Example: navigate(`/patients/${patient.id}/edit`);
    alert(`Edit functionality for patient ${patient.id} not yet implemented.`);
  };

  const handleDelete = async (id) => {
    try {
      await patientService.delete(id);
      loadPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  // Check roles safely - ensure user exists before accessing role
  const isAdminOrStaff = !!user && ['ADMIN', 'STAFF'].includes(user.role);
  const isDoctor = !!user && user.role === 'DOCTOR';
  const isNurse = !!user && user.role === 'NURSE';
  const isStudent = !!user && user.role === 'STUDENT';

  function FeedbackFormWrapper() {
    const { medicalRecordId } = useParams();
    return <FeedbackForm medicalRecordId={medicalRecordId} />;
  }

  return (
    <Router>
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
              <PasswordResetRequest />
            </RequireNoAuth>
          } 
        />
        <Route 
          path="/password-reset/:token" 
          element={
            <RequireNoAuth isAuthenticated={isAuthenticated}>
              <PasswordReset />
            </RequireNoAuth>
          } 
        />

        {/* Profile Setup Route - Only for users who need to complete profile */}
        <Route 
          path="/profile-setup" 
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <ProfileSetup />
            </RequireAuth>
          } 
        />
        
        {/* Protected Routes - No profile setup enforcement */}
        <Route
          path="/home"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Layout onSearch={handleSearch}>
                <Dashboard user={user} />
              </Layout>
            </RequireAuth>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/database-monitor"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              {isAdminOrStaff ? (
                <Layout onSearch={handleSearch}>
                  <DatabaseMonitor />
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
                {isAdminOrStaff || isDoctor || isNurse ? (
                  <Layout onSearch={handleSearch}>
                    <PatientList
                      patients={patients}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
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
                <Layout onSearch={handleSearch}>
                  <HealthInfo canEdit={isAdminOrStaff || isDoctor || isNurse} />
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
                {isAdminOrStaff || isDoctor || isNurse ? (
                  <Layout onSearch={handleSearch}>
                    <StudentRecords />
                  </Layout>
                ) : (
                  <Navigate to="/home" replace />
                )}
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        
        {/* Health Records Route */}
        <Route
          path="/health-records"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <RequireProfileSetup>
                <Layout onSearch={handleSearch}>
                  <HealthRecords />
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
                <Layout onSearch={handleSearch}>
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
                {!isStudent ? (
                  <Layout onSearch={handleSearch}>
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
                {!isStudent ? (
                  <Layout onSearch={handleSearch}>
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
                <Layout onSearch={handleSearch}>
                  <Profile />
                </Layout>
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
                <Layout onSearch={handleSearch}>
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
                <Layout onSearch={handleSearch}>
                  <FeedbackForm medicalRecordId="general" />
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
                {isAdminOrStaff ? (
                  <Layout onSearch={handleSearch}>
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
                {isAdminOrStaff || isDoctor || isNurse ? (
                  <Layout onSearch={handleSearch}>
                    <MedicalCertificatesPage />
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
    </Router>
  );
};

export default App;
