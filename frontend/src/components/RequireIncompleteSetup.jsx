import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import { authService } from '../services/api';

const RequireIncompleteSetup = ({ children }) => {
    return children;
};

export default RequireIncompleteSetup; 