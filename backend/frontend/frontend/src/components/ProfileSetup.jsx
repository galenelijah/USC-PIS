import { Box, Typography, Grid } from '@mui/material';
import MyTextField from './forms/MyTextField';
import MyButton from './forms/MyButton';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const ProfileSetup = () => {
    const { handleSubmit, control } = useForm();
    const navigate = useNavigate();

    const submission = async (data) => {
        try {
            await authService.completeProfileSetup(data);
            alert('Profile setup completed successfully!');
            navigate('/home');
        } catch (error) {
            console.error('Profile setup error:', error);
            alert(error.response?.data?.detail || 'Failed to complete profile setup. Please try again.');
        }
    };

    return (
        <div className="myBackground">
            <form onSubmit={handleSubmit(submission)}>
                <Box className="loginBox" sx={{ maxWidth: '800px' }}>
                    <Box className="itemBox">
                        <Typography variant="h5" className="title">Complete Your Profile</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="First Name"
                                name="firstName"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Last Name"
                                name="lastName"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Student ID"
                                name="studentId"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Course"
                                name="course"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Year Level"
                                name="yearLevel"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Contact Number"
                                name="contactNumber"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Emergency Contact"
                                name="emergencyContact"
                                control={control}
                                required
                            />
                        </Grid>
                    </Grid>
                    <Box className="itemBox">
                        <MyButton
                            label="Complete Setup"
                            type="submit"
                        />
                    </Box>
                </Box>
            </form>
        </div>
    );
};

export default ProfileSetup; 