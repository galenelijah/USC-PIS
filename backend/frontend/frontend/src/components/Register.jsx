import {Box, FormControl, InputLabel, MenuItem, Select, Grid, Typography} from '@mui/material'
import MyTextField from './forms/MyTextField'
import MyPassField from './forms/MyPassField'
import MyButton from './forms/MyButton'
import {Link, useNavigate} from 'react-router-dom'
import {useForm, Controller} from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, selectAuthStatus, selectAuthError, resetAuthStatus } from '../features/authentication/authSlice';
import { useEffect } from 'react';

const Register = () =>{
    const navigate = useNavigate()
    const {handleSubmit, control, watch, formState: { errors } } = useForm()
    const dispatch = useDispatch();
    const authStatus = useSelector(selectAuthStatus);
    const authError = useSelector(selectAuthError);

    const password = watch('password');

    useEffect(() => {
        return () => {
            dispatch(resetAuthStatus());
        };
    }, [dispatch]);

    const submission = async (data) => {
        try {
            // Ensure all required fields are present
            const userData = {
                ...data,
                birthday: data.birthday || null,
                username: data.email // Set username to email
            };

            console.log('Dispatching registerUser with data:', userData);
            const resultAction = await dispatch(registerUser(userData));

            if (registerUser.fulfilled.match(resultAction)) {
                console.log('Registration successful');
                alert('Registration successful! Please login.');
                // Navigate to login page
                navigate('/', { replace: true });
                return;
            } 
            
            // Handle error
            let errorMessage = 'Registration failed. Please check your inputs.';
            if (resultAction.payload) {
                if (typeof resultAction.payload === 'string') {
                    errorMessage = resultAction.payload;
                } else if (resultAction.payload && typeof resultAction.payload === 'object') {
                    // Safely handle object errors
                    const fieldErrors = Object.values(resultAction.payload).flat().filter(Boolean);
                    if (fieldErrors.length > 0) {
                        errorMessage = fieldErrors[0];
                    }
                }
            }
            console.error('Registration error:', resultAction.payload || 'Unknown error');
            alert(errorMessage);
        } catch (error) {
            // Add global error handler
            console.error('Unexpected error during registration:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    }

    return(
        <div className="myBackground">
            <form onSubmit={handleSubmit(submission)}>
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

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="First Name"
                                name="first_name"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Last Name"
                                name="last_name"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Middle Name"
                                name="middle_name"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="ID Number"
                                name="id_number"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Course"
                                name="course"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Year Level"
                                name="year_level"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="School"
                                name="school"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Phone"
                                name="phone"
                                control={control}
                            />
                        </Grid>
                    </Grid>

                    <Box className="itemBox">
                        <MyButton
                            label="Register"
                            type="submit"
                            disabled={authStatus === 'loading'}
                        />
                        {authStatus === 'loading' && <Typography sx={{mt: 1}}>Registering...</Typography>}
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