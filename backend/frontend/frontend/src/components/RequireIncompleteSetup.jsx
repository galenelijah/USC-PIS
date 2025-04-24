import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import { authService } from '../services/api';

const RequireIncompleteSetup = ({ children }) => {
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
                setCompleteSetup(true); // Default to true on error, safer to redirect to home
            }
        };

        fetchProfileStatus();
    }, [user]);

    if (loading) {
        return <div>Loading...</div>;
    }

    // Show children if profile setup is incomplete, redirect to home otherwise
    return completeSetup ? <Navigate to="/home" replace /> : children;
};

export default RequireIncompleteSetup; 