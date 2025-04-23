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
import Dashboard from './components/Dashboard';
import StudentRecords from './components/StudentRecords';
import Medical from './components/Medical';
import Dental from './components/Dental';
import PasswordResetRequest from './components/PasswordResetRequest';
import PasswordReset from './components/PasswordReset';
import ProfileSetup from './components/ProfileSetup';
import DatabaseMonitor from './components/DatabaseMonitor';
import HealthInfo from './components/HealthInfo/HealthInfo';
import { patientService } from './services/api';

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
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
      if (error.response?.status === 401) {
        dispatch(logout());
      }
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    try {
      const response = await patientService.search(query);
      setPatients(response.data);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handleEdit = (patient) => {
    console.log('Edit patient:', patient);
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

  return (
    <Router>
      <Routes>
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
          path="/home"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Layout onSearch={handleSearch}>
                <Dashboard user={user} />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/patients"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Layout onSearch={handleSearch}>
                <PatientList
                  patients={patients}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/students"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Layout onSearch={handleSearch}>
                <StudentRecords />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/medical/:id"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Layout onSearch={handleSearch}>
                <Medical />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/dental/:id"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Layout onSearch={handleSearch}>
                <Dental />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Profile />
            </RequireAuth>
          }
        />
        <Route path="/password-reset-request" element={
          <RequireNoAuth isAuthenticated={isAuthenticated}>
            <PasswordResetRequest />
          </RequireNoAuth>
        } />
        <Route path="/password-reset/:token" element={
          <RequireNoAuth isAuthenticated={isAuthenticated}>
            <PasswordReset />
          </RequireNoAuth>
        } />
        <Route path="/profile-setup" element={
          <RequireAuth isAuthenticated={isAuthenticated}>
            <ProfileSetup />
          </RequireAuth>
        } />
        <Route path="/database-monitor" element={
          <RequireAuth isAuthenticated={isAuthenticated}>
            <DatabaseMonitor />
          </RequireAuth>
        } />
        <Route path="/health-info" element={
          <RequireAuth isAuthenticated={isAuthenticated}>
            <Layout onSearch={handleSearch}>
              <HealthInfo />
            </Layout>
          </RequireAuth>
        } />
        <Route 
            path="*" 
            element={isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
};

export default App;
