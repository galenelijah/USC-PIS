import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  Stack,
  alpha
} from '@mui/material'
import {
  PersonAdd,
  Email,
  Lock,
  CheckCircle,
  ArrowBack
} from '@mui/icons-material'
import MyTextField from './forms/MyTextField'
import MyPassField from './forms/MyPassField'
import MyButton from './forms/MyButton'
import {Link, useNavigate} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, loginUser, selectAuthStatus, selectAuthError, resetAuthStatus } from '../features/authentication/authSlice';
import { useEffect, useState } from 'react';
import { registerSchema } from '../utils/validationSchemas';
import { extractErrorMessage, extractFieldErrors } from '../utils/errorUtils';

const Register = () =>{
    const navigate = useNavigate()
    const {handleSubmit, control, watch, setError, formState: { errors } } = useForm({
        resolver: yupResolver(registerSchema),
        defaultValues: {
            email: '',
            password: '',
            password2: ''
        }
    })
    const dispatch = useDispatch();
    const authStatus = useSelector(selectAuthStatus);
    const authError = useSelector(selectAuthError);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const password = watch('password');

    useEffect(() => {
        return () => {
            dispatch(resetAuthStatus());
        };
    }, [dispatch]);

    const onSubmit = async (data) => {
        setServerError('');
        setSuccessMessage('');
        const userData = { ...data }; 

        try {
            // First, register the user
            const registerAction = await dispatch(registerUser(userData));
            
            if (registerUser.fulfilled.match(registerAction)) {
                setSuccessMessage('Registration successful! Logging you in...');
                
                // After successful registration, automatically log in
                const loginAction = await dispatch(loginUser({
                    email: userData.email,
                    password: userData.password
                }));
                
                if (loginUser.fulfilled.match(loginAction)) {
                    const user = loginAction.payload.user;
                    // Check if profile setup is needed
                    if (user && user.completeSetup === false) {
                        navigate('/profile-setup');
                    } else {
                        navigate('/home');
                    }
                } else {
                    // If login fails after registration
                    setServerError('Registration successful but login failed. Please try logging in manually.');
                    setTimeout(() => navigate('/'), 2000);
                }
            } else if (registerUser.rejected.match(registerAction)) {
                // Use centralized error utilities
                const errorPayload = registerAction.payload;
                
                // Construct a temporary error object compatible with extractErrorMessage
                const errorObj = { response: { data: errorPayload, status: 400 } };
                const errorMessage = extractErrorMessage(errorObj);
                const fieldErrors = extractFieldErrors(errorObj);

                // Set field-specific errors if any
                let hasFieldErrors = false;
                Object.entries(fieldErrors).forEach(([field, message]) => {
                    setError(field, { type: 'server', message });
                    hasFieldErrors = true;
                });

                // Set top-level error message
                if (hasFieldErrors && errorMessage === 'Please correct the errors in the form.') {
                    setServerError('Please check the highlighted fields for errors.');
                } else {
                    setServerError(errorMessage);
                }
                
                console.error('Registration error:', errorPayload || 'Unknown error');
            }
        } catch (error) {
            setServerError('An unexpected error occurred. Please try again.');
            console.error('Unexpected error during registration:', error);
        }
    }

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
            <Container maxWidth="md">
                <Grid container spacing={4} alignItems="center">
                    {/* Left side - Welcome content */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ color: 'white', pr: { md: 4 } }}>
                            <Typography variant="h3" fontWeight="bold" gutterBottom>
                                Join USC-PIS
                            </Typography>
                            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                                University of Southern California Patient Information System
                            </Typography>
                            
                            <Stack spacing={3}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CheckCircle sx={{ color: 'white' }} />
                                    <Typography variant="body1">
                                        Secure medical record management
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CheckCircle sx={{ color: 'white' }} />
                                    <Typography variant="body1">
                                        Digital health campaigns and information
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CheckCircle sx={{ color: 'white' }} />
                                    <Typography variant="body1">
                                        Easy medical certificate requests
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>

                    {/* Right side - Registration form */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={24}
                            sx={{
                                p: 4,
                                borderRadius: 3,
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            <form onSubmit={handleSubmit(onSubmit)}>
                                {/* Header */}
                                <Box sx={{ textAlign: 'center', mb: 4 }}>
                                    <PersonAdd 
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
                                        Create Account
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Enter your details to get started
                                    </Typography>
                                </Box>

                                {/* Form fields */}
                                <Stack spacing={3}>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Email fontSize="small" color="primary" />
                                            <Typography variant="body2" fontWeight="medium">
                                                Email Address
                                            </Typography>
                                        </Box>
                                        <MyTextField
                                            name="email"
                                            control={control}
                                            required
                                            placeholder="Enter your USC email"
                                            error={!!errors?.email}
                                            helperText={errors?.email?.message}
                                            hint="Use your USC email address (e.g., 2110xxxx@usc.edu.ph)"
                                        />
                                    </Box>

                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Lock fontSize="small" color="primary" />
                                            <Typography variant="body2" fontWeight="medium">
                                                Password
                                            </Typography>
                                        </Box>
                                        <MyPassField
                                            name="password"
                                            control={control}
                                            required
                                            placeholder="Create a strong password"
                                            error={!!errors?.password}
                                            helperText={errors?.password?.message}
                                            hint="At least 8 chars with upper/lowercase, number, and special character"
                                        />
                                    </Box>

                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Lock fontSize="small" color="primary" />
                                            <Typography variant="body2" fontWeight="medium">
                                                Confirm Password
                                            </Typography>
                                        </Box>
                                        <MyPassField
                                            name="password2"
                                            control={control}
                                            required
                                            placeholder="Confirm your password"
                                            error={!!errors?.password2}
                                            helperText={errors?.password2?.message}
                                            hint="Must match the password"
                                        />
                                    </Box>

                                    {/* Automatic Role Assignment Info */}
                                    <Alert 
                                        severity="info" 
                                        sx={{ 
                                            borderRadius: 2,
                                            '& .MuiAlert-icon': {
                                                alignItems: 'center'
                                            }
                                        }}
                                    >
                                        <Typography variant="body2">
                                            <strong>Automatic Role Assignment:</strong><br/>
                                            • Student emails (with numbers): 21100727@usc.edu.ph<br/>
                                            • Staff/Faculty emails (letters only): elfabian@usc.edu.ph
                                        </Typography>
                                    </Alert>

                                    {/* Error and success messages */}
                                    {serverError && (
                                        <Alert 
                                            severity="error" 
                                            sx={{ 
                                                borderRadius: 2,
                                                '& .MuiAlert-icon': {
                                                    alignItems: 'center'
                                                }
                                            }}
                                        >
                                            {serverError}
                                        </Alert>
                                    )}
                                    
                                    {successMessage && (
                                        <Alert 
                                            severity="success" 
                                            sx={{ 
                                                borderRadius: 2,
                                                '& .MuiAlert-icon': {
                                                    alignItems: 'center'
                                                }
                                            }}
                                        >
                                            {successMessage}
                                        </Alert>
                                    )}

                                    {/* Submit button */}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={authStatus === 'loading'}
                                        startIcon={
                                            authStatus === 'loading' ? 
                                                <CircularProgress size={20} color="inherit" /> : 
                                                <PersonAdd />
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
                                        {authStatus === 'loading' ? 'Creating Account...' : 'Create Account'}
                                    </Button>

                                    {/* Divider */}
                                    <Divider sx={{ my: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Already have an account?
                                        </Typography>
                                    </Divider>

                                    {/* Login link */}
                                    <Button
                                        component={Link}
                                        to="/"
                                        variant="outlined"
                                        startIcon={<ArrowBack />}
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
                                        Sign In Instead
                                    </Button>
                                </Stack>
                            </form>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default Register 
