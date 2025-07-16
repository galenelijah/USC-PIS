import React from 'react';
import { TextField } from '@mui/material';
import { Controller } from 'react-hook-form';

const MyTextField = ({
  name,
  label,
  control,
  required = false,
  error = null,
  type = 'text',
  multiline = false,
  rows = 1,
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field, fieldState: { error: fieldError } }) => {
        // Debug logging
        console.log(`Field ${name}:`, field.value);
        return (
          <TextField
            {...field}
            label={label}
            required={required}
            error={!!error || !!fieldError}
            helperText={error?.message || fieldError?.message}
            fullWidth
            type={type}
            multiline={multiline}
            rows={rows}
            {...props}
          />
        );
      }}
    />
  );
};

export default MyTextField; 