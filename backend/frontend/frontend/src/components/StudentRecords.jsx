import { Box, TextField } from "@mui/material";
import ProfileCard from "./forms/ProfileCard";
import { React, useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

const StudentRecords = () => {
    const [myData, setMyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const GetData = () => {
        axios.get(`/api/users/`).then((res) => {
            setMyData(res.data);
            setLoading(false);
        }).catch((error) => {
            console.error('Error fetching users:', error);
            setLoading(false);
        });
    };

    useEffect(() => {
        GetData();
    }, []);

    // Filter records based on search query
    const filteredData = myData.filter((item) =>
        `${item.id} ${item.email}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box className="list">
            {/* Search Bar */}
            <TextField
                label="Search Student"
                variant="outlined"
                fullWidth
                margin="normal"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {loading ? (
                <p>Loading data.....</p>
            ) : (
                <div>
                    {filteredData.length > 0 ? (
                        filteredData.map((item, index) => (
                            <ProfileCard
                                key={index}
                                className="profile-card"
                                name={item.id}
                                course={item.email}
                            />
                        ))
                    ) : (
                        <p>No records found</p>
                    )}
                </div>
            )}
        </Box>
    );
};

export default StudentRecords; 