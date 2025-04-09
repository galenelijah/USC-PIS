import { Box, Typography } from '@mui/material';
import MyPassField from './forms/MyPassField';
import MyButton from './forms/MyButton';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/api';

const PasswordReset = () => {
    const { handleSubmit, control } = useForm();
    const navigate = useNavigate();
    const { token } = useParams();

    const submission = async (data) => {
        try {
            await authService.resetPassword(token, data.password);
            alert('Password has been reset successfully. Please login with your new password.');
            navigate('/login');
        } catch (error) {
            console.error('Password reset error:', error);
            alert(error.response?.data?.detail || 'Failed to reset password. Please try again.');
        }
    };

    return (
        <div className="myBackground">
            <form onSubmit={handleSubmit(submission)}>
                <Box className="loginBox">
                    <Box className="itemBox">
                        <Typography variant="h5" className="title">Set New Password</Typography>
                    </Box>
                    <Box className="itemBox">
                        <MyPassField
                            label="New Password"
                            name="password"
                            control={control}
                            required
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyPassField
                            label="Confirm Password"
                            name="confirmPassword"
                            control={control}
                            required
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyButton
                            label="Reset Password"
                            type="submit"
                        />
                    </Box>
                </Box>
            </form>
        </div>
    );
};

export default PasswordReset; 