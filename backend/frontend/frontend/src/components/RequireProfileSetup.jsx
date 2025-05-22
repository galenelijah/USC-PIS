import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectAuthToken, setCredentials } from '../features/authentication/authSlice';
import { authService } from '../services/api';
import { CircularProgress, Box, Typography } from '@mui/material';

const RequireProfileSetup = ({ children }) => {
    return children;
};

export default RequireProfileSetup; 