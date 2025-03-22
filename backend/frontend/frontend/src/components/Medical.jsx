import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';

const Medical = () => {
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch medical records
        axios.get('/api/medical-records/')
            .then(response => {
                setMedicalRecords(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching medical records:', error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Medical Records
            </Typography>
            {medicalRecords.length > 0 ? (
                medicalRecords.map((record, index) => (
                    <Paper key={index} elevation={2} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6">
                            Visit Date: {new Date(record.visit_date).toLocaleDateString()}
                        </Typography>
                        <Typography>
                            Diagnosis: {record.diagnosis}
                        </Typography>
                        <Typography>
                            Treatment: {record.treatment}
                        </Typography>
                        <Typography>
                            Notes: {record.notes}
                        </Typography>
                    </Paper>
                ))
            ) : (
                <Typography>No medical records found.</Typography>
            )}
        </Box>
    );
};

export default Medical; 