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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    InputAdornment
} from '@mui/material';
import { 
    Lock as LockIcon, 
    CheckCircle as CheckIcon,
    School as SchoolIcon,
    Visibility,
    VisibilityOff,
    Error as ErrorIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authService } from '../services/api';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const validationSchema = Yup.object().shape({
    password: Yup.string()
        .required('New Password is required')
        .min(8, 'Password must be at least 8 characters long')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>#^])[A-Za-z\d!@#$%^&*(),.?":{}|<>#^]/,
            'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
        ),
    confirmPassword: Yup.string()
        .required('Please confirm your new password')
        .oneOf([Yup.ref('password'), null], 'Passwords must match'),
});

const PasswordReset = () => {
    const { uidb64, token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { handleSubmit, control, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: { password: '', confirmPassword: '' }
    });

    const submission = async (data) => {
        setLoading(true);
        setMessage('');
        setError('');
        
        if (!uidb64 || !token) {
            setError('Invalid password reset link. Missing required parameters.');
            setLoading(false);
            return;
        }

        try {
            await authService.confirmPasswordReset(uidb64, token, data.password);
            setMessage('Your password has been reset successfully. Redirecting to login...');
            setTimeout(() => navigate('/login'), 3000); 
        } catch (err) {
            console.error('Password reset confirmation error:', err);
            const backendError = err.response?.data;
            
            if (typeof backendError === 'object') {
                // Handle specific field errors from backend if any
                const firstError = Object.values(backendError)[0];
                setError(Array.isArray(firstError) ? firstError[0] : (backendError.detail || 'Failed to reset password. The link may be invalid or expired.'));
            } else {
                setError('Failed to reset password. The link may be invalid or expired.');
            }
        } finally {
            setLoading(false);
        }
    };

    const requirements = [
        'At least 8 characters long',
        'One uppercase letter (A-Z)',
        'One lowercase letter (a-z)',
        'One number (0-9)',
        'One special character (!@#$%)'
    ];

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
                    {/* Left side - Password Requirements */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ color: 'white', pr: { md: 4 }, textAlign: { xs: 'center', md: 'left' } }}>
                            <SchoolIcon sx={{ fontSize: { xs: 48, md: 64 }, mb: 3, opacity: 0.9 }} />
                            <Typography variant="h2" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                                Secure Your Account
                            </Typography>
                            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                                Please follow these security requirements for your new password:
                            </Typography>
                            
                            <Paper 
                                sx={{ 
                                    p: 3, 
                                    bgcolor: 'rgba(255, 255, 255, 0.1)', 
                                    borderRadius: 3,
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <List>
                                    {requirements.map((req, index) => (
                                        <ListItem key={index} sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <CheckIcon sx={{ color: 'white', fontSize: 20 }} />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={req} 
                                                primaryTypographyProps={{ 
                                                    variant: 'body1', 
                                                    sx: { color: 'white', fontWeight: 500 } 
                                                }} 
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Box>
                    </Grid>

                    {/* Right side - Reset Form */}
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
                                        <LockIcon 
                                            sx={{ 
                                                fontSize: 48, 
                                                color: 'primary.main',
                                                mb: 2
                                            }} 
                                        />
                                        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                                            New Password
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Set a strong password to protect your records
                                        </Typography>
                                    </Box>

                                    {error && (
                                        <Alert 
                                            severity="error" 
                                            sx={{ mb: 3, borderRadius: 2 }}
                                            icon={<ErrorIcon />}
                                        >
                                            {error}
                                        </Alert>
                                    )}

                                    <Stack spacing={3}>
                                        {/* New Password */}
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <LockIcon fontSize="small" color="primary" />
                                                <Typography variant="body2" fontWeight="medium">
                                                    New Password
                                                </Typography>
                                            </Box>
                                            <Controller
                                                name="password"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        fullWidth
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="Enter new password"
                                                        error={!!errors.password}
                                                        helperText={errors.password?.message}
                                                        disabled={loading}
                                                        InputProps={{
                                                            sx: { borderRadius: 2 },
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                        edge="end"
                                                                    >
                                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            )
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Box>

                                        {/* Confirm Password */}
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <CheckIcon fontSize="small" color="primary" />
                                                <Typography variant="body2" fontWeight="medium">
                                                    Confirm New Password
                                                </Typography>
                                            </Box>
                                            <Controller
                                                name="confirmPassword"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        fullWidth
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        placeholder="Re-enter new password"
                                                        error={!!errors.confirmPassword}
                                                        helperText={errors.confirmPassword?.message}
                                                        disabled={loading}
                                                        InputProps={{
                                                            sx: { borderRadius: 2 },
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                        edge="end"
                                                                    >
                                                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            )
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
                                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                                        </Button>
                                    </Stack>
                                </form>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                                        Success!
                                    </Typography>
                                    <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
                                        {message}
                                    </Alert>
                                    <CircularProgress size={32} sx={{ mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Redirecting you to the login page...
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default PasswordReset; 