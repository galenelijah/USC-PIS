import { ProgramsChoices, CivilStatusChoices, SexChoices } from '../static/choices'; 

import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  FormHelperText,
  InputLabel, 
  MenuItem, 
  Select, 
  Typography, 
  Grid, 
  Paper 
} from '@mui/material';

const ProfileSetup = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    middle_name: initialData.middle_name || '',
    address: initialData.address || '',
    email: initialData.email || '',
    contact_number: initialData.contact_number || '',
    civil_status: initialData.civil_status || '',
    sex: initialData.sex || '',
    program: initialData.program || '',
    ...initialData
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.contact_number) newErrors.contact_number = 'Contact number is required';
    if (!formData.civil_status) newErrors.civil_status = 'Civil status is required';
    if (!formData.sex) newErrors.sex = 'Sex is required';
    if (!formData.program) newErrors.program = 'Program is required';
    if (!formData.address) newErrors.address = 'Address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profile Setup
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              error={!!errors.first_name}
              helperText={errors.first_name}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Middle Name"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              error={!!errors.last_name}
              helperText={errors.last_name}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Contact Number"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              error={!!errors.contact_number}
              helperText={errors.contact_number}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required error={!!errors.civil_status}>
              <InputLabel>Civil Status</InputLabel>
              <Select
                name="civil_status"
                value={formData.civil_status}
                label="Civil Status"
                onChange={handleChange}
              >
                {CivilStatusChoices.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.civil_status && <FormHelperText>{errors.civil_status}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required error={!!errors.sex}>
              <InputLabel>Sex</InputLabel>
              <Select
                name="sex"
                value={formData.sex}
                label="Sex"
                onChange={handleChange}
              >
                {SexChoices.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.sex && <FormHelperText>{errors.sex}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required error={!!errors.program}>
              <InputLabel>Program</InputLabel>
              <Select
                name="program"
                value={formData.program}
                label="Program"
                onChange={handleChange}
              >
                {ProgramsChoices.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.program && <FormHelperText>{errors.program}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              sx={{ mt: 2 }}
            >
              Save Profile
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProfileSetup; 