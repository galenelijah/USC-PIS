import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Button, Snackbar, Alert } from '@mui/material';
import MyTextField from './forms/MyTextField';
import { useForm } from 'react-hook-form';
import { authService } from '../services/api';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const { handleSubmit, control, reset } = useForm();

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const response = await authService.getProfile();
            setUser(response.data);
            reset(response.data);
        } catch (error) {
            console.error('Error loading profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            const response = await authService.updateProfile(data);
            setUser(response.data);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update profile' });
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Profile</Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                        {/* Personal Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Personal Information</Typography>
                        </Grid>
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

                        {/* Medical Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Medical Information</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Weight"
                                name="weight"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Height"
                                name="height"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Existing Medical Conditions"
                                name="existing_medical_condition"
                                control={control}
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Allergies"
                                name="allergies"
                                control={control}
                                multiline
                                rows={2}
                            />
                        </Grid>

                        {/* Emergency Contacts */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Emergency Contacts</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Emergency Contact Name"
                                name="emergency_contact"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Emergency Contact Number"
                                name="emergency_contact_number"
                                control={control}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                sx={{ mt: 2 }}
                            >
                                Update Profile
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            <Snackbar
                open={!!message.text}
                autoHideDuration={6000}
                onClose={() => setMessage({ type: '', text: '' })}
            >
                <Alert
                    onClose={() => setMessage({ type: '', text: '' })}
                    severity={message.type}
                    sx={{ width: '100%' }}
                >
                    {message.text}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Profile; 