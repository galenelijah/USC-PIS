import { Box, Typography } from '@mui/material';
import MyTextField from './forms/MyTextField';
import MyButton from './forms/MyButton';
import { useForm } from 'react-hook-form';
import { authService } from '../services/api';

const PasswordResetRequest = () => {
    const { handleSubmit, control } = useForm();

    const submission = async (data) => {
        try {
            await authService.requestPasswordReset(data.email);
            alert('Password reset instructions have been sent to your email.');
        } catch (error) {
            console.error('Password reset request error:', error);
            alert(error.response?.data?.detail || 'Failed to request password reset. Please try again.');
        }
    };

    return (
        <div className="myBackground">
            <form onSubmit={handleSubmit(submission)}>
                <Box className="loginBox">
                    <Box className="itemBox">
                        <Typography variant="h5" className="title">Reset Password</Typography>
                    </Box>
                    <Box className="itemBox">
                        <MyTextField
                            label="Email"
                            name="email"
                            control={control}
                            required
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyButton
                            label="Request Reset"
                            type="submit"
                        />
                    </Box>
                    <Box className="itemBox">
                        <Typography variant="body2">
                            Enter your email address and we'll send you instructions to reset your password.
                        </Typography>
                    </Box>
                </Box>
            </form>
        </div>
    );
};

export default PasswordResetRequest; 