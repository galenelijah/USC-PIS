import React, { useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import MyPassField from './forms/MyPassField';
import MyButton from './forms/MyButton';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authService } from '../services/api';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const validationSchema = Yup.object().shape({
    password: Yup.string()
        .required('New Password is required')
        .min(8, 'Password must be at least 8 characters'),
    confirmPassword: Yup.string()
        .required('Confirm Password is required')
        .oneOf([Yup.ref('password'), null], 'Passwords must match'),
});

const PasswordReset = () => {
    const { uidb64, token } = useParams(); // Assume uidb64 and token are in the URL
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { handleSubmit, control, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
    });

    const submission = async (data) => {
        setLoading(true);
        setMessage('');
        setError('');
        // Ensure uidb64 and token are available
        if (!uidb64 || !token) {
            setError('Invalid password reset link. Missing required parameters.');
            setLoading(false);
            return;
        }
        try {
            // Use the confirmPasswordReset function expecting uidb64, token, password
            await authService.confirmPasswordReset(uidb64, token, data.password);
            setMessage('Password has been reset successfully. You can now log in.');
            // Optionally clear form or redirect after delay
            setTimeout(() => navigate('/login'), 3000); 
        } catch (err) {
            console.error('Password reset confirmation error:', err);
            setError(err.response?.data?.detail || 'Failed to reset password. The link may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="myBackground">
            <Box className="loginBox">
                <Box className="itemBox">
                    <Typography variant="h5" className="title">Set New Password</Typography>
                </Box>

                <form onSubmit={handleSubmit(submission)}>
                    <Box className="itemBox">
                        <MyPassField
                            label="New Password"
                            name="password"
                            control={control}
                            required
                            error={!!errors.password}
                            helperText={errors.password?.message}
                            disabled={loading}
                            sx={{ mb: 2 }} // Add margin bottom
                        />
                        <MyPassField
                            label="Confirm Password"
                            name="confirmPassword"
                            control={control}
                            required
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword?.message}
                            disabled={loading}
                        />
                    </Box>

                    {message && <Alert severity="success" sx={{ mx: 1, mb: 2 }}>{message}</Alert>}
                    {error && <Alert severity="error" sx={{ mx: 1, mb: 2 }}>{error}</Alert>}

                    <Box className="itemBox">
                        <MyButton
                            label={loading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
                            type="submit"
                            disabled={loading}
                        />
                    </Box>
                </form>

                {/* Link to go back to Login */} 
                <Box className="itemBox" sx={{ textAlign: 'center', mt: 2 }}>
                    <Link to="/login" style={{ textDecoration: 'none', color: 'rgb(104, 138, 124)' }}>
                        Back to Login
                    </Link>
                </Box>
            </Box>
        </div>
    );
};

export default PasswordReset; 