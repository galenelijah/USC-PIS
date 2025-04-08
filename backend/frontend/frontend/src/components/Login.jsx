import {Box, Typography} from '@mui/material'
import MyTextField from './forms/MyTextField'
import MyPassField from './forms/MyPassField'
import MyButton from './forms/MyButton'
import {Link} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'

const Login = () => {
    const navigate = useNavigate()
    const {handleSubmit, control} = useForm()

    const submission = async (data) => {
        try {
            const response = await authService.login({
                username: data.email,
                password: data.password
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify({
                    id: response.data.user_id,
                    email: response.data.email,
                    role: response.data.role,
                    completeSetup: response.data.completeSetup
                }));
                navigate('/home');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials.';
            alert(errorMessage);
        }
    }

    return(
        <div className="myBackground">
            <form onSubmit={handleSubmit(submission)}>
                <Box className="loginBox">
                    <Box className="itemBox">
                        <Typography variant="h5" className="title">Login</Typography>
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
                        <MyPassField
                            label="Password"
                            name="password"
                            control={control}
                            required
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyButton
                            label="Login"
                            type="submit"
                        />
                    </Box>
                    <Box className="itemBox">
                        <Link to="/register">Don't have an account?</Link>
                    </Box>
                </Box>
            </form>
        </div>
    )
}

export default Login 