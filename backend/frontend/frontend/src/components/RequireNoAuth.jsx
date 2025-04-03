import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireNoAuth = ({ children, isAuthenticated }) => {
    if (isAuthenticated) {
        // If the user is authenticated, redirect to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    // If the user is not authenticated, render the children components
    return children;
};

export default RequireNoAuth; 