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

    const submission = (data) => {
        axios.post(`/api/login/`, {
            email: data.email,
            password: data.password,
        })
            .then((response) => {
                console.log(response)
                localStorage.setItem('Token', response.data.token)
                navigate(`/home`)
            })
            .catch((error)=> {
                console.error('Error during login', error)
            })
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