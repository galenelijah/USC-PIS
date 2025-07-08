import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
// import { authService } from '../services/api'; // We'll uncomment this later

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      // TODO: Call backend API: await authService.requestPasswordReset(data.email);
      console.log('Requesting password reset for:', data.email);
      setMessage('If an account with that email exists, a password reset link has been sent.');
    } catch (err) {
      console.error('Password reset request failed:', err);
      // For security, usually show a generic message even on error
      setMessage('If an account with that email exists, a password reset link has been sent.');
      // setError(err.response?.data?.detail || 'Failed to request password reset.'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="myBackground">
      <Box className="loginBox">
        <Box className="itemBox">
          <Typography variant="h5" className="title">Forgot Password</Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, mb: 2, color: 'text.secondary' }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
        </Box>

        {/* Only show form if message is not set */} 
        {!message && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box className="itemBox">
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                className="myForm"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={loading}
              />
            </Box>

            {error && <Alert severity="error" sx={{ mx: 1, mb: 2 }}>{error}</Alert>}

            <Box className="itemBox">
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ bgcolor: 'rgb(104, 138, 124)', '&:hover': { bgcolor: 'rgb(84, 118, 104)' } }}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>
            </Box>
          </form>
        )}

        {/* Show message if it exists */} 
        {message && (
          <Box className="itemBox" sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>
            <Link to="/login" style={{ textDecoration: 'none', color: 'rgb(104, 138, 124)' }}>
              Back to Login
            </Link>
          </Box>
        )}

        {/* Always show Back to Login link unless message is shown */} 
        {!message && (
          <Box className="itemBox" sx={{ textAlign: 'center', mt: 2 }}>
            <Link to="/login" style={{ textDecoration: 'none', color: 'rgb(104, 138, 124)' }}>
              Back to Login
            </Link>
          </Box>
        )}
      </Box>
    </div>
  );
};

export default ForgotPasswordPage; 