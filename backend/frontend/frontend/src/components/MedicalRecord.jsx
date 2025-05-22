import React, { useEffect, useState } from "react";
import { Typography } from "@mui/material";
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
import ReadOnlyTextField from "./forms/ReadOnlyTextField";
import { Box, CircularProgress } from '@mui/material';
import { healthRecordsService } from '../services/api';

const defaultUserData = {
    height: "",
    weight: "",
    bmi: "",
    sex: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    profile_picture: "",
    age: "",
    address_permanent: "",
    address_present: "",
    contact_number: "",
    email: "",
    birthday: "",
    id_number: "",
    program: "",
    year_level: "",
    civil_status: "",
    religion: "",
    illnesses: [],
    allergies: [],
    existing_medical_condition: [],
    surgical_procedures: [],
    hospitalization_history: [],
    childhood_diseases: [],
    special_needs: [],
    medications: [],
};

const MedicalRecord = ({ medicalRecordId }) => {
    const [userData, setUserData] = useState(defaultUserData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!medicalRecordId) return;
        setLoading(true);
        setError(null);
        const fetchRecord = async () => {
            try {
                const response = await healthRecordsService.getById(medicalRecordId);
                const data = response?.data;
                if (data) {
                    // Map backend fields to userData fields as best as possible
                    setUserData(prev => ({
                        ...prev,
                        ...data.patient, // patient info
                        ...data, // record info (diagnosis, treatment, etc.)
                        // Map/parse any nested or custom fields as needed
                    }));
                }
            } catch (err) {
                setError('Failed to load medical record.');
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();
    }, [medicalRecordId]);

    // Function to determine BMI category and corresponding image
    const getBMIInfo = (bmi, sex) => {
        if (!bmi || isNaN(bmi)) return { category: "Not specified", image: null };
        const numericBMI = parseFloat(bmi);
        const isMale = sex?.toLowerCase() === "male";
        if (numericBMI < 18.5)
            return { category: "Underweight", image: isMale ? BMI_male_1 : BMI_female_1 };
        if (numericBMI >= 18.5 && numericBMI <= 24.9)
            return { category: "Healthy Weight", image: isMale ? BMI_male_2 : BMI_female_2 };
        if (numericBMI >= 25 && numericBMI <= 29.9)
            return { category: "Overweight", image: isMale ? BMI_male_3 : BMI_female_3 };
        if (numericBMI >= 30 && numericBMI <= 34.9)
            return { category: "Obesity", image: isMale ? BMI_male_4 : BMI_female_4 };
        if (numericBMI >= 35)
            return { category: "Severe Obesity", image: isMale ? BMI_male_5 : BMI_female_5 };
        return { category: "Not specified", image: null };
    };
    const bmiInfo = getBMIInfo(userData.bmi, userData.sex);

    if (!medicalRecordId) return null;
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}><CircularProgress /></Box>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <>
        {!loading && (<>
            <Box className="Box1" sx={{ flexDirection: "row", margin: "60px 10px 10px 10px" }}>
                <Box 
                    className="Box2" 
                    sx={{ 
                        width: "30%", 
                        margin: 1, 
                        minWidth: "250px", 
                    }}
                >
                    <Box sx={{boxShadow: 5, boxShadow: 5, alignSelf: "flex-start", borderRadius: "5px",paddingBottom: 1, marginBottom: 2}}>
                        <Box sx={{ height: "auto", width: "auto", backgroundColor: "white", padding: "5px", borderRadius: "5px", margin: "0px 15px 0px 15px" }}> 
                            {bmiInfo.image ? (
                                <img
                                    src={bmiInfo.image}
                                    alt={bmiInfo.category}
                                    style={{ width: "auto", height: "300px", borderRadius: "10px", objectFit: "cover", paddingTop: "20px", paddingBottom: "20px" }}
                                />
                            ) : (
                                <Typography variant="h6" color="gray">
                                    No Image Available
                                </Typography>
                            )}

                            <Box
                                sx={{
                                    fontSize: "small",
                                    backgroundColor: (() => {
                                        switch (bmiInfo.category) {
                                            case "Underweight":
                                                return "#3ba1d9";
                                            case "Healthy Weight":
                                                return "#18a951";
                                            case "Overweight":
                                                return "#f8d64c";
                                            case "Obesity":
                                                return "#e69d68";
                                            case "Severe Obesity":
                                                return "#f0432e";
                                            default:
                                                return "#f0f0f0"; // Default color for "Not specified"
                                        }
                                    })(),
                                    color: "white", // Optional: Ensure text is readable on colored backgrounds
                                    padding: "5px",
                                    borderRadius: "5px",
                                    textAlign: "center",
                                }}
                            >
                                {bmiInfo.category}
                            </Box>

                        </Box>

                        <Box sx={{ marginX: 2, display: "flex", flexDirection: "column", margin: 2 }}>
                            <table width={"100%"}>
                                <tbody>
                                    <tr>
                                        <th>HEIGHT</th>
                                        <th>WEIGHT</th>
                                        <th>BMI</th>
                                    </tr>
                                    <tr>
                                        <td>{userData.height} cm</td>
                                        <td>{userData.weight} kg</td>
                                        <td>{userData.bmi}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Box>

                    </Box>
                    <Box sx={{boxShadow: 5, boxShadow: 5, alignSelf: "flex-start", borderRadius: "5px",paddingBottom: 1,}}>
                        <Box
                            sx={{
                                backgroundColor: "#0e3c00",
                                width: "100%",
                                color: "white",
                                borderTopRightRadius: "5px",
                                borderTopLeftRadius: "5px",
                            }}
                        >
                            Vital Signs
                        </Box>
                        <Box sx={{ padding: 2, display: "flex", flexDirection: "column", }}>
                            <table width={"100%"}>
                                <tbody>
                                    <tr>
                                        <th>Temperature</th>
                                        <td>{userData.blood_pressure}</td>
                                    </tr>
                                    <tr>
                                        <th>Pulse Rate</th>
                                        <td>{userData.blood_pressure}</td>
                                    </tr>
                                    <tr>
                                        <th>Blood Pressure</th>
                                        <td>{userData.blood_pressure}</td>
                                    </tr>
                                    <tr>
                                        <th>Vision</th>
                                        <td>{userData.blood_pressure}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Box>
                    </Box>

                </Box>

                <Box 
                    className="Box2" 
                    sx={{ 
                        width: "70%", 
                        margin: 1, 
                        minWidth: "700px", 
                        boxShadow: 5,
                        alignSelf: "flex-start", // This prevents it from stretching to match other box
                        paddingBottom: 2,
                    }}  
                >
                    <Box sx={{ backgroundColor: "#0e3c00", width: "100%", color: "white", borderTopRightRadius: "5px", borderTopLeftRadius: "5px" }}>
                        Basic Information
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", paddingX: 2, paddingTop: 2, }}>
                        <Box>
                            {userData.profile_picture ? (
                                <img
                                    src={userData.profile_picture}
                                    alt="Profile"
                                    style={{
                                        width: "auto",
                                        height: "130px",
                                        objectFit: "cover",
                                        borderRadius: "7px",
                                        margin: "0px 0px 0px 10px",
                                    }}
                                />
                            ) : (
                                <Typography variant="h6" color="gray">
                                    No Profile Picture
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ marginX: 1, display: "flex", flexDirection: "column", width: "100%",}}>
                            <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                                <ReadOnlyTextField
                                    id="Full Name"
                                    label="Full Name"
                                    defaultValue={`${userData.last_name}, ${userData.first_name}  ${userData.middle_name}`}
                                    width={"100%"}
                                />
                                <ReadOnlyTextField
                                    id="Age"
                                    label="Age"
                                    defaultValue={userData.age}
                                    width={"100px"}  
                                />
                                <ReadOnlyTextField
                                    id="Sex"
                                    label="Sex"
                                    defaultValue={userData.sex}
                                    width={"100px"}  
                                />
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                                <ReadOnlyTextField
                                    id="ID number"
                                    label="ID number"
                                    defaultValue={userData.id_number}
                                    width={"120px"}  
                                />
                                <ReadOnlyTextField
                                    id="Program"
                                    label="Program"
                                    defaultValue={`${userData.year_level} - ${userData.program} `}
                                    width={"100%"}
                                />  
                            </Box>
                            
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", paddingX: 2, marginRight: 1 }}>
                        <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                            <ReadOnlyTextField
                                id="Email"
                                label="Email"
                                defaultValue={userData.email}
                                width={"50%"}
                            />
                            <ReadOnlyTextField
                                id="phone"
                                label="Phone Number"
                                defaultValue={userData.phone}
                                width={"50%"}
                            />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                            <ReadOnlyTextField
                                id="Address (Permanent)"
                                label="Address (Permanent)"
                                defaultValue={userData.address_permanent}
                                width={"80%"}
                            />
                            <ReadOnlyTextField
                                id="Religion"
                                label="Religion"
                                defaultValue={userData.religion}
                                width={"20%"}
                            />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                            <ReadOnlyTextField
                                id="Address (Present)"
                                label="Address (Present)"
                                defaultValue={userData.address_present}
                                width={"80%"}
                            />
                            <ReadOnlyTextField
                                id="Civil Status"
                                label="Civil Status"
                                defaultValue={userData.civil_status}
                                width={"20%"}
                            />
                        </Box>
                        
                        <Box sx={{  width: "100%", borderTopRightRadius: "5px", borderTopLeftRadius: "5px", marginTop:2}}>
                           Emergency Contact
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                            <ReadOnlyTextField
                                id="Address (Present)"
                                label="Father's Name"
                                defaultValue={userData.father_name}
                                width={"70%"}
                            />
                            <ReadOnlyTextField
                                id="Civil Status"
                                label="Father's Contact"
                                defaultValue={userData.father_contact}
                                width={"30%"}
                            />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                            <ReadOnlyTextField
                                id="Address (Present)"
                                label="Mother's Name"
                                defaultValue={userData.mother_name}
                                width={"70%"}
                            />
                            <ReadOnlyTextField
                                id="Civil Status"
                                label="Mother's Contact"
                                defaultValue={userData.mother_contact}
                                width={"30%"}
                            />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                            <ReadOnlyTextField
                                id="Address (Present)"
                                label="Guardian's Name"
                                defaultValue={userData.guardian_name}
                                width={"70%"}
                            />
                            <ReadOnlyTextField
                                id="Civil Status"
                                label="Guardian's Contact"
                                defaultValue={userData.guardian_contact}
                                width={"30%"}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>

{/* --------------------------------------------------------------------------------------------------------- */}

            <Box className="Box1" sx={{flexDirection: "row", margin: "0px 10px 10px 10px" }}>
                <Box 
                    className="Box2" 
                    sx={{ 
                        width: "40%", 
                        margin: 1, 
                        minWidth: "250px", 
                        boxShadow: 5,
                        alignSelf: "flex-start" // This prevents it from stretching to match other box
                    }}
                >
                    <Box
                        sx={{
                            backgroundColor: "#0e3c00",
                            width: "100%",
                            color: "white",
                            borderTopRightRadius: "5px",
                            borderTopLeftRadius: "5px",
                        }}
                    >
                        Physical Examination
                    </Box>
                    <Box sx={{ padding: 2, display: "flex", flexDirection: "column", }}>
                        <table width={"100%"}>
                            <tbody>
                                <tr>
                                    <th>ENT</th>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th>Heart</th>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th>Chest and Lungs</th>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th>Extremities</th>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th>GIT</th>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th>GUT</th>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th>Skin</th>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th>Deformities</th>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th>Remarks and Reccomendation</th>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </Box>
                </Box>

                <Box 
                    className="Box2" 
                    sx={{ 
                        width: "60%", 
                        margin: 1, 
                        minWidth: "250px", 
                        boxShadow: 5,
                        alignSelf: "flex-start" // This prevents it from stretching to match other box
                    }}
                >
                    <Box
                        sx={{
                            backgroundColor: "#0e3c00",
                            width: "100%",
                            color: "white",
                            borderTopRightRadius: "5px",
                            borderTopLeftRadius: "5px",
                        }}
                    >
                        Medical Information
                    </Box>

                    <Box sx={{ padding: 2, display: "flex", flexDirection: "row" }}>
                        <Box sx={{ width: "33%", margin: 1 }}>
                            <table width={"100%"}>
                                <thead>
                                    <tr>
                                        <th>Illnesses</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData.illnesses && userData.illnesses.length > 0 ? (
                                        userData.illnesses.map((illness, index) => (
                                            <tr key={index}>
                                                <td>{illness}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td>No illnesses recorded.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Box>
                        
                        <Box sx={{ width: "33%", margin: 1 }}>
                            <table width={"100%"}>
                                <thead>
                                    <tr>
                                        <th>Allergies</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData.allergies && userData.allergies.length > 0 ? (
                                        userData.allergies.map((allergy, index) => (
                                            <tr key={index}>
                                                <td>{allergy}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td>No allergies recorded.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Box>

                        <Box sx={{ width: "33%", margin: 1 }}> 
                            <table width={"100%"}>
                                <thead>
                                    <tr>
                                        <th>Existing Medical Conditions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData.existing_medical_condition && userData.existing_medical_condition.length > 0 ? (
                                        userData.existing_medical_condition.map((condition, index) => (
                                            <tr key={index}>
                                                <td>{condition}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td>No medical conditions recorded.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Box>

                    </Box>

                    <Box sx={{ padding: 2, display: "flex", flexDirection: "row" }}>
                        <Box sx={{ width: "33%", margin: 1 }}>
                            <table width={"100%"}>
                                <thead>
                                    <tr>
                                        <th>Childhood Diseases</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData.childhood_diseases && userData.childhood_diseases.length > 0 ? (
                                        userData.childhood_diseases.map((disease, index) => (
                                            <tr key={index}>
                                            <td>{disease}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td>No childhood diseases recorded.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Box>
                        
                        <Box sx={{ width: "33%", margin: 1 }}>
                            <table width={"100%"}>
                                <thead>
                                    <tr>
                                        <th>Special Needs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData.special_needs && userData.special_needs.length > 0 ? (
                                        userData.special_needs.map((need, index) => (
                                            <tr key={index}>
                                                <td>{need}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td>No special needs recorded.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Box>

                        <Box sx={{ width: "33%", margin: 1 }}> 
                            <table width={"100%"}>
                                <thead>
                                    <tr>
                                        <th>Medications</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData.medications && userData.medications.length > 0 ? (
                                        userData.medications.map((medication, index) => (
                                            <tr key={index}>
                                                <td>{medication}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td>No medications recorded.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Box>

                    </Box>

                    <Box sx={{ padding: 2, display: "flex", flexDirection: "row" }}>
                        
                        <Box sx={{ width: "50%", margin: 1 }}> 
                            <table width={"100%"}>
                                <thead>
                                    <tr>
                                        <th colSpan="2">Surgical Procedures</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData.surgical_procedures && userData.surgical_procedures.length > 0 ? (
                                        userData.surgical_procedures.map((procedure, index) => (
                                            <tr key={index}>
                                                <td style={{ width: "30%" }} >{procedure.date}</td>
                                                <td style={{ width: "70%" }} >{procedure.details}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2">No surgical procedures recorded.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Box>

                        <Box sx={{ width: "50%", margin: 1 }}> 
                            <table width={"100%"}>
                                <thead>
                                    <tr>
                                        <th colSpan="2">Hospitalization History</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData.hospitalization_history && userData.hospitalization_history.length > 0 ? (
                                        userData.hospitalization_history.map((entry, index) => (
                                            <tr key={index}>
                                                <td style={{ width: "30%" }} >{entry.date}</td>
                                                <td style={{ width: "70%" }} >{entry.details}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2">No hospitalization history recorded.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Box>

                    </Box>
                </Box>
            </Box>
        </>)}
            
        </>
    );
};

export default MedicalRecord;