import {Box} from '@mui/material'
import MyTextField from './forms/MyTextField'
import MyPassField from './forms/MyPassField'
import MyButton from './forms/MyButton'
import {Link} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () =>{
    const navigate = useNavigate()
    const {handleSubmit, control} = useForm()

    const submission = async (data) => {
        try {
            const response = await axios.post('/api/auth/login/', {
                username: data.email,  // Django expects username
                password: data.password,
            });
            
            if (response.data.token) {
                localStorage.setItem('Token', response.data.token);
                // Set the token in axios defaults for future requests
                axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
                navigate('/home');
            }
        } catch (error) {
            console.error('Error during login:', error);
            // You might want to show an error message to the user here
            alert(error.response?.data?.detail || 'Login failed. Please try again.');
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
                        Forgot Password
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