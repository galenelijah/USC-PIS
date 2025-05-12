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
  Card,
  CardContent,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectAuthStatus, selectAuthError, resetAuthStatus } from '../features/authentication/authSlice';

const Login = () => {
  const navigate = useNavigate();
  const { handleSubmit, control, formState: { errors } } = useForm();
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={5}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              height: '100%',
            }}
          >
            <Box
              sx={{
                flex: { xs: '0 0 100%', sm: '0 0 40%' },
                background: 'linear-gradient(135deg, #1a5e20 0%, #4caf50 100%)',
                color: 'white',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <SchoolIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                USC Patient Info System
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Secure access to patient information management
              </Typography>
            </Box>

            <Box
              sx={{
                flex: { xs: '0 0 100%', sm: '0 0 60%' },
                p: 4,
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your credentials to access your account
              </Typography>

              {authStatus === 'failed' && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {authError || 'Login failed. Please check your credentials.'}
                </Alert>
              )}

              <form onSubmit={handleSubmit(submission)}>
                <Controller
                  name="email"
                  control={control}
                  defaultValue=""
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      variant="outlined"
                      fullWidth
                      margin="normal"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'Password is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Password"
                      variant="outlined"
                      fullWidth
                      margin="normal"
                      type={showPassword ? 'text' : 'password'}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Box sx={{ textAlign: 'right', mt: 1, mb: 2 }}>
                  <Link
                    to="/password-reset-request"
                    style={{
                      color: '#1976d2',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                    }}
                  >
                    Forgot Password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={authStatus === 'loading'}
                  sx={{
                    py: 1.5,
                    mt: 1,
                    mb: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                  }}
                >
                  {authStatus === 'loading' ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    New to USC-PIS?
                  </Typography>
                </Divider>

                <Button
                  component={Link}
                  to="/register"
                  variant="outlined"
                  fullWidth
                  size="large"
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                  }}
                >
                  Create an Account
                </Button>
              </form>
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default Login; 