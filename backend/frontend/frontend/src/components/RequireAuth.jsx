import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/authentication/authSlice';

const RequireAuth = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return children;
};

export default RequireAuth; 