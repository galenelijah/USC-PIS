import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Button,
  TextField,
  Stack,
  alpha,
  IconButton,
  Grid
} from '@mui/material';
import {
  MarkEmailRead as EmailIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/api';
import { updateUser, logout } from '../features/authentication/authSlice';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [timer, setTimer] = useState(0);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    // If user is already verified, redirect
    if (user?.is_verified) {
      const isTextEmail = user?.email && !/^\d+$/.test(user.email.split('@')[0]);
      
      if (isTextEmail && user.role === 'STUDENT') {
        navigate('/role-selection');
      } else if (user.completeSetup === false) {
        navigate('/profile-setup');
      } else {
        navigate('/home');
      }
    }
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authService.verifyEmail(code);
      setSuccess('Email verified successfully!');
      
      // Update user state in Redux
      dispatch(updateUser(response.data.user));
      
      // Navigate after a short delay
      setTimeout(() => {
        const user = response.data.user;
        const isTextEmail = user?.email && !/^\d+$/.test(user.email.split('@')[0]);

        if (isTextEmail && user.role === 'STUDENT') {
          navigate('/role-selection');
        } else if (user.completeSetup === false) {
          navigate('/profile-setup');
        } else {
          navigate('/home');
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setSuccess(null);
    try {
      await authService.resendVerificationCode();
      setSuccess('A new verification code has been sent to your email.');
      setTimer(60); // 60 seconds cooldown
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend code. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #800000 0%, #4a0000 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}
        >
          <EmailIcon sx={{ fontSize: 64, color: '#800000', mb: 2 }} />
          
          <Typography variant="h4" fontWeight="bold" color="#800000" gutterBottom>
            Verify Your Email
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            We've sent a 6-digit verification code to<br />
            <Box component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {user?.email}
            </Box>
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleVerify}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="6-Digit Code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{ 
                  style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold' },
                  maxLength: 6
                }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': { borderColor: '#800000' }
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || code.length !== 6}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <KeyIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: '#800000',
                  '&:hover': { backgroundColor: '#600000' },
                  fontSize: '1.1rem'
                }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Grid container spacing={1} justifyContent="center" alignItems="center">
                <Grid item>
                  <Typography variant="body2" color="text.secondary">
                    Didn't receive the code?
                  </Typography>
                </Grid>
                <Grid item>
                  <Button
                    onClick={handleResend}
                    disabled={resending || timer > 0}
                    size="small"
                    startIcon={resending ? <CircularProgress size={16} /> : <RefreshIcon />}
                    sx={{ color: '#800000', fontWeight: 'bold' }}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                <Button
                  onClick={handleLogout}
                  startIcon={<ArrowBackIcon />}
                  sx={{ color: 'text.secondary' }}
                >
                  Back to Login
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default VerifyEmail;
