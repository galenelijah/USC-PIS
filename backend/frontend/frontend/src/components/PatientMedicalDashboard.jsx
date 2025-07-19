import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  Alert,
  CircularProgress
} from "@mui/material";
import { 
  Person, 
  LocalHospital, 
  Favorite, 
  Warning, 
  Phone, 
  Email, 
  Home,
  School,
  Badge
} from "@mui/icons-material";
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authentication/authSlice';
import BMI_male_1 from "../assets/images/BMI_Visual/BMI_male_1.png";
import BMI_male_2 from "../assets/images/BMI_Visual/BMI_male_2.png";
import BMI_male_3 from "../assets/images/BMI_Visual/BMI_male_3.png";
import BMI_male_4 from "../assets/images/BMI_Visual/BMI_male_4.png";
import BMI_male_5 from "../assets/images/BMI_Visual/BMI_male_5.png";
import BMI_female_1 from "../assets/images/BMI_Visual/BMI_female_1.png";
import BMI_female_2 from "../assets/images/BMI_Visual/BMI_female_2.png";
import BMI_female_3 from "../assets/images/BMI_Visual/BMI_female_3.png";
import BMI_female_4 from "../assets/images/BMI_Visual/BMI_female_4.png";
import BMI_female_5 from "../assets/images/BMI_Visual/BMI_female_5.png";

