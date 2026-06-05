import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    LinearProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, logoutUser, selectIsAuthenticated } from '../../features/authentication/authSlice';

// Timeouts in milliseconds
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const SessionManager = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    
    const [isExpired, setIsExpired] = useState(false);
    const activityTimeoutRef = useRef(null);

    const handleAutoLogout = useCallback(async () => {
        try {
            // Clear timeout
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
            
            // Dispatch logout actions immediately for security
            await dispatch(logoutUser());
            dispatch(logout());
            
            // Show the expiration message
            setIsExpired(true);
        } catch (error) {
            console.error('Auto-logout failed:', error);
            dispatch(logout());
            setIsExpired(true);
        }
    }, [dispatch]);

    const resetTimer = useCallback(() => {
        if (isExpired) return; 

        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        
        activityTimeoutRef.current = setTimeout(() => {
            handleAutoLogout();
        }, INACTIVITY_TIMEOUT);
    }, [isExpired, handleAutoLogout]);

    const handleRedirectToLogin = () => {
        setIsExpired(false);
        navigate('/');
    };

    useEffect(() => {
        if (!isAuthenticated) {
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
            // Don't clear isExpired here, we want the modal to stay until they click login
            return;
        }

        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
        const activityHandler = () => resetTimer();
        
        events.forEach(event => window.addEventListener(event, activityHandler));
        resetTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, activityHandler));
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        };
    }, [isAuthenticated, resetTimer]);

    return (
        <Dialog 
            open={isExpired} 
            onClose={handleRedirectToLogin}
            PaperProps={{ sx: { borderRadius: '12px', p: 1, maxWidth: '400px' } }}
        >
            <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f', textAlign: 'center' }}>
                Session Expired
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center' }}>
                <Typography variant="body1" gutterBottom>
                    You have been automatically logged out due to 30 minutes of inactivity. 
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Please login again to continue accessing the system.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
                <Button 
                    onClick={handleRedirectToLogin} 
                    variant="contained" 
                    color="primary"
                    fullWidth
                    sx={{ borderRadius: '8px', py: 1.5, bgcolor: '#1e3a8a' }}
                >
                    Login Again
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SessionManager;
