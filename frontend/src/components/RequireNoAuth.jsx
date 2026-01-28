import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/authentication/authSlice';

const RequireNoAuth = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (isAuthenticated) {
        // If user is authenticated, redirect them away from public-only pages (like login/register)
        // Redirect to home page or dashboard
        return <Navigate to="/home" replace />;
    }
    return children; // Render children (Login, Register page) if not authenticated
};

export default RequireNoAuth; 