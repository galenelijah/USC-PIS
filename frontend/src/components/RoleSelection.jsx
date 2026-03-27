import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  Stack,
  alpha,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert
} from '@mui/material';
import {
  School as SchoolIcon,
  MedicalServices as DentistIcon,
  LocalHospital as DoctorIcon,
  HealthAndSafety as NurseIcon,
  Badge as StaffIcon,
  CheckCircle as CheckIcon,
  AccountCircle as UserIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../features/authentication/authSlice';
import { userManagementService } from '../services/api';

const RoleSelection = () => {
  const [role, setRole] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError('Please select a role to continue.');
      return;
    }

    setLoading(true);
    try {
      // Use a dedicated role update endpoint or general profile update
      const response = await userManagementService.updateUserRole(user.id, role);
      dispatch(updateUser(response.user));
      navigate('/profile-setup');
    } catch (err) {
      setError('Failed to update role. Please try again.');
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
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}
        >
          <UserIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
            Select Your Role
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            To finish setting up your account, please tell us your primary role at USC.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl component="fieldset">
                <RadioGroup 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  sx={{ gap: 1.5 }}
                >
                  {/* Teacher Role */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      borderColor: role === 'TEACHER' ? 'primary.main' : 'divider',
                      bgcolor: role === 'TEACHER' ? alpha('#667eea', 0.05) : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                    }}
                  >
                    <FormControlLabel 
                      value="TEACHER" 
                      control={<Radio />} 
                      sx={{ width: '100%', m: 0, px: 1 }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                          <SchoolIcon color={role === 'TEACHER' ? 'primary' : 'action'} />
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle2" fontWeight="bold">Teacher / Faculty</Typography>
                            <Typography variant="caption" color="text.secondary">Academic and teaching personnel</Typography>
                          </Box>
                        </Box>
                      } 
                    />
                  </Paper>

                  {/* Doctor Role */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      borderColor: role === 'DOCTOR' ? 'primary.main' : 'divider',
                      bgcolor: role === 'DOCTOR' ? alpha('#667eea', 0.05) : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                    }}
                  >
                    <FormControlLabel 
                      value="DOCTOR" 
                      control={<Radio />} 
                      sx={{ width: '100%', m: 0, px: 1 }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                          <DoctorIcon color={role === 'DOCTOR' ? 'primary' : 'action'} />
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle2" fontWeight="bold">Doctor</Typography>
                            <Typography variant="caption" color="text.secondary">Medical physicians and specialists</Typography>
                          </Box>
                        </Box>
                      } 
                    />
                  </Paper>

                  {/* Dentist Role */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      borderColor: role === 'DENTIST' ? 'primary.main' : 'divider',
                      bgcolor: role === 'DENTIST' ? alpha('#667eea', 0.05) : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                    }}
                  >
                    <FormControlLabel 
                      value="DENTIST" 
                      control={<Radio />} 
                      sx={{ width: '100%', m: 0, px: 1 }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                          <DentistIcon color={role === 'DENTIST' ? 'primary' : 'action'} />
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle2" fontWeight="bold">Dentist</Typography>
                            <Typography variant="caption" color="text.secondary">Dental health professionals</Typography>
                          </Box>
                        </Box>
                      } 
                    />
                  </Paper>

                  {/* Nurse Role */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      borderColor: role === 'NURSE' ? 'primary.main' : 'divider',
                      bgcolor: role === 'NURSE' ? alpha('#667eea', 0.05) : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                    }}
                  >
                    <FormControlLabel 
                      value="NURSE" 
                      control={<Radio />} 
                      sx={{ width: '100%', m: 0, px: 1 }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                          <NurseIcon color={role === 'NURSE' ? 'primary' : 'action'} />
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle2" fontWeight="bold">Nurse</Typography>
                            <Typography variant="caption" color="text.secondary">Clinical nursing staff</Typography>
                          </Box>
                        </Box>
                      } 
                    />
                  </Paper>

                  {/* Staff Role */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      borderColor: role === 'STAFF' ? 'primary.main' : 'divider',
                      bgcolor: role === 'STAFF' ? alpha('#667eea', 0.05) : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                    }}
                  >
                    <FormControlLabel 
                      value="STAFF" 
                      control={<Radio />} 
                      sx={{ width: '100%', m: 0, px: 1 }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                          <StaffIcon color={role === 'STAFF' ? 'primary' : 'action'} />
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle2" fontWeight="bold">Administrative Staff</Typography>
                            <Typography variant="caption" color="text.secondary">Non-medical office and support staff</Typography>
                          </Box>
                        </Box>
                      } 
                    />
                  </Paper>
                </RadioGroup>
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !role}
                startIcon={loading ? <CheckIcon /> : <CheckIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                  }
                }}
              >
                {loading ? 'Processing...' : 'Complete Role Selection'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default RoleSelection;
