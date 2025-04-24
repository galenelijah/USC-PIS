import Grid from '@mui/material/Grid';
import * as React from 'react';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import { Add, Remove } from '@mui/icons-material';
import { Avatar } from '@mui/material';
import MyTextField from './forms/MyTextField';
import MyDatePicker from './forms/MyDatePicker';
import MySelector from './forms/MySelector';
import MyButton from './forms/MyButton';
import {CivilStatusChoices} from './static/choices';
import {SexChoices} from './static/choices';
import {ProgramsChoices} from './static/choices';
import dayjs from 'dayjs';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import CircularProgress from '@mui/material/CircularProgress';
import { getCroppedImg } from './utils/cropImage';
import { useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Check from '@mui/icons-material/Check';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';
import * as Yup from 'yup';
import { authService } from '../services/api';

const ProfileSetup = () => {
    const { handleSubmit, control } = useForm();
    const navigate = useNavigate();

    const submission = async (data) => {
        try {
            const formData = {
                ...data,
                completeSetup: true
            };

            console.log('Submitting profile data:', formData);
            await authService.completeProfileSetup(formData);
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
                                name="first_name"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Last Name"
                                name="last_name"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Student ID"
                                name="student_id"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Course"
                                name="program"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Year Level"
                                name="year_level"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Contact Number"
                                name="contact_number"
                                control={control}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MyTextField
                                label="Emergency Contact"
                                name="emergency_contact"
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