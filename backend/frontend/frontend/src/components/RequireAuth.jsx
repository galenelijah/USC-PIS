import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireAuth = ({ children }) => {
    const token = localStorage.getItem('Token');

    if (!token) {
        return <Navigate to="/" />;
    }
    return children;
};

export default RequireAuth; 