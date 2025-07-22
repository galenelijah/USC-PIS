import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectAuthToken, setCredentials } from '../features/authentication/authSlice';
import { authService } from '../services/api';
import { CircularProgress, Box, Typography } from '@mui/material';

const RequireProfileSetup = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const user = useSelector(selectCurrentUser);
    const token = useSelector(selectAuthToken);
    const dispatch = useDispatch();

    useEffect(() => {
        const checkProfileStatus = async () => {
            try {
                setLoading(true);
                setError(null);

                // If no user or token, let RequireAuth handle it
                if (!user || !token) {
                    setLoading(false);
                    return;
                }

                // Check if user has completed profile setup
                if (!user.completeSetup) {
                    // Try to fetch updated user data to ensure we have the latest status
                    try {
                        const response = await authService.getCurrentUser();
                        if (response.data) {
                            dispatch(setCredentials({
                                user: response.data,
                                token: token
                            }));
                            
                            // Check again after refresh
                            if (!response.data.completeSetup) {
                                setLoading(false);
                                return;
                            }
                        }
                    } catch (refreshError) {
                        // If we can't refresh user data, proceed with what we have
                        logger.warn('Could not refresh user data:', refreshError);
                    }
                }

                setLoading(false);
            } catch (err) {
                logger.error('Error checking profile setup status:', err);
                setError('Unable to verify profile setup status');
                setLoading(false);
            }
        };

        checkProfileStatus();
    }, [user, token, dispatch]);

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Checking profile status...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
                <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Please refresh the page or contact support if the issue persists.
                </Typography>
            </Box>
        );
    }

    // If user hasn't completed profile setup, redirect to profile setup
    if (user && !user.completeSetup) {
        return <Navigate to="/profile-setup" replace />;
    }

    // If profile is complete or user is not available (RequireAuth will handle), show children
    return children;
};

export default RequireProfileSetup; 