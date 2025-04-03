import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { useState, useEffect } from 'react';
import { patientService, authService } from './services/api';

function App() {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
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
    // TODO: Implement edit functionality
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

  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
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

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Layout onSearch={handleSearch}>
                <Dashboard user={user} onLogout={handleLogout} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
