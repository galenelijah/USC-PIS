import {Box} from '@mui/material'
import MyTextField from './forms/MyTextField'
import MyPassField from './forms/MyPassField'
import MyButton from './forms/MyButton'
import {Link} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Register = () =>{
    const navigate = useNavigate()
    const {handleSubmit, control} = useForm()

    const submission = (data) => {
        axios.post(`/api/register/`, {
            email: data.email,
            password: data.password,
            password2: data.password2
        })
            .then(() => {
                navigate(`/`)
            })
            .catch((error) => {
                console.error('Error during registration', error)
            })
    }

    return(
        <div className="myBackground">
            <form onSubmit={handleSubmit(submission)}>
                <Box className="registerBox">
                    <Box className="itemBox">
                       <Box className="title">Register</Box>
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
                        <MyPassField
                            label={"Confirm Password"}
                            name={"password2"}
                            control={control}
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyButton
                            label={"Register"}
                            type={"submit"}
                        />
                    </Box>
                    <Box className="itemBox">
                        <Link to="/">Already have an account?</Link>
                    </Box>
                </Box>
            </form>
        </div>
    )
}

export default Register 