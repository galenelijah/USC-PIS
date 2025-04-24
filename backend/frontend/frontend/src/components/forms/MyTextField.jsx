import * as React from 'react';
import TextField from '@mui/material/TextField';
import { Controller } from 'react-hook-form';

export default function MyTextField(props) {
    const { id, label, name, control, required, error, helperText, type = "text" } = props;
    const uniqueId = id || name;
    return (
        <Controller
            name={name}
            control={control}
            render={({
                field: { onChange, value, ref },
            }) => (
                <TextField
                    sx={{ 
                        marginLeft: "10px", 
                        marginRight: "10px",
                        width: 'calc(100% - 20px)'
                    }}
                    id={uniqueId}
                    onChange={onChange}
                    value={value || ""}
                    label={label}
                    variant="outlined"
                    className="myForm"
                    error={!!error}
                    helperText={helperText}
                    autoComplete="off"
                    required={required}
                    type={type}
                    inputRef={ref}
                />
            )}
        />
    );
} 