import * as React from 'react';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

const MyDatePicker = ({ name, control, setValue, label }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            label={label}
            format="MM/DD/YYYY"
            value={field.value ? dayjs(field.value) : null}
            onChange={(date) => {
              if (date) {
                const formattedDate = dayjs(date).format('MM/DD/YYYY');
                setValue(name, formattedDate, { shouldValidate: true });
                field.onChange(formattedDate);
              } else {
                setValue(name, null, { shouldValidate: true });
                field.onChange(null);
              }
            }}
            slotProps={{
              textField: {
                error: !!error,
                helperText: error ? error.message : '',
                sx: {
                  marginLeft: '10px',
                  marginRight: '10px',
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-error': {
                      borderColor: 'red',
                    },
                  },
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