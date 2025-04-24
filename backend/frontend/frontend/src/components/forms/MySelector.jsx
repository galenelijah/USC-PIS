import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Controller } from 'react-hook-form';

export default function MySelector({ options, label, name, control, required, error, helperText }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          options={options || []}
          value={field.value ? options.find(option => option.label === field.value) || null : null}
          onChange={(_, newValue) => {
            field.onChange(newValue ? newValue.label : '');
          }}
          getOptionLabel={(option) => {
            // Handle both string values and object values with label property
            return typeof option === 'string' ? option : option?.label || '';
          }}
          isOptionEqualToValue={(option, value) => {
            // Handle both string values and object values
            if (typeof value === 'string') {
              return option.label === value;
            }
            return option.label === value?.label;
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              required={required}
              error={!!error}
              helperText={helperText || ''}
              sx={{
                marginLeft: '10px',
                marginRight: '10px',
                width: 'calc(100% - 20px)',
              }}
            />
          )}
        />
      )}
    />
  );
} 