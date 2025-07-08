import React from 'react';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TextField } from '@mui/material';
import dayjs from 'dayjs';

const MyDatePicker = ({
  name,
  label,
  control,
  required = false,
  error = null,
  ...props
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        defaultValue={null}
        render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
          <DatePicker
            label={label}
            value={value ? dayjs(value) : null}
            onChange={(newValue) => {
              onChange(newValue ? newValue.toDate() : null);
            }}
            slotProps={{
              textField: {
                required,
                error: !!error || !!fieldError,
                helperText: error?.message || fieldError?.message,
                fullWidth: true,
              },
            }}
            {...props}
          />
        )}
      />
    </LocalizationProvider>
  );
};

export default MyDatePicker; 