import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import PatientList from './components/Patients/PatientList';
import Login from './components/Login';
import Register from './components/Register';
import RequireAuth from './components/RequireAuth';
import RequireNoAuth from './components/RequireNoAuth';
import StudentRecords from './components/StudentRecords';
import Medical from './components/Medical';
import Dental from './components/Dental';
import { useState, useEffect } from 'react';
import { patientService } from './services/api';

function App() {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <RequireNoAuth>
              <Login />
            </RequireNoAuth>
          }
        />
        <Route
          path="/register"
          element={
            <RequireNoAuth>
              <Register />
            </RequireNoAuth>
          }
        />

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <RequireAuth>
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
          path="/patients"
          element={
            <RequireAuth>
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
            <RequireAuth>
              <Layout onSearch={handleSearch}>
                <StudentRecords />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/medical/:id"
          element={
            <RequireAuth>
              <Layout onSearch={handleSearch}>
                <Medical />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/dental/:id"
          element={
            <RequireAuth>
              <Layout onSearch={handleSearch}>
                <Dental />
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
