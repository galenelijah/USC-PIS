import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '../features/authentication/authSlice';

const RequireVerification = ({ children }) => {
    const user = useSelector(selectCurrentUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Superusers are exempt from verification
    if (user && !user.is_verified && !user.is_superuser) {
        return <Navigate to="/verify-email" state={{ from: location }} replace />;
    }

    return children;
};

export default RequireVerification;
