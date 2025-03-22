import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Grid } from '@mui/material';
import axios from 'axios';

const Dental = () => {
    const [dentalRecords, setDentalRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch dental records
        axios.get('/api/dental-records/')
            .then(response => {
                setDentalRecords(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching dental records:', error);
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
                Dental Records
            </Typography>
            {dentalRecords.length > 0 ? (
                <Grid container spacing={3}>
                    {dentalRecords.map((record, index) => (
                        <Grid item xs={12} md={6} key={index}>
                            <Paper elevation={2} sx={{ p: 2 }}>
                                <Typography variant="h6">
                                    Visit Date: {new Date(record.visit_date).toLocaleDateString()}
                                </Typography>
                                <Typography>
                                    Procedure: {record.procedure}
                                </Typography>
                                <Typography>
                                    Tooth Number: {record.tooth_number}
                                </Typography>
                                <Typography>
                                    Treatment: {record.treatment}
                                </Typography>
                                <Typography>
                                    Notes: {record.notes}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography>No dental records found.</Typography>
            )}
        </Box>
    );
};

export default Dental; 