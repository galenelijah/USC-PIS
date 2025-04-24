import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import { authService } from '../services/api';

const RequireProfileSetup = ({ children }) => {
    const user = useSelector(selectCurrentUser);
    const [completeSetup, setCompleteSetup] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileStatus = async () => {
            try {
                // If we already have the user data with completeSetup property
                if (user && user.completeSetup !== undefined) {
                    setCompleteSetup(user.completeSetup);
                    setLoading(false);
                    return;
                }

                // Otherwise, fetch the profile from API
                const response = await authService.getProfile();
                const userProfile = response.data;
                setCompleteSetup(userProfile.completeSetup);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching profile status:', error);
                setLoading(false);
                setCompleteSetup(false); // Default to false on error
            }
        };

        fetchProfileStatus();
    }, [user]);

    if (loading) {
        // You could add a loading spinner here if desired
        return <div>Loading...</div>;
    }

    // Redirect to profile setup if user hasn't completed setup
    return completeSetup ? children : <Navigate to="/profile-setup" replace />;
};

export default RequireProfileSetup; 