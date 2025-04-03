import {Box, FormControl, InputLabel, MenuItem, Select, Grid, Typography} from '@mui/material'
import MyTextField from './forms/MyTextField'
import MyPassField from './forms/MyPassField'
import MyButton from './forms/MyButton'
import {Link} from 'react-router-dom'
import {useForm, Controller} from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'

const Register = () =>{
    const navigate = useNavigate()
    const {handleSubmit, control, formState: {errors}} = useForm()

    const submission = async (data) => {
        try {
            if (data.password !== data.password2) {
                alert("Passwords don't match!");
                return;
            }

            // Log the registration data for debugging
            console.log('Registering with data:', {
                ...data,
                password: '[REDACTED]',
                password2: '[REDACTED]'
            });

            const response = await authService.register({
                username: data.email, // Add username field
                email: data.email,
                password: data.password,
                password2: data.password2,
                role: data.role || 'STUDENT',
                // Personal Information
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                middle_name: data.middle_name || '',
                id_number: data.id_number || '',
                course: data.course || '',
                year_level: data.year_level || '',
                school: data.school || '',
                sex: data.sex || '',
                civil_status: data.civil_status || '',
                birthday: data.birthday || null,
                nationality: data.nationality || '',
                religion: data.religion || '',
                address_permanent: data.address_permanent || '',
                address_present: data.address_present || '',
                phone: data.phone || '',
                // Physical Information
                weight: data.weight || '',
                height: data.height || '',
                // Emergency Contacts
                father_name: data.father_name || '',
                mother_name: data.mother_name || '',
                emergency_contact: data.emergency_contact || '',
                emergency_contact_number: data.emergency_contact_number || '',
                // Medical Information
                illness: data.illness || '',
                childhood_diseases: data.childhood_diseases || '',
                special_needs: data.special_needs || '',
                existing_medical_condition: data.existing_medical_condition || '',
                medications: data.medications || '',
                allergies: data.allergies || '',
                hospitalization_history: data.hospitalization_history || '',
                surgical_procedures: data.surgical_procedures || '',
                // Staff Information
                department: data.department || '',
                phone_number: data.phone_number || ''
            });

            if (response?.data) {
                console.log('Registration successful:', response.data);
                alert('Registration successful! Please login.');
                navigate('/');
            }
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.detail || 
                               error.response?.data?.email?.[0] ||
                               error.response?.data?.password?.[0] ||
                               'Registration failed. Please try again.';
            alert(errorMessage);
        }
    }

    return(
        <div className="myBackground">
            <form onSubmit={handleSubmit(submission)}>
                <Box className="registerBox">
                    <Box className="itemBox">
                       <Typography variant="h5" className="title">Register</Typography>
                    </Box>
                    
                    {/* Basic Information */}
                    <Box className="itemBox">
                        <MyTextField
                            label="Email"
                            name="email"
                            control={control}
                            required
                            rules={{
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address'
                                }
                            }}
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyPassField
                            label="Password"
                            name="password"
                            control={control}
                            required
                            rules={{
                                required: 'Password is required',
                                minLength: {
                                    value: 8,
                                    message: 'Password must be at least 8 characters'
                                }
                            }}
                        />
                    </Box>
                    <Box className="itemBox">
                        <MyPassField
                            label="Confirm Password"
                            name="password2"
                            control={control}
                            required
                            rules={{
                                required: 'Please confirm your password',
                                validate: value => value === control._getWatch('password') || 'Passwords do not match'
                            }}
                        />
                    </Box>
                    <Box className="itemBox">
                        <Controller
                            name="role"
                            control={control}
                            defaultValue="STUDENT"
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Role</InputLabel>
                                    <Select {...field} label="Role">
                                        <MenuItem value="STUDENT">Student</MenuItem>
                                        <MenuItem value="DOCTOR">Doctor</MenuItem>
                                        <MenuItem value="NURSE">Nurse</MenuItem>
                                        <MenuItem value="STAFF">Staff</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Box>

                    {/* Personal Information */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="First Name"
                                name="first_name"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Last Name"
                                name="last_name"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Middle Name"
                                name="middle_name"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="ID Number"
                                name="id_number"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Course"
                                name="course"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Year Level"
                                name="year_level"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="School"
                                name="school"
                                control={control}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MyTextField
                                label="Phone"
                                name="phone"
                                control={control}
                            />
                        </Grid>
                    </Grid>

                    <Box className="itemBox">
                        <MyButton
                            label="Register"
                            type="submit"
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