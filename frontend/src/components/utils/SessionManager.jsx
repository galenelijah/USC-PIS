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
const WARNING_TIMEOUT = 60 * 1000;         // 60 seconds

const SessionManager = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    
    const [showWarning, setShowWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    
    const activityTimeoutRef = useRef(null);
    const warningIntervalRef = useRef(null);

    const handleLogout = useCallback(async () => {
        try {
            // Clear all intervals and timeouts first
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
            if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
            
            // Dispatch logout
            await dispatch(logoutUser());
            dispatch(logout());
            
            setShowWarning(false);
            navigate('/');
        } catch (error) {
            console.error('Auto-logout failed:', error);
            dispatch(logout());
            navigate('/');
        }
    }, [dispatch, navigate]);

    const resetTimer = useCallback(() => {
        if (showWarning) return; // Don't reset if we're already warning

        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        
        activityTimeoutRef.current = setTimeout(() => {
            setShowWarning(true);
            setTimeLeft(60);
            
            warningIntervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(warningIntervalRef.current);
                        handleLogout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, INACTIVITY_TIMEOUT - WARNING_TIMEOUT);
    }, [showWarning, handleLogout]);

    const handleStayLoggedIn = () => {
        setShowWarning(false);
        if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
        resetTimer();
    };

    useEffect(() => {
        if (!isAuthenticated) {
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
            if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
            setShowWarning(false);
            return;
        }

        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
        
        const activityHandler = () => resetTimer();
        
        events.forEach(event => window.addEventListener(event, activityHandler));
        
        // Initial timer setup
        resetTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, activityHandler));
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
            if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
        };
    }, [isAuthenticated, resetTimer]);

    return (
        <Dialog 
            open={showWarning} 
            onClose={handleStayLoggedIn}
            PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
        >
            <DialogTitle sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                Inactivity Warning
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" gutterBottom>
                    Your session is about to expire due to inactivity. 
                    You will be automatically logged out in:
                </Typography>
                <Box sx={{ mt: 3, mb: 1, textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="800" color="error.main">
                        {timeLeft}s
                    </Typography>
                </Box>
                <LinearProgress 
                    variant="determinate" 
                    value={(timeLeft / 60) * 100} 
                    color="error"
                    sx={{ height: 8, borderRadius: 5, mt: 2 }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
                <Button 
                    onClick={handleLogout} 
                    variant="outlined" 
                    color="error"
                    sx={{ borderRadius: '8px', px: 3 }}
                >
                    Logout Now
                </Button>
                <Button 
                    onClick={handleStayLoggedIn} 
                    variant="contained" 
                    color="primary"
                    autoFocus
                    sx={{ borderRadius: '8px', px: 4, bgcolor: '#1e3a8a' }}
                >
                    Stay Logged In
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SessionManager;
