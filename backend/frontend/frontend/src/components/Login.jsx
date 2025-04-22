import {Box, Typography} from '@mui/material'
import MyTextField from './forms/MyTextField'
import MyPassField from './forms/MyPassField'
import MyButton from './forms/MyButton'
import {Link, useNavigate} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, selectAuthStatus, selectAuthError, resetAuthStatus } from '../features/authentication/authSlice'
import { useEffect } from 'react'

const Login = () => {
    const navigate = useNavigate()
    const {handleSubmit, control} = useForm()
    const dispatch = useDispatch()
    const authStatus = useSelector(selectAuthStatus)
    const authError = useSelector(selectAuthError)

    useEffect(() => {
        return () => {
            if (authStatus === 'failed') {
                dispatch(resetAuthStatus())
            }
        }
    }, [dispatch, authStatus])

    const submission = async (data) => {
        const resultAction = await dispatch(loginUser({
            email: data.email,
            password: data.password
        }))

        if (loginUser.fulfilled.match(resultAction)) {
            navigate('/home')
        } else {
            if (resultAction.payload) {
                alert(`Login Failed: ${resultAction.payload}`)
            }
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
                    <Box className="itemBox" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Link 
                            to="/password-reset-request" 
                            style={{ 
                                color: '#1976d2',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                marginBottom: '16px'
                            }}
                        >
                            Forgot Password?
                        </Link>
                    </Box>
                    <Box className="itemBox">
                        <MyButton
                            label="Login"
                            type="submit"
                            disabled={authStatus === 'loading'}
                        />
                        {authStatus === 'loading' && <Typography sx={{mt: 1, textAlign: 'center'}}>Logging in...</Typography>}
                    </Box>
                    <Box className="itemBox" sx={{ textAlign: 'center' }}>
                        <Link 
                            to="/register" 
                            style={{ 
                                color: '#1976d2',
                                textDecoration: 'none'
                            }}
                        >
                            Don't have an account?
                        </Link>
                    </Box>
                </Box>
            </form>
        </div>
    )
}

export default Login 