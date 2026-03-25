import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Alert, 
    CircularProgress, 
    Container, 
    Paper, 
    Grid, 
    Stack, 
    TextField, 
    Button,
    alpha,
    InputAdornment
} from '@mui/material';
import { 
    Email as EmailIcon, 
    LockReset as ResetIcon,
    ArrowBack as BackIcon,
    CheckCircle as CheckIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const validationSchema = Yup.object().shape({
    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email address is required'),
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
        } finally {
            setLoading(false);
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
                    {/* Left side - Info content */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ color: 'white', pr: { md: 4 }, textAlign: { xs: 'center', md: 'left' } }}>
                            <SchoolIcon sx={{ fontSize: { xs: 48, md: 64 }, mb: 3, opacity: 0.9 }} />
                            <Typography variant="h2" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                                Forgot Password?
                            </Typography>
                            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                                USC Patient Information System
                            </Typography>
                            
                            <Stack spacing={3} sx={{ display: { xs: 'none', md: 'flex' } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CheckIcon sx={{ color: 'white' }} />
                                    <Typography variant="h6">
                                        Secure password recovery process
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CheckIcon sx={{ color: 'white' }} />
                                    <Typography variant="h6">
                                        Verified USC email required
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CheckIcon sx={{ color: 'white' }} />
                                    <Typography variant="h6">
                                        Protect your medical data privacy
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>

                    {/* Right side - Form card */}
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
                            {!message ? (
                                <form onSubmit={handleSubmit(submission)}>
                                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                                        <ResetIcon 
                                            sx={{ 
                                                fontSize: 48, 
                                                color: 'primary.main',
                                                mb: 2
                                            }} 
                                        />
                                        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                                            Reset Password
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Enter your email and we'll send you instructions to reset your password.
                                        </Typography>
                                    </Box>

                                    {error && (
                                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                            {error}
                                        </Alert>
                                    )}

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
                                                        fullWidth
                                                        placeholder="Enter your registered email"
                                                        error={!!errors.email}
                                                        helperText={errors.email?.message}
                                                        disabled={loading}
                                                        InputProps={{
                                                            sx: { borderRadius: 2 }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Box>

                                        <Button
                                            type="submit"
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            disabled={loading}
                                            sx={{
                                                py: 1.5,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold',
                                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                            }}
                                        >
                                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Instructions'}
                                        </Button>

                                        <Box sx={{ textAlign: 'center' }}>
                                            <Button
                                                component={Link}
                                                to="/login"
                                                startIcon={<BackIcon />}
                                                sx={{ textTransform: 'none', color: 'text.secondary' }}
                                            >
                                                Back to Login
                                            </Button>
                                        </Box>
                                    </Stack>
                                </form>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                                        Check Your Email
                                    </Typography>
                                    <Alert severity="success" sx={{ mb: 4, borderRadius: 2, textAlign: 'left' }}>
                                        {message}
                                    </Alert>
                                    <Button
                                        component={Link}
                                        to="/login"
                                        variant="outlined"
                                        fullWidth
                                        size="large"
                                        sx={{ py: 1.5, borderRadius: 2, textTransform: 'none' }}
                                    >
                                        Return to Login
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default PasswordResetRequest; 