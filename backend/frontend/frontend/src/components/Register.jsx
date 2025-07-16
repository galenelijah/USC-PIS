import {Box, FormControl, InputLabel, MenuItem, Select, Typography, Alert, CircularProgress} from '@mui/material'
import MyTextField from './forms/MyTextField'
import MyPassField from './forms/MyPassField'
import MyButton from './forms/MyButton'
import {Link, useNavigate} from 'react-router-dom'
import {useForm, Controller} from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, loginUser, selectAuthStatus, selectAuthError, resetAuthStatus } from '../features/authentication/authSlice';
import { useEffect, useState } from 'react';

const Register = () =>{
    const navigate = useNavigate()
    const {handleSubmit, control, watch, formState: { errors } } = useForm()
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
                let errorMessage = 'Registration failed. Please check your inputs.';
                if (registerAction.payload) {
                    if (typeof registerAction.payload === 'string') {
                        errorMessage = registerAction.payload;
                    } else if (registerAction.payload && typeof registerAction.payload === 'object') {
                        const fieldErrors = Object.values(registerAction.payload).flat().filter(Boolean);
                        if (fieldErrors.length > 0) {
                            errorMessage = fieldErrors[0];
                        }
                    }
                }
                setServerError(errorMessage);
                console.error('Registration error:', registerAction.payload || 'Unknown error');
            }
        } catch (error) {
            setServerError('An unexpected error occurred. Please try again.');
            console.error('Unexpected error during registration:', error);
        }
    }

    return(
        <div className="myBackground">
            <form onSubmit={handleSubmit(onSubmit)}>
                <Box className="registerBox">
                    <Box className="itemBox">
                       <Typography variant="h5" className="title">Register</Typography>
                    </Box>
                    <Box className="itemBox">
                        <MyTextField
                            label="Email"
                            name="email"
                            control={control}
                            required
                            error={!!errors?.email}
                            helperText={errors?.email?.message}
                            rules={{
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address'
                                }
                            }}
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyPassField
                            label="Password"
                            name="password"
                            control={control}
                            required
                            error={!!errors?.password}
                            helperText={errors?.password?.message}
                            rules={{
                                required: 'Password is required',
                                minLength: {
                                    value: 8,
                                    message: 'Password must be at least 8 characters'
                                }
                            }}
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyPassField
                            label="Confirm Password"
                            name="password2"
                            control={control}
                            required
                            error={!!errors?.password2}
                            helperText={errors?.password2?.message}
                            rules={{
                                required: 'Please confirm your password',
                                validate: value => value === password || 'Passwords do not match'
                            }}
                        />
                    </Box>
                    <Box className="itemBox">
                        <Controller
                            name="role"
                            control={control}
                            defaultValue="STUDENT"
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Role</InputLabel>
                                    <Select {...field} label="Role">
                                        <MenuItem value="STUDENT">Student</MenuItem>
                                        <MenuItem value="DOCTOR">Doctor</MenuItem>
                                        <MenuItem value="NURSE">Nurse</MenuItem>
                                        <MenuItem value="STAFF">Staff</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Box>
                    {serverError && (
                        <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
                            {serverError}
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert severity="success" sx={{ mt: 2, mb: 1 }}>
                            {successMessage}
                        </Alert>
                    )}
                    <Box className="itemBox">
                        <MyButton
                            label={authStatus === 'loading' ? '' : 'Register'}
                            type="submit"
                            disabled={authStatus === 'loading'}
                            startIcon={authStatus === 'loading' ? 
                                <CircularProgress size={20} color="inherit" /> : null
                            }
                        />
                        {authStatus === 'loading' && (
                            <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ mt: 1, textAlign: 'center' }}
                            >
                                Creating your account...
                            </Typography>
                        )}
                    </Box>
                    <Box className="itemBox">
                        <Link to="/">Already have an account?</Link>
                    </Box>
                </Box>
            </form>
        </div>
    )
}

export default Register 