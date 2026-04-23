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
  Alert,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  MedicalServices as DentistIcon,
  LocalHospital as DoctorIcon,
  HealthAndSafety as NurseIcon,
  Badge as StaffIcon,
  CheckCircle as CheckIcon,
  AccountCircle as UserIcon,
  AdminPanelSettings as AdminIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../features/authentication/authSlice';
import { userManagementService } from '../services/api';

const RoleSelection = () => {
  const [role, setRole] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  
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
    setError(null);
    setSuccess(null);

    try {
      if (role === 'FACULTY' || role === 'STUDENT') {
        // Self-service roles (Patient Roles)
        const response = await userManagementService.requestRole(role);
        
        // If the backend already updated the user (FACULTY/STUDENT)
        if (response.role) {
          dispatch(updateUser({ ...user, role: response.role }));
          navigate('/profile-setup');
        }
      } else {
        // Professional roles (Administrative Gate)
        const response = await userManagementService.requestRole(role);
        setSuccess(`Request for ${role} role submitted. An administrator will review your account.`);
        
        // Update local state to show request is pending
        dispatch(updateUser({ ...user, requested_role: role }));
        
        // After 3 seconds, redirect to profile or dashboard
        setTimeout(() => navigate('/dashboard'), 3500);
      }
    } catch (err) {
      console.error('Role update error:', err);
      setError(err.response?.data?.error || 'Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user already has a role assigned (other than STUDENT), or has a pending request
  // (Note: We allow STUDENT to re-select if they are just arriving here)
  React.useEffect(() => {
    if (user?.role && user.role !== 'STUDENT') {
      // If it's a professional role, they've already set it up
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const isProfessionalRole = (r) => ['DOCTOR', 'DENTIST', 'NURSE', 'STAFF'].includes(r);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #800000 0%, #4a0000 100%)', // USC Maroon
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
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'primary.light'
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
            <UserIcon sx={{ fontSize: 64, color: '#800000' }} />
            {user?.requested_role && (
              <AdminIcon 
                sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: -5, 
                  fontSize: 24, 
                  color: 'orange',
                  bgcolor: 'white',
                  borderRadius: '50%'
                }} 
              />
            )}
          </Box>
          
          <Typography variant="h4" fontWeight="bold" color="#800000" gutterBottom>
            Identify Your Role
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Welcome to the USC-PIS. Please confirm your status to ensure proper access to clinical services.
          </Typography>

          {user?.requested_role && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
              Your request for the <strong>{user.requested_role}</strong> role is currently pending administrative approval. You can still browse as a student while you wait.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <FormControl component="fieldset">
                <RadioGroup 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  sx={{ gap: 1 }}
                >
                  <Typography variant="overline" color="text.secondary" align="left" sx={{ ml: 1, mt: 1 }}>
                    Patient Roles (Self-Selection)
                  </Typography>

                  {/* Student Role */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      borderColor: role === 'STUDENT' ? '#800000' : 'divider',
                      bgcolor: role === 'STUDENT' ? alpha('#800000', 0.05) : 'transparent',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': { borderColor: '#800000' }
                    }}
                    onClick={() => setRole('STUDENT')}
                  >
                    <FormControlLabel 
                      value="STUDENT" 
                      control={<Radio sx={{ color: '#800000', '&.Mui-checked': { color: '#800000' } }} />} 
                      sx={{ width: '100%', m: 0, px: 1 }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                          <SchoolIcon color={role === 'STUDENT' ? 'primary' : 'action'} />
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle2" fontWeight="bold">USC Student</Typography>
                            <Typography variant="caption" color="text.secondary">Access health records and certificates</Typography>
                          </Box>
                        </Box>
                      } 
                    />
                  </Paper>

                  {/* Teacher Role */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      borderColor: role === 'FACULTY' ? '#800000' : 'divider',
                      bgcolor: role === 'FACULTY' ? alpha('#800000', 0.05) : 'transparent',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': { borderColor: '#800000' }
                    }}
                    onClick={() => setRole('FACULTY')}
                  >
                    <FormControlLabel 
                      value="FACULTY" 
                      control={<Radio sx={{ color: '#800000', '&.Mui-checked': { color: '#800000' } }} />} 
                      sx={{ width: '100%', m: 0, px: 1 }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                          <BadgeIcon color={role === 'FACULTY' ? 'primary' : 'action'} />
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle2" fontWeight="bold">Faculty / Teacher</Typography>
                            <Typography variant="caption" color="text.secondary">USC instructors and academic staff</Typography>
                          </Box>
                        </Box>
                      } 
                    />
                  </Paper>

                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption" color="text.secondary">ADMINISTRATIVE GATE</Typography>
                  </Divider>

                  {/* Generalized Clinic Staff Role */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isProfessionalRole(role) ? '#800000' : 'divider',
                      bgcolor: isProfessionalRole(role) ? alpha('#800000', 0.05) : 'transparent',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': { borderColor: '#800000' }
                    }}
                    onClick={() => setRole('STAFF')}
                  >
                    <FormControlLabel 
                      value="STAFF" 
                      control={<Radio sx={{ color: '#800000', '&.Mui-checked': { color: '#800000' } }} />} 
                      sx={{ width: '100%', m: 0, px: 1 }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                          <DoctorIcon color={isProfessionalRole(role) ? 'primary' : 'action'} />
                          <Box sx={{ textAlign: 'left' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="subtitle2" fontWeight="bold">Clinic Staff / Medical Professional</Typography>
                              <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Doctors, Dentists, Nurses, and Support Staff. 
                              (Requires manual verification by Admin)
                            </Typography>
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
                sx={{
                  py: 1.5,
                  mt: 2,
                  borderRadius: 2,
                  bgcolor: '#800000',
                  boxShadow: '0 4px 15px rgba(128, 0, 0, 0.3)',
                  '&:hover': {
                    bgcolor: '#4a0000',
                    boxShadow: '0 6px 20px rgba(128, 0, 0, 0.4)',
                  }
                }}
              >
                {loading ? 'Processing...' : isProfessionalRole(role) ? 'Submit Role Request' : 'Confirm Role'}
              </Button>
              
              <Typography variant="caption" color="text.secondary">
                {isProfessionalRole(role) 
                  ? "Professional roles are gated and require manual verification by an administrator."
                  : "Teacher and Student roles provide immediate access to patient features."}
              </Typography>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

// Simple wrapper for icons that might be missing
const BadgeIcon = StaffIcon;

export default RoleSelection;
