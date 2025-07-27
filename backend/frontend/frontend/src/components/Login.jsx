import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Grid,
  Stack,
  alpha
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  School as SchoolIcon,
  Login as LoginIcon,
  PersonAdd,
  CheckCircle
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectAuthStatus, selectAuthError, resetAuthStatus } from '../features/authentication/authSlice';
import { loginSchema } from '../utils/validationSchemas';

const Login = () => {
  const navigate = useNavigate();
  const { handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const dispatch = useDispatch();
  const authStatus = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    return () => {
      if (authStatus === 'failed') {
        dispatch(resetAuthStatus());
      }
    };
  }, [dispatch, authStatus]);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const submission = async (data) => {
    const resultAction = await dispatch(loginUser({
      email: data.email,
      password: data.password
    }));

    if (loginUser.fulfilled.match(resultAction)) {
      const user = resultAction.payload.user;
      if (user && user.completeSetup === false) {
        navigate('/profile-setup');
      } else {
        navigate('/home');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left side - Welcome content */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white', pr: { md: 4 }, textAlign: { xs: 'center', md: 'left' } }}>
              <SchoolIcon sx={{ fontSize: { xs: 48, md: 64 }, mb: 3, opacity: 0.9 }} />
              <Typography variant="h2" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                Welcome Back
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                USC Patient Information System
              </Typography>
              
              <Stack spacing={3} sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'white' }} />
                  <Typography variant="h6">
                    Secure access to your medical records
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'white' }} />
                  <Typography variant="h6">
                    Request medical certificates online
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'white' }} />
                  <Typography variant="h6">
                    Stay updated with health campaigns
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>

          {/* Right side - Login form */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={24}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <form onSubmit={handleSubmit(submission)}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <LoginIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: 'primary.main',
                      mb: 2
                    }} 
                  />
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    color="primary.main"
                    gutterBottom
                  >
                    Sign In
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter your credentials to access your account
                  </Typography>
                </Box>

                {/* Error Alert */}
                {authStatus === 'failed' && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        alignItems: 'center'
                      }
                    }}
                  >
                    {authError || 'Login failed. Please check your credentials.'}
                  </Alert>
                )}

                {/* Form fields */}
                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight="medium">
                        Email Address
                      </Typography>
                    </Box>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="email"
                          autoComplete="email"
                          placeholder="Enter your USC email"
                          error={!!errors.email}
                          helperText={errors.email?.message}
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha('#667eea', 0.3)
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                              }
                            }
                          }}
                        />
                      )}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LockIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight="medium">
                        Password
                      </Typography>
                    </Box>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          error={!!errors.password}
                          helperText={errors.password?.message}
                          fullWidth
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={handleClickShowPassword}
                                  edge="end"
                                  size="small"
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha('#667eea', 0.3)
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                              }
                            }
                          }}
                        />
                      )}
                    />
                  </Box>

                  {/* Forgot Password Link */}
                  <Box sx={{ textAlign: 'right' }}>
                    <Button
                      component={Link}
                      to="/password-reset-request"
                      variant="text"
                      size="small"
                      sx={{ 
                        color: '#667eea',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: alpha('#667eea', 0.1)
                        }
                      }}
                    >
                      Forgot Password?
                    </Button>
                  </Box>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={authStatus === 'loading'}
                    startIcon={
                      authStatus === 'loading' ? 
                        <CircularProgress size={20} color="inherit" /> : 
                        <LoginIcon />
                    }
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 25px rgba(102, 126, 234, 0.5)'
                      },
                      '&:disabled': {
                        background: 'rgba(0, 0, 0, 0.12)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {authStatus === 'loading' ? 'Signing In...' : 'Sign In'}
                  </Button>

                  {/* Divider */}
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Don't have an account?
                    </Typography>
                  </Divider>

                  {/* Register link */}
                  <Button
                    component={Link}
                    to="/register"
                    variant="outlined"
                    startIcon={<PersonAdd />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      borderColor: alpha('#667eea', 0.5),
                      color: '#667eea',
                      '&:hover': {
                        borderColor: '#667eea',
                        backgroundColor: alpha('#667eea', 0.1)
                      }
                    }}
                  >
                    Create New Account
                  </Button>
                </Stack>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;