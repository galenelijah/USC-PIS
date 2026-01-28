import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';
import InfoTooltip from '../components/utils/InfoTooltip';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
// import { authService } from '../services/api'; // We'll uncomment this later

const validationSchema = Yup.object().shape({
  newPassword: Yup.string()
    .required('New Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: Yup.string()
    .required('Confirm Password is required')
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
});

const ResetPasswordPage = () => {
  const { uidb64, token } = useParams(); // Get params from URL
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
      // TODO: Call backend API: await authService.confirmPasswordReset(uidb64, token, data.newPassword);
      console.log('Resetting password with:', { uidb64, token, newPassword: data.newPassword });
      setMessage('Password has been reset successfully. You can now log in.');
      // Optionally redirect after a delay
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error('Password reset confirmation failed:', err);
      setError(err.response?.data?.detail || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="myBackground">
      <Box className="loginBox">
        <Box className="itemBox">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" className="title">Reset Password</Typography>
            <InfoTooltip title="Choose a strong new password and confirm it to reset." />
          </Box>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box className="itemBox">
            <TextField
              fullWidth
              label="New Password"
              type="password"
              variant="outlined"
              className="myForm"
              {...register('newPassword')}
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
              disabled={loading}
              sx={{ mb: 2 }} // Add margin bottom
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              variant="outlined"
              className="myForm"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={loading}
            />
          </Box>

          {message && <Alert severity="success" sx={{ mx: 1, mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mx: 1, mb: 2 }}>{error}</Alert>}

          <Box className="itemBox">
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ bgcolor: 'rgb(104, 138, 124)', '&:hover': { bgcolor: 'rgb(84, 118, 104)' }, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
            {message && (
              <Link to="/login" style={{ textDecoration: 'none', color: 'rgb(104, 138, 124)' }}>
                Go to Login
              </Link>
            )}
          </Box>
        </form>
      </Box>
    </div>
  );
};

export default ResetPasswordPage; 
