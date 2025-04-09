import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert } from '@mui/material';
import { authService } from '../services/api';

const DatabaseMonitor = () => {
    const [dbData, setDbData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDbHealth = async () => {
            try {
                setLoading(true);
                const response = await authService.getDatabaseHealth();
                setDbData(response);
                setError(null);
            } catch (err) {
                console.error('Error fetching database health:', err);
                setError('Failed to fetch database health information');
            } finally {
                setLoading(false);
            }
        };

        fetchDbHealth();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Database Health Monitor</Typography>
            
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Database Status</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" sx={{ mr: 1 }}>Status:</Typography>
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            color: dbData?.status === 'healthy' ? 'green' : 'red',
                            fontWeight: 'bold'
                        }}
                    >
                        {dbData?.status?.toUpperCase() || 'UNKNOWN'}
                    </Typography>
                </Box>
                <Typography variant="body1">Database Size: {dbData?.database_size || 'Unknown'}</Typography>
                <Typography variant="body1">Active Connections: {dbData?.connection_count || 'Unknown'}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Tables</Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Table Name</TableCell>
                                <TableCell align="right">Columns</TableCell>
                                <TableCell align="right">Rows</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {dbData?.tables?.map((table, index) => (
                                <TableRow key={index}>
                                    <TableCell component="th" scope="row">{table.name}</TableCell>
                                    <TableCell align="right">{table.columns}</TableCell>
                                    <TableCell align="right">{table.rows}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default DatabaseMonitor; 