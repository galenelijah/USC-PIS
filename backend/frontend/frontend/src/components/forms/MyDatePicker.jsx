import * as React from 'react';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { TextField } from '@mui/material';

const MyDatePicker = ({ name, control, label, required, error, helperText }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <DatePicker
            label={label}
            format="YYYY-MM-DD"
            value={field.value ? dayjs(field.value) : null}
            onChange={(newValue) => {
              if (newValue) {
                const formattedDate = dayjs(newValue).format('YYYY-MM-DD');
                field.onChange(formattedDate);
              } else {
                field.onChange(null);
              }
            }}
            slotProps={{
              textField: {
                required: required,
                error: !!error,
                helperText: helperText || '',
                sx: {
                  marginLeft: '10px',
                  marginRight: '10px',
                  width: 'calc(100% - 20px)',
                },
              },
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
};

export default MyDatePicker; 