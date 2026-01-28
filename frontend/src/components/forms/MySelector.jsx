import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { Controller } from 'react-hook-form';

const MySelector = ({
  name,
  label,
  control,
  options,
  required = false,
  error = null,
  hint = '',
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field, fieldState: { error: fieldError } }) => (
        <FormControl 
          fullWidth 
          required={required} 
          error={!!error || !!fieldError}
        >
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            label={label}
            {...props}
          >
            {(options || []).map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(error || fieldError || hint) && (
            <FormHelperText>
              {error?.message || fieldError?.message || hint}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

export default MySelector; 
