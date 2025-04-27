import React, { useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import MyTextField from './forms/MyTextField';
import MyButton from './forms/MyButton';
import { useForm } from 'react-hook-form';
import { authService } from '../services/api';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email address').required('Email is required'),
});

const PasswordResetRequest = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { handleSubmit, control, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: { email: '' }
    });

    const submission = async (data) => {
        setLoading(true);
        setMessage('');
        setError('');
        try {
            await authService.requestPasswordReset(data.email);
            setMessage('If an account with that email exists, instructions to reset your password have been sent.');
        } catch (err) {
            console.error('Password reset request error:', err);
            // Show generic message for security
            setMessage('If an account with that email exists, instructions to reset your password have been sent.');
            // setError(err.response?.data?.detail || 'Failed to request password reset. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="myBackground">
            <Box className="loginBox">
                <Box className="itemBox">
                    <Typography variant="h5" className="title">Reset Password</Typography>
                    <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, mb: 2, color: 'text.secondary' }}>
                        Enter your email address and we'll send you instructions to reset your password.
                    </Typography>
                </Box>

                {message && <Alert severity="success" sx={{ mx: 1, mb: 2 }}>{message}</Alert>}
                {error && <Alert severity="error" sx={{ mx: 1, mb: 2 }}>{error}</Alert>}

                {/* Hide form if message is shown */} 
                {!message && (
                    <form onSubmit={handleSubmit(submission)}>
                        <Box className="itemBox">
                            <MyTextField
                                label="Email"
                                name="email"
                                control={control}
                                required
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                disabled={loading}
                            />
                        </Box>
                        <Box className="itemBox">
                            <MyButton
                                label={loading ? <CircularProgress size={24} color="inherit"/> : "Send Reset Instructions"}
                                type="submit"
                                disabled={loading}
                            />
                        </Box>
                    </form>
                )}

                {/* Link to go back */} 
                <Box className="itemBox" sx={{ textAlign: 'center', mt: 2 }}>
                    <a href="/" style={{ textDecoration: 'none', color: 'rgb(104, 138, 124)' }}>
                        Back to Login
                    </a>
                </Box>
            </Box>
        </div>
    );
};

export default PasswordResetRequest; 