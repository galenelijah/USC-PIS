import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireNoAuth = ({ children }) => {
    const token = localStorage.getItem('Token');

    if (token) {
        // If the user is authenticated, redirect to home
        return <Navigate to="/home" />;
    }

    // If the user is not authenticated, render the children components
    return children;
};

export default RequireNoAuth; 