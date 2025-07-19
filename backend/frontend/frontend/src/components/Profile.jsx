import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Snackbar, 
  Alert, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Divider,
  Stack
} from '@mui/material';
import { 
  Edit, 
  Person, 
  Email, 
  Phone, 
  Home, 
  School, 
  LocalHospital,
  Height,
  MonitorWeight
} from '@mui/icons-material';
import MyTextField from './forms/MyTextField';
import { useForm } from 'react-hook-form';
import { authService } from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, selectAuthToken, selectCurrentUser } from '../features/authentication/authSlice';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const Profile = () => {
    const currentUser = useSelector(selectCurrentUser);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const { handleSubmit, control, reset } = useForm();
    const dispatch = useDispatch();
    const token = useSelector(selectAuthToken);
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            setUser(currentUser);
            setLoading(false);
        } else {
            fetchProfile();
        }
    }, [currentUser]);

    const fetchProfile = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await authService.getProfile();
            if (response && response.data) {
                setUser(response.data);
                reset(response.data);
                if (token) {
                    dispatch(setCredentials({ user: response.data, token: token }));
                } else {
                    console.warn('Profile.jsx: Auth token not found in Redux store when trying to set credentials.');
                }
            } else {
                setMessage({ type: 'error', text: 'Received invalid profile data from server' });
            }
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
            if (token) {
                dispatch(setCredentials({ user: response.data, token: token }));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update profile' });
        }
    };

    // Helper function to parse comma-separated strings
    const parseCommaSeparated = (value) => {
        if (!value) return [];
        return value.split(', ').filter(item => item.trim() !== '');
    };

    // Calculate age from birthday
    const calculateAge = (birthday) => {
        if (!birthday) return null;
        return dayjs().diff(dayjs(birthday), 'year');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    if (!user) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Unable to load profile data</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header with Edit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">My Profile</Typography>
                <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => navigate('/edit-profile')}
                    sx={{
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        '&:hover': {
                            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                        }
                    }}
                >
                    Edit Profile
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Basic Information Card */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{ height: 'fit-content' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Person sx={{ color: '#667eea', fontSize: 28 }} />
                                <Typography variant="h5" fontWeight="bold">Personal Information</Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                                <Avatar 
                                    sx={{ 
                                        width: 80, 
                                        height: 80, 
                                        bgcolor: '#667eea',
                                        fontSize: '2rem'
                                    }}
                                >
                                    {user.first_name ? user.first_name[0] : user.email ? user.email[0].toUpperCase() : 'U'}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">
                                        {user.first_name && user.last_name 
                                            ? `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`
                                            : 'Name not set'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {user.role} {user.id_number ? `• ${user.id_number}` : ''}
                                    </Typography>
                                    {user.birthday && (
                                        <Typography variant="body2" color="text.secondary">
                                            Age: {calculateAge(user.birthday)} years old
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Email sx={{ color: 'text.secondary' }} />
                                    <Typography>{user.email || 'Email not set'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Phone sx={{ color: 'text.secondary' }} />
                                    <Typography>{user.phone || 'Phone not set'}</Typography>
                                </Box>
                                {user.sex && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Sex:</Typography>
                                        <Typography>{user.sex}</Typography>
                                    </Box>
                                )}
                                {user.civil_status && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Civil Status:</Typography>
                                        <Typography>{user.civil_status}</Typography>
                                    </Box>
                                )}
                                {user.nationality && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Nationality:</Typography>
                                        <Typography>{user.nationality}</Typography>
                                    </Box>
                                )}
                                {user.religion && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Religion:</Typography>
                                        <Typography>{user.religion}</Typography>
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Contact Information Card */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{ height: 'fit-content' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Home sx={{ color: '#764ba2', fontSize: 28 }} />
                                <Typography variant="h5" fontWeight="bold">Contact Details</Typography>
                            </Box>
                            
                            <Stack spacing={2}>
                                {user.address_permanent && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Permanent Address:</Typography>
                                        <Typography>{user.address_permanent}</Typography>
                                    </Box>
                                )}
                                {user.address_present && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Present Address:</Typography>
                                        <Typography>{user.address_present}</Typography>
                                    </Box>
                                )}
                                
                                <Divider sx={{ my: 2 }} />
                                
                                {user.father_name && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Father's Name:</Typography>
                                        <Typography>{user.father_name}</Typography>
                                    </Box>
                                )}
                                {user.mother_name && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Mother's Name:</Typography>
                                        <Typography>{user.mother_name}</Typography>
                                    </Box>
                                )}
                                {user.emergency_contact && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Emergency Contact:</Typography>
                                        <Typography>{user.emergency_contact}</Typography>
                                        {user.emergency_contact_number && (
                                            <Typography variant="body2">{user.emergency_contact_number}</Typography>
                                        )}
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Academic Information Card */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{ height: 'fit-content' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <School sx={{ color: '#f093fb', fontSize: 28 }} />
                                <Typography variant="h5" fontWeight="bold">Academic Information</Typography>
                            </Box>
                            
                            <Stack spacing={2}>
                                {user.course && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Course:</Typography>
                                        <Typography>{user.course}</Typography>
                                    </Box>
                                )}
                                {user.year_level && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Year Level:</Typography>
                                        <Typography>{user.year_level}</Typography>
                                    </Box>
                                )}
                                {user.school && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">School/Campus:</Typography>
                                        <Typography>{user.school}</Typography>
                                    </Box>
                                )}
                                
                                {(user.height || user.weight) && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="body2" color="text.secondary">Physical Information:</Typography>
                                        <Box sx={{ display: 'flex', gap: 4 }}>
                                            {user.height && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Height sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                    <Typography>Height: {user.height} cm</Typography>
                                                </Box>
                                            )}
                                            {user.weight && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <MonitorWeight sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                    <Typography>Weight: {user.weight} kg</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Medical Information Card */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{ height: 'fit-content' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <LocalHospital sx={{ color: '#f5576c', fontSize: 28 }} />
                                <Typography variant="h5" fontWeight="bold">Medical Information</Typography>
                            </Box>
                            
                            <Stack spacing={2}>
                                {user.childhood_diseases && parseCommaSeparated(user.childhood_diseases).length > 0 && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Childhood Diseases:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {parseCommaSeparated(user.childhood_diseases).map((disease, index) => (
                                                <Chip key={index} label={disease} size="small" color="info" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {user.special_needs && parseCommaSeparated(user.special_needs).length > 0 && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Special Needs:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {parseCommaSeparated(user.special_needs).map((need, index) => (
                                                <Chip key={index} label={need} size="small" color="secondary" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {user.illness && parseCommaSeparated(user.illness).length > 0 && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Current Illnesses:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {parseCommaSeparated(user.illness).map((illness, index) => (
                                                <Chip key={index} label={illness} size="small" color="default" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {user.allergies && parseCommaSeparated(user.allergies).length > 0 && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Known Allergies:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {parseCommaSeparated(user.allergies).map((allergy, index) => (
                                                <Chip key={index} label={allergy} size="small" color="warning" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {user.medications && parseCommaSeparated(user.medications).length > 0 && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Current Medications:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {parseCommaSeparated(user.medications).map((medication, index) => (
                                                <Chip key={index} label={medication} size="small" color="primary" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {user.existing_medical_condition && parseCommaSeparated(user.existing_medical_condition).length > 0 && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Medical Conditions:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {parseCommaSeparated(user.existing_medical_condition).map((condition, index) => (
                                                <Chip key={index} label={condition} size="small" color="error" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {(!user.childhood_diseases && !user.special_needs && !user.illness && !user.allergies && !user.medications && !user.existing_medical_condition) && (
                                    <Typography color="text.secondary" style={{ fontStyle: 'italic' }}>
                                        No medical information provided
                                    </Typography>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            
            {message.text && (
                <Snackbar
                    open={!!message.text}
                    autoHideDuration={6000}
                    onClose={() => setMessage({ type: '', text: '' })}
                >
                    <Alert severity={message.type}>{message.text}</Alert>
                </Snackbar>
            )}
        </Box>
    );
};

export default Profile;