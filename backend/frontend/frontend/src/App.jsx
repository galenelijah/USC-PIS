import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import PatientList from './components/Patients/PatientList';
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
      <Layout onSearch={handleSearch}>
        <Routes>
          <Route
            path="/"
            element={
              <PatientList
                patients={patients}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            }
          />
          <Route
            path="/patients"
            element={
              <PatientList
                patients={patients}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
