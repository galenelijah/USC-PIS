import * as React from 'react';
import TextField from '@mui/material/TextField';
import { Controller } from 'react-hook-form';

export default function MyTextField(props) {
    const { id, label, name, control, } = props;
    return (
        <Controller
            name={name}
            control={control}
            render={({
                field: { onChange, value },
                fieldState: { error },
                formState,
            }) => (
                <TextField sx={{ marginLeft: "10px", marginRight: "10px" }}
                    id={id}
                    onChange={onChange}
                    value={value ?? ""}
                    label={label}
                    variant="outlined"
                    className="myForm"
                    error={!!error}
                    helperText={error?.message}
                    autoComplete="off"  
                />
            )}
        />
    );
} 