const PatientMedicalDashboard = () => {
  const currentUser = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate BMI if height and weight are available
  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    if (isNaN(weightNum) || isNaN(heightNum) || heightNum === 0) return null;
    const heightInMeters = heightNum / 100; // Convert cm to meters
    return (weightNum / (heightInMeters * heightInMeters)).toFixed(1);
  };

  // Function to determine BMI category and corresponding image
  const getBMIInfo = (bmi, sex) => {
    if (!bmi || isNaN(bmi)) return { category: "Not Available", image: null, color: "#f0f0f0" };

    const numericBMI = parseFloat(bmi);
    const isMale = sex?.toLowerCase() === "male";

    if (numericBMI < 18.5)
      return { 
        category: "Underweight", 
        image: isMale ? BMI_male_1 : BMI_female_1,
        color: "#3ba1d9"
      };
    if (numericBMI >= 18.5 && numericBMI <= 24.9)
      return { 
        category: "Healthy Weight", 
        image: isMale ? BMI_male_2 : BMI_female_2,
        color: "#18a951"
      };
    if (numericBMI >= 25 && numericBMI <= 29.9)
      return { 
        category: "Overweight", 
        image: isMale ? BMI_male_3 : BMI_female_3,
        color: "#f8d64c"
      };
    if (numericBMI >= 30 && numericBMI <= 34.9)
      return { 
        category: "Obesity", 
        image: isMale ? BMI_male_4 : BMI_female_4,
        color: "#e69d68"
      };
    if (numericBMI >= 35)
      return { 
        category: "Severe Obesity", 
        image: isMale ? BMI_male_5 : BMI_female_5,
        color: "#f0432e"
      };

    return { category: "Not Available", image: null, color: "#f0f0f0" };
  };

  // Helper function to parse comma-separated strings to arrays
  const parseStringToArray = (str) => {
    if (!str || typeof str !== 'string') return [];
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  // Calculate user age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Please log in to view your medical dashboard.
        </Alert>
      </Container>
    );
  }

  const userAge = calculateAge(currentUser.birthday);
  const userBMI = calculateBMI(currentUser.weight, currentUser.height);
  const bmiInfo = getBMIInfo(userBMI, currentUser.sex);

  // Parse medical information arrays
  const illnesses = parseStringToArray(currentUser.illness);
  const allergies = parseStringToArray(currentUser.allergies);
  const medications = parseStringToArray(currentUser.medications);
  const childhoodDiseases = parseStringToArray(currentUser.childhood_diseases);
  const specialNeeds = parseStringToArray(currentUser.special_needs);
  const existingConditions = parseStringToArray(currentUser.existing_medical_condition);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocalHospital sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Patient Medical Dashboard
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              {currentUser.first_name} {currentUser.middle_name} {currentUser.last_name}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column - BMI and Vital Signs */}
        <Grid item xs={12} md={4}>
          {/* BMI Card */}
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Favorite color="primary" />
                BMI Analysis
              </Typography>
              
              {bmiInfo.image ? (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <img
                    src={bmiInfo.image}
                    alt={bmiInfo.category}
                    style={{ 
                      width: "auto", 
                      height: "200px", 
                      borderRadius: "10px", 
                      objectFit: "cover" 
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', mb: 2, height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    No BMI data available
                  </Typography>
                </Box>
              )}

              <Chip
                label={bmiInfo.category}
                sx={{
                  width: '100%',
                  backgroundColor: bmiInfo.color,
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2
                }}
              />

              <Grid container spacing={2}>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">HEIGHT</Typography>
                  <Typography variant="h6">{currentUser.height || 'N/A'} cm</Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">WEIGHT</Typography>
                  <Typography variant="h6">{currentUser.weight || 'N/A'} kg</Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">BMI</Typography>
                  <Typography variant="h6">{userBMI || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Vital Signs Card */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="primary" />
                Vital Signs
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Latest measurements
              </Typography>
              
              <Box sx={{ '& > *': { mb: 1 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Temperature:</Typography>
                  <Typography variant="body2">Not recorded</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Pulse Rate:</Typography>
                  <Typography variant="body2">Not recorded</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Blood Pressure:</Typography>
                  <Typography variant="body2">Not recorded</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Vision:</Typography>
                  <Typography variant="body2">Not recorded</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Patient Information */}
        <Grid item xs={12} md={8}>
          {/* Basic Information Card */}
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person color="primary" />
                Basic Information
              </Typography>
              
              <Grid container spacing={3}>
                {/* Profile Picture */}
                <Grid item xs={12} sm={3}>
                  <Avatar
                    src={currentUser.profile_picture}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto',
                      border: '3px solid #e0e0e0'
                    }}
                  >
                    <Person sx={{ fontSize: 60 }} />
                  </Avatar>
                </Grid>

                {/* Personal Details */}
                <Grid item xs={12} sm={9}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="caption" color="textSecondary">Full Name</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {currentUser.last_name}, {currentUser.first_name} {currentUser.middle_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography variant="caption" color="textSecondary">Age</Typography>
                      <Typography variant="body1" fontWeight="medium">{userAge || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography variant="caption" color="textSecondary">Sex</Typography>
                      <Typography variant="body1" fontWeight="medium">{currentUser.sex || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">ID Number</Typography>
                      <Typography variant="body1" fontWeight="medium">{currentUser.id_number || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">Program</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {currentUser.year_level && currentUser.course 
                          ? `${currentUser.year_level} - ${currentUser.course}`
                          : 'N/A'
                        }
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Contact Information */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Email fontSize="small" /> Email
                  </Typography>
                  <Typography variant="body2">{currentUser.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone fontSize="small" /> Phone
                  </Typography>
                  <Typography variant="body2">{currentUser.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Home fontSize="small" /> Permanent Address
                  </Typography>
                  <Typography variant="body2">{currentUser.address_permanent || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">Religion</Typography>
                  <Typography variant="body2">{currentUser.religion || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Emergency Contacts */}
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Emergency Contacts
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Father's Name</Typography>
                  <Typography variant="body2">{currentUser.father_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Mother's Name</Typography>
                  <Typography variant="body2">{currentUser.mother_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Emergency Contact</Typography>
                  <Typography variant="body2">{currentUser.emergency_contact || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Emergency Number</Typography>
                  <Typography variant="body2">{currentUser.emergency_contact_number || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Medical Information Card */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalHospital color="primary" />
                Medical Information
              </Typography>

              <Grid container spacing={3}>
                {/* Current Illnesses */}
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Current Illnesses
                  </Typography>
                  <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                    {illnesses.length > 0 ? (
                      illnesses.map((illness, index) => (
                        <Chip
                          key={index}
                          label={illness}
                          size="small"
                          variant="outlined"
                          sx={{ m: 0.5, display: 'block', width: 'fit-content' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No illnesses recorded
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Allergies */}
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Allergies
                  </Typography>
                  <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                    {allergies.length > 0 ? (
                      allergies.map((allergy, index) => (
                        <Chip
                          key={index}
                          label={allergy}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ m: 0.5, display: 'block', width: 'fit-content' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No allergies recorded
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Current Medications */}
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Current Medications
                  </Typography>
                  <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                    {medications.length > 0 ? (
                      medications.map((medication, index) => (
                        <Chip
                          key={index}
                          label={medication}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ m: 0.5, display: 'block', width: 'fit-content' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No medications recorded
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Childhood Diseases */}
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Childhood Diseases
                  </Typography>
                  <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                    {childhoodDiseases.length > 0 ? (
                      childhoodDiseases.map((disease, index) => (
                        <Chip
                          key={index}
                          label={disease}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ m: 0.5, display: 'block', width: 'fit-content' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No childhood diseases recorded
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Special Needs */}
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Special Needs
                  </Typography>
                  <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                    {specialNeeds.length > 0 ? (
                      specialNeeds.map((need, index) => (
                        <Chip
                          key={index}
                          label={need}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ m: 0.5, display: 'block', width: 'fit-content' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No special needs recorded
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Existing Medical Conditions */}
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Medical Conditions
                  </Typography>
                  <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                    {existingConditions.length > 0 ? (
                      existingConditions.map((condition, index) => (
                        <Chip
                          key={index}
                          label={condition}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ m: 0.5, display: 'block', width: 'fit-content' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No medical conditions recorded
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PatientMedicalDashboard;