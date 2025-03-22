import {Box} from '@mui/material'
import MyTextField from './forms/MyTextField'
import MyPassField from './forms/MyPassField'
import MyButton from './forms/MyButton'
import {Link} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () => {
    const navigate = useNavigate()
    const {handleSubmit, control} = useForm()

    const submission = async (data) => {
        try {
            console.log('Login attempt with:', {
                username: data.email,
                password: data.password
            });

            const response = await axios.post('/api/auth/login/', {
                username: data.email,
                password: data.password,
            });
            
            console.log('Login response:', response.data);

            if (response.data.token) {
                localStorage.setItem('Token', response.data.token);
                axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
                navigate('/home');
            }
        } catch (error) {
            console.error('Login error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            
            let errorMessage = 'Login failed. Please try again.';
            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.response?.data?.non_field_errors) {
                errorMessage = error.response.data.non_field_errors[0];
            }
            
            alert(errorMessage);
        }
    }

    return(
        <div className="myBackground">
            <form onSubmit={handleSubmit(submission)}>
                <Box className="loginBox">
                    <Box className="itemBox">
                       <Box className="title">Login</Box>
                    </Box>
                    <Box className="itemBox">
                        <MyTextField
                            label={"Email"}
                            name={"email"}
                            control={control}
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyPassField
                            label={"Password"}
                            name={"password"}
                            control={control}
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyButton
                            label={"Login"}
                            type={"submit"}
                        />
                    </Box>
                    <Box className="itemBox">
                        <Link to="/register">No Account Yet?</Link>
                    </Box>
                </Box>
            </form>
        </div>
    )
}

export default Login 