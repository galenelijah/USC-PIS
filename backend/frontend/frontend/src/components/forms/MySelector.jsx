import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Controller } from 'react-hook-form';

export default function MySelector({ options, label, setValue, name, control }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          options={options}
          value={
            options.find((option) => option.label === field.value) || null
          }
          getOptionLabel={(option) => option?.label || ''}
          isOptionEqualToValue={(option, value) => option?.label === value?.label}
          onChange={(event, newValue) => {
            const selectedValue = newValue ? newValue.label : '';
            setValue(name, selectedValue, { shouldValidate: true });
            field.onChange(selectedValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={!!error}
              helperText={error ? error.message : ''}
            />
          )}
          sx={{
            marginLeft: '10px',
            marginRight: '10px',
            width: '100%',
          }}
        />
      )}
    />
  );
} 