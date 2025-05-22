import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectAuthToken, setCredentials } from '../features/authentication/authSlice';
import { authService } from '../services/api';
import { CircularProgress, Box, Typography } from '@mui/material';

const RequireProfileSetup = ({ children }) => {
    const user = useSelector(selectCurrentUser);
    const token = useSelector(selectAuthToken);
    const dispatch = useDispatch();
    const [completeSetup, setCompleteSetup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfileStatus = async () => {
            try {
                setError(null);
                
                // Case 1: We have user data with completeSetup property
                if (user?.completeSetup !== undefined) {
                    console.log('Using cached user profile status:', user.completeSetup);
                    setCompleteSetup(user.completeSetup);
                    setLoading(false);
                    return;
                }

                // Case 2: Need to fetch profile from API
                console.log('Fetching profile status from API...');
                const response = await authService.getProfile();
                
                if (response?.data) {
                    const userProfile = response.data;
                    console.log('Received profile data:', userProfile);
                    
                    // Update Redux with the latest user data
                    if (token) {
                        dispatch(setCredentials({ 
                            user: userProfile,
                            token: token
                        }));
                    }
                    
                    setCompleteSetup(userProfile.completeSetup);
                } else {
                    console.error('Invalid profile response:', response);
                    setError('Failed to get profile data');
                    setCompleteSetup(false);
                }
            } catch (error) {
                console.error('Error fetching profile status:', error);
                setError(error.message || 'Failed to check profile status');
                setCompleteSetup(false); // Default to false on error
            } finally {
                setLoading(false);
            }
        };

        if (user || token) {
            fetchProfileStatus();
        } else {
            // No user or token, treat as incomplete setup
            setCompleteSetup(false);
            setLoading(false);
        }
    }, [user, token, dispatch]);

    if (loading) {
        return (
            <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                minHeight="100vh"
            >
                <CircularProgress />
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Checking profile status...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                minHeight="100vh"
            >
                <Typography color="error" variant="body1">
                    {error}
                </Typography>
            </Box>
        );
    }

    // Redirect to profile setup if user hasn't completed setup
    return completeSetup ? children : <Navigate to="/profile-setup" replace />;
};

export default RequireProfileSetup; 