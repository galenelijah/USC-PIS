import React from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

const ReadOnlyTextField = ({ id, label, defaultValue, width }) => {
    return (

        <TextField
            sx={{width: width, margin:1, }}
            id={id}
            label={label}
            defaultValue={defaultValue}
            slotProps={{
                input: {
                    readOnly: true,
                },
            }}
        />

    );
};

export default ReadOnlyTextField;